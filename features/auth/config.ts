export function isGoogleSsoEnabled() {
  return process.env.GOOGLE_SSO_ON === "true";
}
