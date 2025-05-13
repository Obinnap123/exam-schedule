import HallPageClient from "./hallClient";

export const dynamic = "force-dynamic";

async function fetchInitialHalls() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not defined in environment variables.");
    }

    const response = await fetch(`${baseUrl}/api/halls`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch halls");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching halls:", error);
    return [];
  }
}

export default async function HallPage() {
  const initialHalls = await fetchInitialHalls();
  return <HallPageClient initialHalls={initialHalls} />;
}
