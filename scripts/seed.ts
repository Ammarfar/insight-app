import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { insightTopics, insights, sources, topics, userPreferences, userProgress, users, xpEvents } from "../db/schema";

async function seed() {
  const email = process.env.SEED_USER_EMAIL;
  if (!email) throw new Error("Set SEED_USER_EMAIL to an account that has signed in once.");
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new Error(`No authenticated user exists for ${email}. Sign in once before seeding.`);
  const existing = await db.query.insights.findFirst({ where: eq(insights.userId, user.id) });
  if (existing) throw new Error("This user already has insights; seed was not applied.");

  await db.transaction(async (tx) => {
    await tx.insert(userPreferences).values({ userId: user.id, timezone: "Asia/Jakarta" }).onConflictDoNothing();
    await tx.insert(userProgress).values({ userId: user.id, totalXp: 15, level: 1, currentStreak: 2, longestStreak: 2, lastLearningDate: new Date().toISOString().slice(0, 10) }).onConflictDoUpdate({ target: userProgress.userId, set: { totalXp: 15, currentStreak: 2, longestStreak: 2 } });
    const [psychology, engineering] = await tx.insert(topics).values([
      { userId: user.id, name: "Psychology", color: "violet" },
      { userId: user.id, name: "Engineering", color: "blue" },
    ]).returning();
    const [book, course] = await tx.insert(sources).values([
      { userId: user.id, type: "BOOK", title: "Atomic Habits", author: "James Clear" },
      { userId: user.id, type: "COURSE", title: "Database Design" },
    ]).returning();
    const due = new Date(Date.now() - 86_400_000);
    const created = await tx.insert(insights).values([
      { userId: user.id, sourceId: book.id, title: "Environment influences behavior", content: "Make the good behavior easier, and the bad behavior harder. Small environmental changes can have an outsized impact on decisions.", reflection: "Design the conditions around a habit instead of relying on willpower.", nextReviewAt: due },
      { userId: user.id, sourceId: course.id, title: "Indexes improve reads but slow writes", content: "Indexes create faster lookup paths, but each write also has to update the index.", reflection: "A practical system-design trade-off.", nextReviewAt: due },
    ]).returning();
    await tx.insert(insightTopics).values([{ insightId: created[0].id, topicId: psychology.id }, { insightId: created[1].id, topicId: engineering.id }]);
    await tx.insert(xpEvents).values(created.map((insight) => ({ userId: user.id, type: "CREATE_INSIGHT" as const, amount: 5, entityId: insight.id, eventKey: `insight:create:${insight.id}` })));
  });
}

seed().then(() => { console.log("Seed complete."); process.exit(0); }).catch((error) => { console.error(error); process.exit(1); });
