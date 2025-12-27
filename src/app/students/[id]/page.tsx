import { StudentDetail } from "~/app/_components/student-detail";
import { HydrateClient } from "~/trpc/server";

export default async function StudentPage() {
  return (
    <HydrateClient>
      <StudentDetail />
    </HydrateClient>
  );
}
