import { z } from "zod";

export const timetableSchema = z.object({
  sessions: z
    .array(
      z.object({
        session: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
        red: z.object({
          courses: z.array(
            z.object({
              code: z.string(),
              students: z.number().int(),
            })
          ),
          total: z.number(),
          utilization: z.string(),
        }),
        blue: z.object({
          courses: z.array(
            z.object({
              code: z.string(),
              students: z.number().int(),
            })
          ),
          total: z.number(),
          utilization: z.string(),
        }),
      })
    )
    .max(100), // Support up to 10 weeks (10 weeks × 5 days × 2 sessions = 100)
});
