import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { userPreferences, userProgress, users } from "@/db/schema";
import { isGoogleSsoEnabled } from "./config";

type AppUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

const localUser: AppUser = {
  id: "local-development-user",
  name: "Local User",
  email: "local@insightflow.dev",
  image: null,
};

async function ensureUserState(user: AppUser) {
  await db.transaction(async (tx) => {
    await tx.insert(users).values(user).onConflictDoNothing();
    await tx.insert(userPreferences).values({ userId: user.id }).onConflictDoNothing();
    await tx.insert(userProgress).values({ userId: user.id }).onConflictDoNothing();
  });
}

export async function requireUser() {
  if (!isGoogleSsoEnabled()) {
    await ensureUserState(localUser);
    return localUser;
  }

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  await ensureUserState({
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  });

  return session.user;
}
