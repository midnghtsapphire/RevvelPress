import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Papers table — stores academic papers, legal documents, and content
 */
export const papers = mysqlTable("papers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  title: text("title").notNull(),
  abstract: text("abstract"),
  content: text("content"),
  contentType: varchar("contentType", { length: 50 }).default("academic"), // academic, legal, news
  fileUrl: varchar("fileUrl", { length: 2048 }),
  fileKey: varchar("fileKey", { length: 512 }),
  doi: varchar("doi", { length: 256 }),
  orcid: varchar("orcid", { length: 256 }),
  authors: text("authors"), // JSON array
  keywords: text("keywords"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;

/**
 * Publishing platforms — Zenodo, SSRN, arXiv, ResearchGate, Academia.edu, Google Scholar
 */
export const platforms = mysqlTable("platforms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // zenodo, ssrn, arxiv, researchgate, academia, scholar
  apiUrl: varchar("apiUrl", { length: 512 }),
  apiKey: varchar("apiKey", { length: 512 }),
  requiresAuth: int("requiresAuth").default(0),
  formatRequirements: text("formatRequirements"), // JSON
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = typeof platforms.$inferInsert;

/**
 * Submissions — tracks paper submissions to each platform
 */
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId").notNull().references(() => papers.id),
  platformId: int("platformId").notNull().references(() => platforms.id),
  status: varchar("status", { length: 50 }).default("pending"), // pending, submitted, accepted, rejected, indexed
  submissionUrl: varchar("submissionUrl", { length: 512 }),
  externalId: varchar("externalId", { length: 256 }), // Platform-specific ID
  metadata: text("metadata"), // JSON — platform-specific response
  error: text("error"),
  submittedAt: timestamp("submittedAt"),
  indexedAt: timestamp("indexedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

/**
 * Outlets — newspapers, magazines, journals for outlet matching
 */
export const outlets = mysqlTable("outlets", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  type: varchar("type", { length: 50 }), // newspaper, magazine, journal, blog
  category: varchar("category", { length: 100 }), // science, law, business, etc.
  acceptanceCriteria: text("acceptanceCriteria"), // JSON
  editorialGuidelines: text("editorialGuidelines"), // JSON
  contactEmail: varchar("contactEmail", { length: 256 }),
  submissionUrl: varchar("submissionUrl", { length: 512 }),
  website: varchar("website", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Outlet = typeof outlets.$inferSelect;
export type InsertOutlet = typeof outlets.$inferInsert;

/**
 * Outlet matches — AI-scored outlet recommendations for papers
 */
export const outletMatches = mysqlTable("outletMatches", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId").notNull().references(() => papers.id),
  outletId: int("outletId").notNull().references(() => outlets.id),
  acceptanceProbability: int("acceptanceProbability"), // 0-100 score
  aiReasonings: text("aiReasonings"), // JSON — why this outlet matches
  formatAdaptations: text("formatAdaptations"), // JSON — how to adapt paper for outlet
  isSubmitted: int("isSubmitted").default(0),
  submissionDate: timestamp("submissionDate"),
  status: varchar("status", { length: 50 }), // pending, submitted, accepted, rejected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OutletMatch = typeof outletMatches.$inferSelect;
export type InsertOutletMatch = typeof outletMatches.$inferInsert;

/**
 * Legal citations — stores citations in multiple formats
 */
export const citations = mysqlTable("citations", {
  id: int("id").autoincrement().primaryKey(),
  paperId: int("paperId").notNull().references(() => papers.id),
  caseNumber: varchar("caseNumber", { length: 100 }),
  caseName: varchar("caseName", { length: 512 }),
  court: varchar("court", { length: 256 }),
  year: int("year"),
  citationUrl: varchar("citationUrl", { length: 512 }),
  bluebookFormat: text("bluebookFormat"),
  alwdFormat: text("alwdFormat"),
  apaFormat: text("apaFormat"),
  mlaFormat: text("mlaFormat"),
  chicagoFormat: text("chicagoFormat"),
  harvardFormat: text("harvardFormat"),
  ieeeFormat: text("ieeeFormat"),
  isGoodLaw: int("isGoodLaw"), // 1 = still good law, 0 = overruled/reversed
  shepardizationStatus: text("shepardizationStatus"), // JSON — case status
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Citation = typeof citations.$inferSelect;
export type InsertCitation = typeof citations.$inferInsert;

/**
 * Case law cache — free sources (CourtListener, Google Scholar Legal)
 */
export const caseLawCache = mysqlTable("caseLawCache", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 100 }).unique(),
  caseName: varchar("caseName", { length: 512 }),
  court: varchar("court", { length: 256 }),
  year: int("year"),
  summary: text("summary"),
  fullText: text("fullText"),
  courtListenerId: varchar("courtListenerId", { length: 256 }),
  scholarUrl: varchar("scholarUrl", { length: 512 }),
  isGoodLaw: int("isGoodLaw"),
  relatedCases: text("relatedCases"), // JSON array
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaseLawCache = typeof caseLawCache.$inferSelect;
export type InsertCaseLawCache = typeof caseLawCache.$inferInsert;