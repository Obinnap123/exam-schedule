import HallPageClient from "./hallClient";

export const dynamic = "force-dynamic"; // Disable static generation for this page

async function fetchInitialHalls() {
  try {
    // Use absolute URL for server-side fetching or relative URL if you're using Next.js API routes
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/halls`,
      {
        cache: "no-store", // Ensure fresh data
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch halls");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching halls:", error);
    return []; // Return empty array as fallback
  }
}

export default async function HallPage() {
  const initialHalls = await fetchInitialHalls();

  return <HallPageClient initialHalls={initialHalls} />;
}
