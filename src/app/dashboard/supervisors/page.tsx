import SupervisorClient from "./supervisorClient";

export const dynamic = "force-dynamic"; // So it doesn't cache on Vercel

import prisma from '@/lib/prisma';

async function fetchInitialSupervisors() {
  try {
    const supervisors = await prisma.supervisor.findMany();
    return supervisors;
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    return [];
  }
}

export default async function SupervisorPage() {
  const initialSupervisors = await fetchInitialSupervisors();
  return <SupervisorClient initialSupervisors={initialSupervisors} />;
}
