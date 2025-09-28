// Prompt templates for timetable generation
export const generatePhase1Prompt = (dbCourses: any[], totalSessions: number, sessionDetails: string) => `
You are an academic exam scheduling expert. Generate a plan for exam timetable generation.
Think through each step carefully and methodically.

TASK:
Create a detailed plan for scheduling ${dbCourses.length} exams across ${totalSessions} available sessions.

⚠️ EXAM ROOM ALLOCATION RULES ⚠️

1. RED ROOM (STRICT 96 STUDENT LIMIT):
   ONE of these options ONLY:
   A) ONE medium course (65-96 students)
      Examples: MTH102(95), CSE301(90), MTH202(85)
   
   FORBIDDEN in RED room:
   ❌ Large courses like CSE101(120), ENG104(150)
   ❌ Any combination exceeding 96 students
   ❌ Mixing different departments in same session

2. BLUE ROOM (STRICT 192 STUDENT LIMIT):
   ONE of these options ONLY:
   A) ONE large course by itself:
      - CSE101(120) alone
      - ENG104(150) alone
      - CSE201(110) alone
   B) TWO medium courses if total ≤192:
      - Example: PHY203(70) + CSE302(75) = 145 ✓
      - NOT: MTH102(95) + CSE301(90) = 185 ❌
   
   FORBIDDEN in BLUE room:
   ❌ Any total over 192 students
   ❌ Large courses with any other course
   ❌ More than two courses total

CRITICAL SCHEDULING RULES:
1. Each course MUST be scheduled exactly once
2. Large courses (>96) MUST use BLUE room
3. NO mixing of large courses in same session
4. Medium courses (65-96) should be alone in RED
5. Small courses (<65) can be paired if totals allow
6. Department exams should be spread across days
7. Morning/afternoon sessions should be balanced

AVAILABLE SESSIONS:
${sessionDetails}

COURSE LIST WITH DETAILS:
${JSON.stringify(dbCourses, null, 2)}

REQUIRED OUTPUT:
1. Analysis of course sizes and constraints
2. Proposed scheduling approach:
   - How to handle large courses
   - Strategy for medium courses
   - Plan for pairing small courses
3. Potential scheduling conflicts to watch for
4. Department distribution plan
5. Room utilization strategy

End your response with "PHASE 2 READY" when complete.

Remember:
- NO course can exceed room capacity
- Each course must be scheduled exactly once
- Use rooms efficiently
- Track department distribution
- Consider exam conflicts
`;

export const generateSchedulingInfo = (courses: any[], totalSessions: number) => {
  // Sort and categorize courses by size
  const largeCourses = courses.filter(c => c.students > 96)
    .sort((a, b) => b.students - a.students);
  const mediumCourses = courses.filter(c => c.students > 65 && c.students <= 96)
    .sort((a, b) => b.students - a.students);
  const smallCourses = courses.filter(c => c.students <= 65)
    .sort((a, b) => b.students - a.students);

  return `
⚠️ COURSE SCHEDULING REQUIREMENTS:

1. LARGE COURSES (>96 students) - ${largeCourses.length} courses:
   ${largeCourses.map(c => `- ${c.code}(${c.students}) - ${c.department}`).join('\n   ')}
   ✓ Schedule each ALONE in BLUE room
   ❌ NEVER combine with other courses
   ❌ NEVER put in RED room

2. MEDIUM COURSES (65-96 students) - ${mediumCourses.length} courses:
   ${mediumCourses.map(c => `- ${c.code}(${c.students}) - ${c.department}`).join('\n   ')}
   ✓ Prioritize RED room (one per session)
   ✓ Can use BLUE if pairing medium courses
   ❌ Verify combined total ≤192 before pairing
   ❌ Don't schedule same department same day

DEPARTMENT DISTRIBUTION:
- Computer Science: Space out CSE courses
- Mathematics: Avoid MTH courses same day
- Physics: Separate PHY courses
- English: Single course, schedule freely

EXAMPLE VALID COMBINATIONS:
RED ROOM (96 max):
✓ One medium course alone
✓ Two small courses (≤96 total)
❌ Any large course
❌ Three or more courses

BLUE ROOM (192 max):
✓ One large course alone
✓ Two medium courses (≤192)
✓ Two-three small courses (≤192)
❌ Large course with others
❌ More than 3 courses

SCHEDULING SEQUENCE:
Total sessions: ${totalSessions}
Courses to schedule: ${courses.length} (each ONCE only)

1. FIRST: Schedule large courses in BLUE room
   - CSE101(120) alone
   - ENG104(150) alone
   - CSE201(110) alone

2. SECOND: Schedule medium courses
   - MTH102(95) in RED
   - PHY103(80) in RED
   - MTH202(85) in RED
   - PHY203(70) in RED/BLUE
   - CSE301(90) in RED
   - CSE302(75) in RED/BLUE
   - CSE401(65) in RED/BLUE

VALID COMBINATION EXAMPLES:
✓ BLUE room:
   - CSE101(120) alone
   - PHY203(70) + CSE302(75) = 145

✓ RED room:
   - MTH102(95) alone
   - CSE301(90) alone

❌ INVALID COMBINATIONS:
   - CSE101(120) with any other course
   - MTH102(95) + CSE301(90) = 185 (>192)
   - Any three courses together

✓ BEFORE ASSIGNING ANY COURSES:
1. Calculate total students
2. Verify room capacity limits
3. Check for forbidden combinations
4. Ensure each course scheduled once

SAMPLE JSON FORMAT:
{
  "sessions": [{
    "session": "Week 1 Monday Morning",
    "date": "2025-07-21",
    "red": {
      "courses": [
        {"code": "MATH101", "students": 85}
      ],
      "total": 85,
      "utilization": "88.5%"
    },
    "blue": {
      "courses": [
        {"code": "ENG201", "students": 150}
      ],
      "total": 150,
      "utilization": "78.1%"
    }
  }]
}
`;
};