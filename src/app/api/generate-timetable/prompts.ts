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

  return `You are an expert timetable generator. Generate a valid timetable JSON following these rules exactly.

COURSE LIST:

1. LARGE COURSES (BLUE room only, alone):
${largeCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join("\n")}

2. MEDIUM COURSES (prefer RED room):
${mediumCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join("\n")}

3. SMALL COURSES (can be grouped subject to capacity):
${smallCourses.map((c) => `   - ${c.code}(${c.students}) - ${c.department}`).join("\n")}

STRICT ROOM RULES:

1. RED ROOM (96 maximum):
   ALLOWED:
   ✓ Any combination of courses whose total ≤ 96 students
   ✓ Can mix different departments
   NOT ALLOWED:
   - NO large courses (>96 students)
   - NO totals over 96

2. BLUE ROOM (192 maximum):
   ALLOWED:
   ✓ ONE large course alone, OR
   ✓ Up to TWO MEDIUM courses if total ≤ 192, OR
   ✓ One MEDIUM plus SMALL course(s) if total ≤ 192, OR
   ✓ SMALL course(s) only if total ≤ 192
   NOT ALLOWED:
   - NO totals over 192
   - NO large courses with any other course

AVAILABLE SESSIONS (assign exams only to these):
${sessionsList}

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

VALIDATION CHECKLIST:
□ All courses scheduled exactly once
□ Large courses alone in BLUE
□ Medium courses properly allocated
□ Small courses placed respecting capacities and department constraints
□ No room over capacity (RED ≤ 96, BLUE ≤ 192)
□ Department exams on different days
□ Total courses = ${courses.length}

Generate the complete timetable JSON following this format exactly.

STRICTLY FOLLOW THE RULES. Do not omit any course from the list.`;
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
