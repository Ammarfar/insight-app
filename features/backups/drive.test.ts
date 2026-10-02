import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  account: {
    userId: "user-1",
    provider: "google",
    providerAccountId: "google-1",
    scope: "openid email profile https://www.googleapis.com/auth/drive.file",
    access_token: "valid-token" as string | null,
    refresh_token: "refresh-token" as string | null,
    expires_at: Math.floor(Date.now() / 1000) + 3600 as number | null,
  },
  updateWhere: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({
  db: {
    query: { accounts: { findFirst: vi.fn(async () => mocks.account) } },
    update: vi.fn(() => ({
      set: vi.fn((values: Record<string, unknown>) => {
        Object.assign(mocks.account, values);
        return { where: mocks.updateWhere };
      }),
    })),
  },
}));

import { DriveAuthorizationError } from "./contracts";
import { uploadBackupFile } from "./drive";

describe("Google Drive boundary", () => {
  beforeEach(() => {
    mocks.account.access_token = "valid-token";
    mocks.account.refresh_token = "refresh-token";
    mocks.account.expires_at = Math.floor(Date.now() / 1000) + 3600;
    mocks.updateWhere.mockReset();
    process.env.AUTH_GOOGLE_ID = "google-client";
    process.env.AUTH_GOOGLE_SECRET = "google-secret";
    vi.restoreAllMocks();
  });

  it("uploads a backup to the existing application folder", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ files: [{ id: "folder-1" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "file-1" }), { status: 200 }));

    await expect(uploadBackupFile("user-1", "backup.json", "{}" )).resolves.toBe("file-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("uploadType=multipart");
  });

  it("refreshes an expired token before accessing Drive", async () => {
    mocks.account.expires_at = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "fresh-token", expires_in: 3600 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ files: [{ id: "folder-1" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "file-1" }), { status: 200 }));

    await expect(uploadBackupFile("user-1", "backup.json", "{}" )).resolves.toBe("file-1");
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://oauth2.googleapis.com/token");
    expect(mocks.account.access_token).toBe("fresh-token");
    expect(mocks.updateWhere).toHaveBeenCalledOnce();
  });

  it("signals reconnect when Drive revokes access", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("revoked", { status: 401 }));
    await expect(uploadBackupFile("user-1", "backup.json", "{}" )).rejects.toBeInstanceOf(DriveAuthorizationError);
  });

  it("reports an upload failure without returning a file id", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ files: [{ id: "folder-1" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    await expect(uploadBackupFile("user-1", "backup.json", "{}" )).rejects.toThrow("Google Drive upload failed (503)");
  });
});
