import { Suspense } from "react";
import SupervisorClient from "./supervisorClient";

export default function Page() {
  return (
    <>
      <Suspense
        fallback={<p className="text-gray-500">Loading supervisors...</p>}
      >
        <SupervisorClient />
      </Suspense>
    </>
  );
}
