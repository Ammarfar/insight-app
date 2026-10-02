"use server";

import { signIn, signOut } from "@/auth";
import { isGoogleSsoEnabled } from "./config";

export async function signInWithGoogle() {
  if (!isGoogleSsoEnabled()) return;
  await signIn("google", { redirectTo: "/" });
}

export async function signOutAction() {
  if (!isGoogleSsoEnabled()) return;
  await signOut({ redirectTo: "/sign-in" });
}
