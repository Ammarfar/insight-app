"use client";

import { useActionState } from "react";
import { CloudUpload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/features/shared/contracts";
import { createBackupAction, restoreBackupAction } from "../actions";

export function CreateBackupControl() {
  const [state, action, pending] = useActionState(createBackupAction, initialActionState);
  return <div><form action={action}><Button disabled={pending}><CloudUpload size={16} />{pending ? "Uploading..." : "Backup now"}</Button></form>{state.message && <p className={`mt-2 text-xs ${state.status === "error" ? "text-danger" : "text-sage-700"}`}>{state.message}</p>}</div>;
}

export function RestoreBackupControl({ backupId }: { backupId: string }) {
  const [state, action, pending] = useActionState(restoreBackupAction, initialActionState);
  return <div><form action={action} onSubmit={(event) => { if (!window.confirm("Replace all current learning data with this backup? This cannot be undone.")) event.preventDefault(); }}><input type="hidden" name="backupId" value={backupId} /><Button variant="outline" size="sm" disabled={pending}><RotateCcw size={14} />{pending ? "Restoring..." : "Restore"}</Button></form>{state.status === "error" && <p className="mt-1 max-w-48 text-xs text-danger">{state.message}</p>}</div>;
}
