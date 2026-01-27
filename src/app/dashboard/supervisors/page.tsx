import SupervisorClient from "./supervisorClient";

export const dynamic = "force-dynamic"; // So it doesn't cache on Vercel



export default function SupervisorPage() {
  return <SupervisorClient initialSupervisors={[]} />;
}
