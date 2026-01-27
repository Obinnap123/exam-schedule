import HallPageClient from "./hallClient";

export const dynamic = "force-dynamic";



export default function HallPage() {
  return <HallPageClient initialHalls={[]} />;
}
