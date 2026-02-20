import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "starter", "professional", "enterprise"]).default("free").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  tokensBalance: int("tokensBalance").default(50).notNull(),
  tokensUsedThisMonth: int("tokensUsedThisMonth").default(0).notNull(),
  monthlyTokenAllowance: int("monthlyTokenAllowance").default(50).notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  accessibilitySettings: json("accessibilitySettings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Papers ───
export const papers = mysqlTable("papers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  abstract: text("abstract"),
  content: text("content"),
  contentFormat: mysqlEnum("contentFormat", ["richtext", "markdown", "html"]).default("richtext").notNull(),
  authors: json("authors"),
  keywords: json("keywords"),
  citations: json("citations"),
  sourceFile: varchar("sourceFile", { length: 1024 }),
  sourceType: mysqlEnum("sourceType", ["created", "pdf", "markdown", "docx"]).default("created").notNull(),
  zenodoDepositId: varchar("zenodoDepositId", { length: 64 }),
  zenodoDoi: varchar("zenodoDoi", { length: 128 }),
  ssrnId: varchar("ssrnId", { length: 64 }),
  status: mysqlEnum("status", ["draft", "review", "published"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;

// ─── Generated Content ───
export const generatedContent = mysqlTable("generatedContent", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  paperId: int("paperId").notNull(),
  contentType: mysqlEnum("contentType", [
    "twitter_thread", "tiktok_script", "linkedin_post",
    "instagram_caption", "blog_post", "infographic_text",
    "facebook_post", "youtube_script", "email_newsletter"
  ]).notNull(),
  generatedText: text("generatedText").notNull(),
  tone: varchar("tone", { length: 64 }),
  model: varchar("model", { length: 128 }),
  tokensUsed: int("tokensUsed").default(0).notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = typeof generatedContent.$inferInsert;

// ─── Content Calendar ───
export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  paperId: int("paperId"),
  contentId: int("contentId"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  platform: varchar("platform", { length: 64 }),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: mysqlEnum("status", ["scheduled", "published", "cancelled"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// ─── Token Usage Log ───
export const tokenUsageLog = mysqlTable("tokenUsageLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  tokensUsed: int("tokensUsed").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenUsageLog = typeof tokenUsageLog.$inferSelect;

// ─── Support Tickets ───
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  category: mysqlEnum("category", ["billing", "technical", "refund", "cancel", "general"]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;