// Pure AI timetable generation prompt - handles all optimization and constraints
export const generatePureAITimetablePrompt = (
  courses: any[],
  sessionsMeta: any[]
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

  // Prepare sessions list text
  const sessionsList = sessionsMeta
    .map((s: any) => `- ${s.session} (${s.date})`)
    .join("\n");

  return `You are an expert academic timetable generator. Your task is to create a PERFECT exam timetable that maximizes room utilization while strictly following all constraints. You must handle ALL optimization and constraint satisfaction yourself - no backend correction will be applied.

CRITICAL: This timetable will be used directly without any corrections. Every constraint must be satisfied perfectly.

COURSE DATA:
Total Courses: ${courses.length}
Available Sessions: ${sessionsMeta.length}

1. LARGE COURSES (${largeCourses.length}) - BLUE room only, alone:
${largeCourses.map((c) => `   - ${c.code}(${c.students} students) - ${c.department}`).join("\n")}

2. MEDIUM COURSES (${mediumCourses.length}) - Prefer RED room:
${mediumCourses.map((c) => `   - ${c.code}(${c.students} students) - ${c.department}`).join("\n")}

3. SMALL COURSES (${smallCourses.length}) - Flexible placement:
${smallCourses.map((c) => `   - ${c.code}(${c.students} students) - ${c.department}`).join("\n")}

DEPARTMENTS:
${departments
  .map((dept) => {
    const deptCourses = courses.filter((c) => c.department === dept);
    return `${dept} (${deptCourses.length} courses):
${deptCourses.map((c) => `   - ${c.code}(${c.students} students)`).join("\n")}`;
  })
  .join("\n\n")}

AVAILABLE SESSIONS:
${sessionsList}

STRICT ROOM CAPACITY RULES:

1. RED ROOM (96 STUDENT MAXIMUM):
   ALLOWED:
   ✓ ONE medium course (65-96 students) alone
   ✓ Multiple small courses if total ≤ 96
   ✓ Mixed small courses from different departments if total ≤ 96
   
   NOT ALLOWED:
   ✗ Large courses (>96 students)
   ✗ Total exceeding 96 students
   ✗ Medium course with any other course

2. BLUE ROOM (192 STUDENT MAXIMUM):
   ALLOWED:
   ✓ ONE large course alone
   ✓ TWO medium courses if total ≤ 192
   ✓ One medium course + small course(s) if total ≤ 192
   ✓ Multiple small courses if total ≤ 192
   
   NOT ALLOWED:
   ✗ Large course with any other course
   ✗ Total exceeding 192 students
   ✗ More than 2 medium courses

OPTIMIZATION STRATEGY:

Step 1: Schedule LARGE courses first
- Place each large course alone in BLUE room
- Use earliest available sessions
- Calculate utilization: (students/192) * 100

Step 2: Schedule MEDIUM courses
- Try RED room first (alone)
- If RED room unavailable, try BLUE room (alone or paired)
- For BLUE room pairing: ensure total ≤ 192
- Calculate utilization for each room

Step 3: Schedule SMALL courses
- Fill remaining space in both rooms
- Optimize for maximum utilization
- Can mix departments in same room
- Calculate final utilization

DEPARTMENT CONSTRAINT:
- Courses from the same department should be scheduled on different days when possible
- Priority: Large > Medium > Small for day separation

VALIDATION REQUIREMENTS:
Before outputting, verify:
□ All ${courses.length} courses scheduled exactly once
□ No room exceeds capacity (RED ≤ 96, BLUE ≤ 192)
□ Large courses alone in BLUE room
□ Medium courses properly allocated
□ Department courses on different days when possible
□ All totals and utilization percentages calculated correctly
□ No duplicate course assignments

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

CALCULATION EXAMPLES:
- RED room with 90 students: utilization = (90/96) * 100 = 93.8%
- BLUE room with 150 students: utilization = (150/192) * 100 = 78.1%

FINAL INSTRUCTIONS:
1. Follow the optimization strategy step by step
2. Calculate all totals and utilization percentages accurately
3. Verify all constraints are satisfied
4. Output ONLY the JSON timetable
5. Ensure every course is scheduled exactly once
6. Maximize room utilization while respecting all rules

Generate the complete, perfect timetable JSON now:`;
};

// Enhanced retry prompt for when AI needs to refine its output
export const generateRefinementPrompt = (
  courses: any[],
  sessionsMeta: any[],
  previousAttempt: string,
  specificIssues: string[]
) => {
  return `The previous timetable attempt had these issues that need to be fixed:
${specificIssues.map(issue => `- ${issue}`).join('\n')}

Previous attempt:
${previousAttempt}

Please generate a corrected timetable that addresses all these issues while following the same rules and constraints. Focus specifically on fixing the identified problems.`;
};
