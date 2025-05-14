import SupervisorClient from "./supervisorClient";

export const dynamic = "force-dynamic"; // So it doesn't cache on Vercel

async function fetchInitialSupervisors() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not defined in environment variables.");
    }

    const response = await fetch(`${baseUrl}/api/supervisors`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch supervisors");
    }

    return response.json(); // should return an array of supervisors
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    return [];
  }
}

export default async function SupervisorPage() {
  const initialSupervisors = await fetchInitialSupervisors();
  return <SupervisorClient initialSupervisors={initialSupervisors} />;
}
