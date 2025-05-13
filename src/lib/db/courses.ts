import prisma from "../prisma";

export async function getAllCourses() {
  return await prisma.course.findMany();
}
