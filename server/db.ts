import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, papers, InsertPaper,
  generatedContent, InsertGeneratedContent,
  calendarEvents, InsertCalendarEvent,
  tokenUsageLog, supportTickets,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ─── User Helpers ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field]; if (value === undefined) return;
    values[field] = value ?? null; updateSet[field] = value ?? null;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.email === ENV.adminEmail || user.openId === ENV.ownerOpenId) {
    values.role = 'admin'; updateSet.role = 'admin';
  } else if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserTokens(userId: number, tokensUsed: number) {
  const db = await getDb(); if (!db) return;
  await db.update(users).set({
    tokensBalance: sql`GREATEST(${users.tokensBalance} - ${tokensUsed}, 0)`,
    tokensUsedThisMonth: sql`${users.tokensUsedThisMonth} + ${tokensUsed}`,
  }).where(eq(users.id, userId));
}

export async function updateUserAccessibility(userId: number, settings: any) {
  const db = await getDb(); if (!db) return;
  await db.update(users).set({ accessibilitySettings: settings }).where(eq(users.id, userId));
}

// ─── Paper Helpers ───
export async function createPaper(paper: InsertPaper) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(papers).values(paper);
  return result[0].insertId;
}

export async function getUserPapers(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(papers).where(eq(papers.userId, userId)).orderBy(desc(papers.updatedAt));
}

export async function getPaperById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(papers).where(eq(papers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaper(id: number, data: Partial<InsertPaper>) {
  const db = await getDb(); if (!db) return;
  await db.update(papers).set(data).where(eq(papers.id, id));
}

export async function deletePaper(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(papers).where(eq(papers.id, id));
}

// ─── Generated Content Helpers ───
export async function createGeneratedContent(content: InsertGeneratedContent) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(generatedContent).values(content);
  return result[0].insertId;
}

export async function getContentByPaper(paperId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(generatedContent).where(eq(generatedContent.paperId, paperId)).orderBy(desc(generatedContent.createdAt));
}

export async function getUserContent(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(generatedContent).where(eq(generatedContent.userId, userId)).orderBy(desc(generatedContent.createdAt));
}

export async function deleteContent(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(generatedContent).where(eq(generatedContent.id, id));
}

// ─── Calendar Helpers ───
export async function createCalendarEvent(event: InsertCalendarEvent) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(calendarEvents).values(event);
  return result[0].insertId;
}

export async function getUserCalendarEvents(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(desc(calendarEvents.scheduledAt));
}

export async function updateCalendarEvent(id: number, data: Partial<InsertCalendarEvent>) {
  const db = await getDb(); if (!db) return;
  await db.update(calendarEvents).set(data).where(eq(calendarEvents.id, id));
}

export async function deleteCalendarEvent(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
}

// ─── Token Usage Helpers ───
export async function logTokenUsage(userId: number, action: string, tokensUsed: number, description?: string) {
  const db = await getDb(); if (!db) return;
  await db.insert(tokenUsageLog).values({ userId, action, tokensUsed, description });
}

export async function getUserTokenHistory(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tokenUsageLog).where(eq(tokenUsageLog.userId, userId)).orderBy(desc(tokenUsageLog.createdAt)).limit(50);
}

// ─── Support Ticket Helpers ───
export async function createSupportTicket(data: { userId: number; subject: string; message: string; category?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database not available");
  const result = await db.insert(supportTickets).values(data as any);
  return result[0].insertId;
}

export async function getUserTickets(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
}

// ─── Admin Helpers ───
export async function getAllUsers() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getAnalytics() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalPapers: 0, totalContent: 0, totalTokensUsed: 0 };
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [paperCount] = await db.select({ count: sql<number>`count(*)` }).from(papers);
  const [contentCount] = await db.select({ count: sql<number>`count(*)` }).from(generatedContent);
  const [tokenSum] = await db.select({ total: sql<number>`COALESCE(sum(tokensUsed), 0)` }).from(tokenUsageLog);
  return {
    totalUsers: userCount?.count || 0,
    totalPapers: paperCount?.count || 0,
    totalContent: contentCount?.count || 0,
    totalTokensUsed: tokenSum?.total || 0,
  };
}
