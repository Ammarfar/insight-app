import { requireUser } from "@/features/auth/service";
import { createBackupSnapshot } from "@/features/backups/service";

export async function GET() {
  const user = await requireUser();
  const snapshot = await createBackupSnapshot(user.id);
  return new Response(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="insightflow-export-${snapshot.createdAt.slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
