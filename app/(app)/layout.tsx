import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/features/auth/service";
import { isGoogleSsoEnabled } from "@/features/auth/config";
import { getCaptureOptions } from "@/features/insights/repository";
import { getThemeMode } from "@/features/theme/server";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [user, theme] = await Promise.all([requireUser(), getThemeMode()]);
  const options = await getCaptureOptions(user.id);
  return <AppShell initialTheme={theme} user={user} topics={options.topics.map(({ id, name }) => ({ id, name }))} sources={options.sources.map(({ id, title }) => ({ id, title }))} showSignOut={isGoogleSsoEnabled()}>{children}</AppShell>;
}
