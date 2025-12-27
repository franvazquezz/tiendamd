import { Dashboard } from "~/app/_components/dashboard";
import { HydrateClient } from "~/trpc/server";

export default function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen">
        <Dashboard />
      </main>
    </HydrateClient>
  );
}
