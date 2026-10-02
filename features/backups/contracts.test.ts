import { describe, expect, it } from "vitest";
import { backupV1Schema } from "./contracts";

const emptyBackup = {
  version: 1,
  createdAt: "2026-09-22T00:00:00.000Z",
  sources: [], topics: [], insights: [], insightTopics: [], insightConnections: [], reviews: [], xpEvents: [],
  preferences: { timezone: "Asia/Jakarta", automaticBackupEnabled: false },
};

describe("BackupV1", () => {
  it("accepts the current portable format", () => {
    expect(backupV1Schema.parse(emptyBackup).version).toBe(1);
  });
  it("rejects unknown backup versions", () => {
    expect(() => backupV1Schema.parse({ ...emptyBackup, version: 2 })).toThrow();
  });
});
