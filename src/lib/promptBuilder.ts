// lib/promptBuilder.ts
export function buildFinalPrompt({
  userMessage,
  courses,
  halls,
  constraints,
}: {
  userMessage: string;
  courses: { code: string; title: string; studentsCount: number }[];
  halls: { name: string; capacity?: number }[];
  constraints: any;
}) {
  // Build a readable summary of courses
  const coursesSummary = courses
    .map(
      (c) => `- ${c.code} (${c.studentsCount} students): ${c.title}`
    )
    .join("\n");

  // Build a readable summary of halls
  const hallsSummary = halls
    .map((h) => `- ${h.name} (${h.capacity ?? "unknown"} capacity)`)
    .join("\n");

  // Build constraints block
  const constraintsSummary = `
    Sessions: ${constraints.totalSessions}
    Exam Type: ${constraints.examType}
    Red Seats Capacity: ${constraints.redSeatCapacity}
    Blue Seats Capacity: ${constraints.blueSeatCapacity}
    Same Color Required: ${constraints.sameColorRequired}
    Large Course Threshold: ${constraints.largeCourseThreshold}
    Red Utilization Target: ${constraints.redUtilizationTarget}
    Blue Utilization Target: ${constraints.blueUtilizationTarget}
    Minimize Leftover Seats: ${constraints.minimizeLeftoverSeats}
    Group By Department: ${constraints.groupByDepartment}
    Group By Level: ${constraints.groupByLevel}
    No Same Dept. Same Session: ${constraints.noSameDepartmentSameSession}
    Weekdays Only: ${constraints.weekdaysOnly}
    Break Between Sessions: ${constraints.breakBetweenSessions}
    Supervisor Consideration: ${constraints.supervisorConsideration}
    Evenly Distribute Courses: ${constraints.evenlyDistributeCourses}
  `.trim();

  // Final prompt
  return `
*Role*: Act as an academic scheduling expert specializing in constrained resource optimization.

*Task*: Generate an exam schedule using the provided courses and halls, while strictly following all constraints and optimization rules.

*User Message*:
${userMessage}

*Course List*:
${coursesSummary}

*Halls List*:
${hallsSummary}

*Constraints*:
${constraintsSummary}

*Output Format*: Markdown Table
| Session               | Seat Color | Courses Assigned (Students) | Total | Utilization |
|-----------------------|------------|-----------------------------|-------|-------------|
| [Week#] [Day] [Time] | Red        | CODE1(XX), CODE2(YY), ...  | SUM   | SUM/96      |
|                       | Blue       | CODE3(ZZ), ...              | SUM   | SUM/192     |
`;
}
