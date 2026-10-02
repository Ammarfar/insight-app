import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isGoogleSsoEnabled } from "@/features/auth/config";

export const proxy = isGoogleSsoEnabled()
  ? auth
  : () => NextResponse.next();

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
