import { notFound } from "next/navigation";

import { StudentDetail } from "~/app/_components/student-detail";
import { HydrateClient, serverCaller } from "~/trpc/server";

export default async function StudentPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const student = await serverCaller.students.byId({ id }).catch(() => null);
  if (!student) {
    notFound();
  }

  return (
    <HydrateClient>
      <StudentDetail id={id} />
    </HydrateClient>
  );
}
