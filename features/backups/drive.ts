import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { DriveAuthorizationError } from "./contracts";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

async function getAccessToken(userId: string) {
  const account = await db.query.accounts.findFirst({ where: and(eq(accounts.userId, userId), eq(accounts.provider, "google")) });
  if (!account || !account.scope?.includes("https://www.googleapis.com/auth/drive.file")) throw new DriveAuthorizationError();
  if (account.access_token && account.expires_at && account.expires_at > Math.floor(Date.now() / 1000) + 60) return account.access_token;
  if (!account.refresh_token || !process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) throw new DriveAuthorizationError();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID,
      client_secret: process.env.AUTH_GOOGLE_SECRET,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });
  if (!response.ok) throw new DriveAuthorizationError();
  const token = await response.json() as { access_token: string; expires_in: number };
  await db.update(accounts).set({ access_token: token.access_token, expires_at: Math.floor(Date.now() / 1000) + token.expires_in })
    .where(and(eq(accounts.provider, account.provider), eq(accounts.providerAccountId, account.providerAccountId)));
  return token.access_token;
}

async function driveFetch(userId: string, url: string, init?: RequestInit) {
  const token = await getAccessToken(userId);
  const response = await fetch(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } });
  if (response.status === 401 || response.status === 403) throw new DriveAuthorizationError();
  if (!response.ok) throw new Error(`Google Drive request failed (${response.status}).`);
  return response;
}

async function ensureBackupFolder(userId: string) {
  const query = encodeURIComponent("name = 'InsightFlow Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const response = await driveFetch(userId, `${DRIVE_API}/files?q=${query}&fields=files(id)&spaces=drive`);
  const data = await response.json() as { files: Array<{ id: string }> };
  if (data.files[0]) return data.files[0].id;
  const created = await driveFetch(userId, `${DRIVE_API}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "InsightFlow Backups", mimeType: "application/vnd.google-apps.folder" }),
  });
  return ((await created.json()) as { id: string }).id;
}

export async function uploadBackupFile(userId: string, fileName: string, content: string) {
  const folderId = await ensureBackupFolder(userId);
  const token = await getAccessToken(userId);
  const boundary = `insightflow-${crypto.randomUUID()}`;
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: fileName, parents: [folderId], mimeType: "application/json" })}\r\n`,
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n`,
    `--${boundary}--`,
  ].join("");
  const response = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  if (response.status === 401 || response.status === 403) throw new DriveAuthorizationError();
  if (!response.ok) throw new Error(`Google Drive upload failed (${response.status}).`);
  return ((await response.json()) as { id: string }).id;
}

export async function downloadBackupFile(userId: string, fileId: string) {
  const response = await driveFetch(userId, `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > 10_000_000) throw new Error("Backup exceeds the 10 MB restore limit.");
  const content = await response.text();
  if (content.length > 10_000_000) throw new Error("Backup exceeds the 10 MB restore limit.");
  return content;
}
