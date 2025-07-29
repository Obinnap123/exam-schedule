import HallPageClient from "./hallClient";

export const dynamic = "force-dynamic";

import prisma from '@/lib/prisma';

async function fetchInitialHalls() {
  try {
    const halls = await prisma.hall.findMany();
    return halls;
  } catch (error) {
    console.error("Error fetching halls:", error);
    return [];
  }
}

export default async function HallPage() {
  const initialHalls = await fetchInitialHalls();
  return <HallPageClient initialHalls={initialHalls} />;
}
