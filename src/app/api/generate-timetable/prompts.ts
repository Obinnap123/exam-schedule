// Prompt templates for timetable generation
export const generatePhase1Prompt = (
  dbCourses: any[],
  totalSessions: number,
  sessionDetails: string
) => {
  // Sort and categorize courses by size
  const largeCourses = dbCourses
    .filter((c) => c.students > 96)
    .sort((a, b) => b.students - a.students);
  const mediumCourses = dbCourses
    .filter((c) => c.students >= 65 && c.students <= 96)
    .sort((a, b) => b.students - a.students);
  const smallCourses = dbCourses
    .filter((c) => c.students < 65)
    .sort((a, b) => b.students - a.students);

  const departments = Array.from(new Set(dbCourses.map((c) => c.department)));

  return `You are an academic exam scheduling expert. Generate a plan for exam timetable generation.
Think through each step carefully and methodically.

TASK:
Create a detailed plan for scheduling ${dbCourses.length} exams across ${totalSessions} available sessions.

⚠️ MANDATORY ROOM CAPACITY RULES ⚠️

1. RED ROOM (96 STUDENT MAXIMUM):
   ALLOWED:
   ✓ ONE medium course (65-96 students)
   Current medium courses:
   ${mediumCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join("\n")}

   NOT ALLOWED:
   - NO large courses (>96 students)
   - NO combinations exceeding 96
   - NO mixing different departments

2. BLUE ROOM (192 STUDENT MAXIMUM):
   ALLOWED:
   ✓ ONE large course alone
   Current large courses:
   ${largeCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join("\n")}
   ✓ TWO medium courses if total ≤ 192

   NOT ALLOWED:
   - NO combinations over 192 students
   - NO large courses with other courses
   - NO more than two courses per session

COURSES BY DEPARTMENT:
${departments
  .map((dept) => {
    const deptCourses = dbCourses.filter((c) => c.department === dept);
    return `${dept} (${deptCourses.length} courses):
${deptCourses.map((c) => `   - ${c.code}(${c.students} students)`).join("\n")}`;
  })
  .join("\n\n")}

AVAILABLE SESSIONS:
${sessionDetails}

SCHEDULING REQUIREMENTS:
1. Each course MUST be scheduled exactly once
2. Large courses MUST be alone in BLUE room
3. Medium courses prefer RED room, can pair in BLUE
4. Courses from same department on different days
5. Verify room capacity before each assignment
6. Calculate and show room utilization %

End your response with "PHASE 2 READY" when complete.`;
};

export const generatePhase2Prompt = (courses: any[], sessionsMeta: any[]) => {
  // Sort and categorize courses by size
  const largeCourses = courses
    .filter((c) => c.students > 96)
    .sort((a, b) => b.students - a.students);
  const mediumCourses = courses
    .filter((c) => c.students >= 65 && c.students <= 96)
    .sort((a, b) => b.students - a.students);
  const smallCourses = courses
    .filter((c) => c.students < 65)
    .sort((a, b) => b.students - a.students);

  const departments = Array.from(new Set(courses.map((c) => c.department)));

  // Prepare sessions list text
  const sessionsList = sessionsMeta
    .map((s: any) => `- ${s.session} (${s.date})`)
    .join("\n");

  // Create explicit placement instructions for large courses
  let largePlacementInstructions = '';
  if (largeCourses.length > 0) {
    largePlacementInstructions = `\n🚨 LARGE COURSE PLACEMENT INSTRUCTIONS (MUST FOLLOW):
These ${largeCourses.length} courses are TOO BIG for RED room (each >96 students):
${largeCourses.map((c, idx) => `   ${idx + 1}. ${c.code}(${c.students} students) → Place ALONE in session ${idx + 1}'s BLUE room`).join('\n')}

Each large course needs its OWN session's BLUE room. Do NOT combine them.
Do NOT put them in RED room - they are physically too large!`;
  }

  return `You are an expert timetable generator. Generate a valid timetable JSON following these rules exactly.

COURSES TO SCHEDULE (${courses.length} total):

🔴 LARGE COURSES (${largeCourses.length}) - Each MUST go ALONE in BLUE room:
${largeCourses.map((c) => `   - ${c.code}: ${c.students} students (>96, CANNOT fit in RED)`).join("\n") || '   None'}

🟡 MEDIUM COURSES (${mediumCourses.length}) - Can go in RED or BLUE:
${mediumCourses.map((c) => `   - ${c.code}: ${c.students} students (≤96, can fit in RED)`).join("\n") || '   None'}

🟢 SMALL COURSES (${smallCourses.length}) - Can go in RED or BLUE:
${smallCourses.map((c) => `   - ${c.code}: ${c.students} students`).join("\n") || '   None'}
${largePlacementInstructions}

⚠️ CRITICAL CAPACITY RULES - MUST NEVER VIOLATE:

🔴 RED ROOM RULES (ABSOLUTE MAX: 96 students):
   
   PLACEMENT RULE:
   ✓ Check EACH individual course BEFORE placing
   ✓ IF course.students > 96 → CANNOT go in RED (skip to BLUE)
   ✓ IF course.students ≤ 96 → Can place in RED if total won't exceed 96
   
   ALLOWED:
   ✓ Only courses where EACH course has ≤ 96 students
   ✓ Can combine multiple small courses if total ≤ 96
   ✓ Calculate: current_red_total + new_course_students ≤ 96
   
   ❌ FORBIDDEN - WILL CAUSE ERROR:
   ✗ NEVER place ANY course with >96 students in RED
   ✗ A course with 97+ students PHYSICALLY CANNOT FIT in RED room
   ✗ NEVER exceed 96 students total

🔵 BLUE ROOM RULES (ABSOLUTE MAX: 192 students):
   
   PLACEMENT RULE FOR LARGE COURSES (>96 students):
   ✓ IF course.students > 96 → MUST go in BLUE room ALONE (no other courses)
   ✓ Large course needs entire BLUE room to itself
   
   PLACEMENT RULE FOR SMALL/MEDIUM COURSES (≤96 students):
   ✓ Can place multiple small/medium courses if total ≤ 192
   ✓ BUT check if BLUE already has a large course (>96) - if yes, skip
   
   ALLOWED:
   ✓ ONE large course (>96) completely ALONE, OR
   ✓ Multiple small/medium courses (each ≤96) if total ≤ 192
   
   ❌ FORBIDDEN - WILL CAUSE ERROR:
   ✗ NEVER exceed 192 students total
   ✗ NEVER put large course (>96) with ANY other course
   ✗ NEVER add any course to BLUE that already has a large course

📋 PLACEMENT ALGORITHM (FOLLOW EXACTLY):
   For EACH course to place:
   
   Step 1: Check course size
   - IF course.students > 96:
     → Search for EMPTY BLUE room
     → Place course ALONE in BLUE
     → Mark that BLUE as "has large course"
     → NEVER try to put in RED
   
   Step 2: IF course.students ≤ 96:
     → Try RED first: if (red.total + course.students ≤ 96)
     → If RED full, try BLUE: if (blue.total + course.students ≤ 192 AND no large course in BLUE)
   
   Step 3: Verify totals don't exceed capacity

AVAILABLE SESSIONS (assign exams only to these):
${sessionsList}

❌ WRONG EXAMPLE (DO NOT DO THIS):
{
  "session": "Week 1 Monday Morning",
  "red": {
    "courses": [{"code": "LARGE101", "students": 130}],  // ❌ WRONG! 130 > 96
    "total": 130
  }
}

✅ CORRECT EXAMPLE:
{
  "session": "Week 1 Monday Morning",
  "red": {
    "courses": [{"code": "SMALL101", "students": 85}],  // ✅ Correct! 85 ≤ 96
    "total": 85,
    "utilization": "88.5%"
  },
  "blue": {
    "courses": [{"code": "LARGE101", "students": 130}],  // ✅ Correct! Large course alone
    "total": 130,
    "utilization": "67.7%"
  }
}

REQUIRED JSON FORMAT:
{
  "sessions": [
    {
      "session": "Week 1 Monday Morning",
      "date": "2025-09-28",
      "red": {
        "courses": [
          {"code": "COURSE1", "students": 90}
        ],
        "total": 90,
        "utilization": "93.8%"
      },
      "blue": {
        "courses": [
          {"code": "COURSE2", "students": 150}
        ],
        "total": 150,
        "utilization": "78.1%"
      }
    }
  ]
}

✅ VALIDATION CHECKLIST (verify BEFORE returning):
□ All ${courses.length} courses scheduled exactly once (NO MISSING COURSES!)
□ RED rooms: Check EACH course individually - NO course with >96 students in RED
□ RED rooms: Check total - every room total ≤ 96 students (NEVER EXCEED!)
□ Large courses (>96 students) are ALONE in BLUE rooms (no other courses)
□ BLUE rooms: Every room total ≤ 192 students (NEVER EXCEED!)
□ No large course combined with any other course
□ Each course appears exactly once (no duplicates, no missing courses)
□ Totals and utilization percentages calculated correctly
□ All sessions included in response

TRIPLE-CHECK CAPACITY BEFORE RETURNING:
- Go through EVERY session
- For RED room: 
  1. Check EACH course: Is ANY course >96 students? If YES, MOVE to BLUE
  2. Check total: Is total ≤ 96? If NO, redistribute courses
- For BLUE room: 
  1. Check if ANY course >96 students: If YES, is it ALONE? If NO, separate them
  2. Check total: Is total ≤ 192? If NO, move courses to other sessions
- If ANY violation found, FIX IT before returning

Generate the complete timetable JSON following this format exactly.`;
};

// NEW: Progressive building prompt that includes current timetable state
export const generateProgressivePrompt = (
  newCourses: any[],
  currentTimetable: any,
  sessionsMeta: any[],
  chunkNumber: number,
  totalChunks: number
) => {
  const largeCourses = newCourses.filter((c) => c.students > 96);
  const mediumCourses = newCourses.filter((c) => c.students >= 65 && c.students <= 96);
  const smallCourses = newCourses.filter((c) => c.students < 65);

  // Calculate current occupancy for each session
  const sessionOccupancy = currentTimetable.sessions.map((s: any) => {
    return {
      session: s.session,
      date: s.date,
      redUsed: s.red.total,
      redAvailable: 96 - s.red.total,
      blueUsed: s.blue.total,
      blueAvailable: 192 - s.blue.total,
      redCourses: s.red.courses.map((c: any) => `${c.code}(${c.students})`).join(', ') || 'Empty',
      blueCourses: s.blue.courses.map((c: any) => `${c.code}(${c.students})`).join(', ') || 'Empty'
    };
  });

  const sessionsList = sessionOccupancy
    .map((s: any) => 
      `- ${s.session}: RED [${s.redUsed}/96 used, ${s.redAvailable} free] ${s.redCourses} | BLUE [${s.blueUsed}/192 used, ${s.blueAvailable} free] ${s.blueCourses}`
    )
    .join('\n');

  // Count currently scheduled courses
  const currentlyScheduledCount = currentTimetable.sessions.reduce((count: number, s: any) => {
    return count + (s.red?.courses?.length || 0) + (s.blue?.courses?.length || 0);
  }, 0);

  return `You are building an exam timetable progressively. This is CHUNK ${chunkNumber}/${totalChunks}.

🔄 CURRENT TIMETABLE STATE (${currentlyScheduledCount} courses already scheduled):
${sessionsList}

📋 NEW COURSES TO ADD (${newCourses.length} courses):

LARGE COURSES (>96 students, MUST go alone in BLUE):
${largeCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join('\n') || '   None'}

MEDIUM COURSES (65-96 students, prefer RED):
${mediumCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join('\n') || '   None'}

SMALL COURSES (<65 students, can group):
${smallCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join('\n') || '   None'}

⚠️ CRITICAL CAPACITY RULES - MUST NEVER VIOLATE:

🔴 RED ROOM RULES (ABSOLUTE MAX: 96 students):
   
   BEFORE PLACING ANY COURSE IN RED:
   ✓ Check: Is course.students > 96?
   ✓ IF YES → SKIP RED, go to BLUE (large courses CANNOT fit in RED)
   ✓ IF NO → Check if (current_red_total + course.students ≤ 96)
   
   ALLOWED:
   ✓ Only courses where EACH individual course has ≤ 96 students
   ✓ Can combine multiple courses if total ≤ 96
   ✓ Any departments can mix
   
   ❌ FORBIDDEN - WILL CAUSE ERROR:
   ✗ NEVER place ANY single course with >96 students in RED
   ✗ A course with 100, 130, 140 students CANNOT physically fit in RED (max 96)
   ✗ NEVER exceed 96 students total

🔵 BLUE ROOM RULES (ABSOLUTE MAX: 192 students):
   
   PLACEMENT RULES:
   ✓ IF course.students > 96 (large course):
     → Find EMPTY BLUE room (no courses in it)
     → Place large course ALONE
     → Do NOT add any other courses to that BLUE
   
   ✓ IF course.students ≤ 96 (small/medium course):
     → Check: Does BLUE already have a large course (>96)?
     → IF YES: Skip this BLUE, find another
     → IF NO: Check if (current_blue_total + course.students ≤ 192)
   
   ❌ FORBIDDEN - WILL CAUSE ERROR:
   ✗ NEVER put large course (>96) with ANY other course
   ✗ NEVER add small course to BLUE that has large course
   ✗ NEVER exceed 192 students total

📋 PLACEMENT ALGORITHM FOR EACH NEW COURSE:
   
   Step 1: Is course.students > 96?
   - YES → Find EMPTY BLUE room, place ALONE, mark as "has large", move to next course
   - NO → Continue to Step 2
   
   Step 2: Try RED room first
   - IF (red.total + course.students ≤ 96) → Place in RED, update total
   - ELSE → Continue to Step 3
   
   Step 3: Try BLUE room
   - IF (BLUE has no large course AND blue.total + course.students ≤ 192) → Place in BLUE
   - ELSE → Try next session

🗓️ DEPARTMENT CONFLICTS:
   ✓ Try to schedule same department courses on different days when possible
   
🎯 YOUR TASK:
1. Look at the current timetable occupancy (see above)
2. Find best slots for each NEW course based on available capacity
3. Add the NEW courses to the appropriate sessions
4. Return the COMPLETE updated timetable with:
   ✅ ALL previously scheduled courses (from current state)
   ✅ ALL new courses from this chunk
   ✅ ALL sessions (even ones you didn't modify)

⚠️ CRITICAL: DO NOT DROP ANY COURSES! 
   - The current timetable has ${currentlyScheduledCount} courses
   - You are adding ${newCourses.length} new courses
   - Your response must have ${currentlyScheduledCount + newCourses.length} total courses
   - Keep ALL existing courses EXACTLY as they are
   - Only add the new courses to appropriate sessions

REQUIRED JSON FORMAT (return COMPLETE timetable with all sessions):
{
  "sessions": [
    {
      "session": "Week 1 Monday Morning",
      "date": "2025-09-28",
      "red": {
        "courses": [{"code": "CS101", "students": 85}, {"code": "CS102", "students": 10}],
        "total": 95,
        "utilization": "99.0%"
      },
      "blue": {
        "courses": [{"code": "CS201", "students": 150}],
        "total": 150,
        "utilization": "78.1%"
      }
    },
    ... (all sessions)
  ]
}

✅ VALIDATION BEFORE RETURNING:
□ ALL ${sessionsMeta.length} sessions present (even unmodified ones)
□ Exactly ${currentlyScheduledCount} previously scheduled courses still present (check current state above)
□ Exactly ${newCourses.length} NEW courses added exactly once
□ TOTAL courses in response = ${currentlyScheduledCount + newCourses.length} (previous + new)
□ Large courses (>96 students) are ALONE in BLUE rooms
□ RED rooms: Every room total ≤ 96 students
□ BLUE rooms: Every room total ≤ 192 students
□ No large course (>96) combined with any other course
□ Totals and utilization calculated correctly for all rooms

TRIPLE-CHECK CAPACITY:
- For each session you modified:
  - RED total ≤ 96? 
  - BLUE total ≤ 192?
  - If BLUE has >96 student course, is it ALONE?
- If ANY violation, FIX before returning

Generate the complete updated timetable JSON now.`;
};

export const generateSchedulingInfo = (
  courses: any[],
  totalSessions: number
) => {
  // Sort and categorize courses by size
  const largeCourses = courses
    .filter((c) => c.students > 96)
    .sort((a, b) => b.students - a.students);
  const mediumCourses = courses
    .filter((c) => c.students >= 65 && c.students <= 96)
    .sort((a, b) => b.students - a.students);
  const smallCourses = courses
    .filter((c) => c.students < 65)
    .sort((a, b) => b.students - a.students);

  const departments = Array.from(new Set(courses.map((c) => c.department)));

  return `
⚠️ TIMETABLE GENERATION REQUIREMENTS ⚠️

Total Courses: ${courses.length}
Available Sessions: ${totalSessions}
Minimum Sessions Needed: ${Math.ceil(courses.length / 2)}

COURSE BREAKDOWN:

1. LARGE COURSES (${largeCourses.length}):
${largeCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join("\n")}
   Rules:
   ✓ Must be alone in BLUE room
   ✓ Never combine with others
   ✓ Schedule first

2. MEDIUM COURSES (${mediumCourses.length}):
${mediumCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join("\n")}
   Rules:
   ✓ Prefer RED room alone
   ✓ Can pair in BLUE if total ≤ 192
   ✓ Schedule after large courses

DEPARTMENTS:
${departments
  .map((dept) => {
    const deptCourses = courses.filter((c) => c.department === dept);
    return `${dept} (${deptCourses.length} courses):
${deptCourses.map((c) => `   - ${c.code}(${c.students} students)`).join("\n")}`;
  })
  .join("\n\n")}

ROOM CAPACITIES:
1. RED ROOM (96 max):
   - ONE medium course per session
   - Never exceed 96 students total

2. BLUE ROOM (192 max):
   - ONE large course alone, or
   - TWO medium courses if total ≤ 192
   - Never exceed 192 students total

SCHEDULING RULES:
1. Each course exactly once
2. Large courses alone in BLUE
3. Medium courses properly allocated
4. Department exams on different days
5. Verify capacity before assignment`;
};
