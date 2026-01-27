import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const userId = request.headers.get("X-User-Id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchQuery = query.toLowerCase();
        const userIdInt = parseInt(userId);

        const [courses, halls, supervisors] = await Promise.all([
            prisma.course.findMany({
                where: {
                    userId: userIdInt,
                    OR: [
                        { code: { contains: query, mode: "insensitive" } },
                        { title: { contains: query, mode: "insensitive" } },
                        { department: { contains: query, mode: "insensitive" } },
                    ],
                },
                take: 5,
                orderBy: { code: 'asc' }
            }),
            prisma.hall.findMany({
                where: {
                    userId: userIdInt,
                    name: { contains: query, mode: "insensitive" },
                },
                take: 5,
                orderBy: { name: 'asc' }
            }),
            prisma.supervisor.findMany({
                where: {
                    userId: userIdInt,
                    OR: [
                        { fullName: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                    ],
                },
                take: 5,
                orderBy: { fullName: 'asc' }
            }),
        ]);

        const results = [
            ...courses.map((c) => ({
                id: c.id,
                type: "course" as const,
                title: `${c.code} - ${c.title}`,
                subtitle: c.department || "No Department",
                url: `/dashboard/courses` // Can't deep link easily without query params support in page
            })),
            ...halls.map((h) => ({
                id: h.id,
                type: "hall" as const,
                title: h.name,
                subtitle: `Capacity: ${h.capacity}`,
                url: `/dashboard/halls`
            })),
            ...supervisors.map((s) => ({
                id: s.id,
                type: "supervisor" as const,
                title: s.fullName,
                subtitle: s.email,
                url: `/dashboard/supervisors`
            })),
        ];

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
