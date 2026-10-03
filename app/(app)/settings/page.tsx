import { Clock3, Cloud, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/features/auth/service";
import { isGoogleSsoEnabled } from "@/features/auth/config";
import { toggleAutomaticBackupAction } from "@/features/backups/actions";
import { CreateBackupControl, RestoreBackupControl } from "@/features/backups/components/backup-controls";
import { getBackupSettings } from "@/features/backups/service";
import { updateTimezoneAction } from "@/features/progress/actions";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireUser();
  const data = await getBackupSettings(user.id);
  const googleSsoEnabled = isGoogleSsoEnabled();
  return (
    <div className="page-shell">
      <header className="mb-9">
        <p className="eyebrow">Ownership and portability</p>
        <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">Settings</h1>
        <p className="mt-2 font-serif text-muted">Your knowledge belongs to you.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="surface p-6 md:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="flex items-center gap-2 font-serif text-2xl"><Cloud size={20} />Google Drive backup</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Backups contain semantic learning data only. OAuth tokens, sessions, and infrastructure data are never included.</p>
            </div>
            {googleSsoEnabled && <CreateBackupControl />}
          </div>
          {googleSsoEnabled ? (
            <>
              <form action={toggleAutomaticBackupAction} className="mt-6 flex items-center justify-between rounded-xl bg-sage-50 p-4">
                <div>
                  <p className="text-sm font-medium">Automatic backup</p>
                  <p className="mt-1 text-xs text-muted">Runs after changes when the latest backup is older than 24 hours.</p>
                </div>
                <input type="hidden" name="enabled" value={data.preferences?.automaticBackupEnabled ? "false" : "true"} />
                <Button variant="outline" size="sm">{data.preferences?.automaticBackupEnabled ? "Disable" : "Enable"}</Button>
              </form>
              <div className="mt-7">
                <h3 className="font-serif text-xl">Backup history</h3>
                <div className="mt-4 grid gap-3">
                  {data.history.length ? data.history.map((backup) => (
                    <article key={backup.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                      <div>
                        <p className="text-sm font-medium">{backup.type === "MANUAL" ? "Manual backup" : "Automatic backup"}</p>
                        <p className="mt-1 text-xs text-muted">{formatDate(backup.createdAt)} · {backup.status.toLowerCase()}{backup.sizeBytes ? ` · ${Math.ceil(backup.sizeBytes / 1024)} KB` : ""}</p>
                        {backup.errorMessage && <p className="mt-1 text-xs text-danger">{backup.errorMessage}</p>}
                      </div>
                      {backup.status === "COMPLETED" && <RestoreBackupControl backupId={backup.id} />}
                    </article>
                  )) : <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No backups yet.</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-xl bg-sage-50 p-5">
              <p className="text-sm font-medium">Google integration is paused</p>
              <p className="mt-1 text-sm leading-6 text-muted">Set <code>GOOGLE_SSO_ON=true</code> and configure Google OAuth when you want to use Drive backup.</p>
            </div>
          )}
        </section>
        <aside className="grid content-start gap-5">
          <section className="surface p-6">
            <h2 className="flex items-center gap-2 font-serif text-xl"><Clock3 size={18} />Local day</h2>
            <p className="my-3 text-sm leading-6 text-muted">Reviews and streaks follow your IANA timezone.</p>
            <form action={updateTimezoneAction} className="grid gap-2">
              <label htmlFor="timezone" className="text-xs font-semibold uppercase tracking-wider text-muted">Timezone</label>
              <input id="timezone" name="timezone" required defaultValue={data.preferences?.timezone ?? "UTC"} placeholder="Asia/Jakarta" className="h-10 rounded-lg border border-line bg-field px-3 text-sm text-ink outline-none placeholder:text-muted/75 focus:border-violet-300 focus:ring-2 focus:ring-violet-100" />
              <Button size="sm" variant="outline">Save timezone</Button>
            </form>
          </section>
          <section className="surface p-6">
            <h2 className="flex items-center gap-2 font-serif text-xl"><Download size={18} />Export data</h2>
            <p className="my-4 text-sm leading-6 text-muted">Download a versioned JSON copy without sending anything to Drive.</p>
            <Button asChild variant="outline"><a href="/api/export">Download JSON</a></Button>
          </section>
          <section className="surface p-6">
            <h2 className="flex items-center gap-2 font-serif text-xl"><ShieldCheck size={18} />{googleSsoEnabled ? "Connected account" : "Local mode"}</h2>
            <p className="mt-4 text-sm font-medium">{user.name || "Google user"}</p>
            <p className="text-xs text-muted">{user.email}</p>
            <p className="mt-4 text-xs leading-5 text-muted">{googleSsoEnabled ? "InsightFlow can access only files it creates or that you explicitly share with it." : "Authentication is disabled. Data is stored under one local PostgreSQL user."}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
