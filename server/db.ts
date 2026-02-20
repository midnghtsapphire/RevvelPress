import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, papers, platforms, submissions, outlets, outletMatches, citations, caseLawCache } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PAPERS
// ============================================================================

export async function createPaper(userId: number, data: {
  title: string;
  abstract?: string;
  content?: string;
  contentType?: string;
  fileUrl?: string;
  fileKey?: string;
  authors?: any[];
  keywords?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(papers).values({
    userId,
    title: data.title,
    abstract: data.abstract,
    content: data.content,
    contentType: data.contentType || "academic",
    fileUrl: data.fileUrl,
    fileKey: data.fileKey,
    authors: data.authors ? JSON.stringify(data.authors) : null,
    keywords: data.keywords ? JSON.stringify(data.keywords) : null,
  });

  return result;
}

export async function getUserPapers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(papers).where(eq(papers.userId, userId)).orderBy(desc(papers.createdAt));
}

export async function getPaperById(paperId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(papers).where(eq(papers.id, paperId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============================================================================
// PLATFORMS
// ============================================================================

export async function getPlatforms() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(platforms).where(eq(platforms.isActive, 1));
}

export async function getPlatformByName(name: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(platforms).where(eq(platforms.name, name)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

export async function createSubmission(paperId: number, platformId: number, data: {
  status?: string;
  submissionUrl?: string;
  externalId?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(submissions).values({
    paperId,
    platformId,
    status: data.status || "pending",
    submissionUrl: data.submissionUrl,
    externalId: data.externalId,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
}

export async function getSubmissionsByPaper(paperId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(submissions).where(eq(submissions.paperId, paperId));
}

export async function updateSubmissionStatus(submissionId: number, status: string, data?: { externalId?: string; metadata?: any; error?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (data?.externalId) updateData.externalId = data.externalId;
  if (data?.metadata) updateData.metadata = JSON.stringify(data.metadata);
  if (data?.error) updateData.error = data.error;
  if (status === "indexed") updateData.indexedAt = new Date();
  if (status === "submitted") updateData.submittedAt = new Date();

  return await db.update(submissions).set(updateData).where(eq(submissions.id, submissionId));
}

// ============================================================================
// OUTLETS
// ============================================================================

export async function getOutlets(category?: string) {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return await db.select().from(outlets).where(eq(outlets.category, category));
  }
  return await db.select().from(outlets);
}

export async function createOutletMatch(paperId: number, outletId: number, data: {
  acceptanceProbability: number;
  aiReasonings?: any;
  formatAdaptations?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(outletMatches).values({
    paperId,
    outletId,
    acceptanceProbability: data.acceptanceProbability,
    aiReasonings: data.aiReasonings ? JSON.stringify(data.aiReasonings) : null,
    formatAdaptations: data.formatAdaptations ? JSON.stringify(data.formatAdaptations) : null,
  });
}

export async function getOutletMatches(paperId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(outletMatches).where(eq(outletMatches.paperId, paperId)).orderBy(desc(outletMatches.acceptanceProbability));
}

// ============================================================================
// CITATIONS
// ============================================================================

export async function createCitation(paperId: number, data: {
  caseNumber?: string;
  caseName?: string;
  court?: string;
  year?: number;
  citationUrl?: string;
  bluebookFormat?: string;
  alwdFormat?: string;
  apaFormat?: string;
  mlaFormat?: string;
  chicagoFormat?: string;
  harvardFormat?: string;
  ieeeFormat?: string;
  isGoodLaw?: number;
  shepardizationStatus?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(citations).values({
    paperId,
    caseNumber: data.caseNumber,
    caseName: data.caseName,
    court: data.court,
    year: data.year,
    citationUrl: data.citationUrl,
    bluebookFormat: data.bluebookFormat,
    alwdFormat: data.alwdFormat,
    apaFormat: data.apaFormat,
    mlaFormat: data.mlaFormat,
    chicagoFormat: data.chicagoFormat,
    harvardFormat: data.harvardFormat,
    ieeeFormat: data.ieeeFormat,
    isGoodLaw: data.isGoodLaw,
    shepardizationStatus: data.shepardizationStatus ? JSON.stringify(data.shepardizationStatus) : null,
  });
}

export async function getCitationsByPaper(paperId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(citations).where(eq(citations.paperId, paperId));
}

// ============================================================================
// CASE LAW CACHE
// ============================================================================

export async function getCaseLawFromCache(caseNumber: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(caseLawCache).where(eq(caseLawCache.caseNumber, caseNumber)).limit(1);
  if (result.length > 0) {
    const row = result[0];
    return {
      ...row,
      relatedCases: row.relatedCases ? JSON.parse(row.relatedCases) : [],
    };
  }
  return null;
}

export async function cacheCaseLaw(data: {
  caseNumber: string;
  caseName: string;
  court: string;
  year?: number;
  summary?: string;
  fullText?: string;
  courtListenerId?: string;
  scholarUrl?: string;
  isGoodLaw?: number;
  relatedCases?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(caseLawCache).values({
    caseNumber: data.caseNumber,
    caseName: data.caseName,
    court: data.court,
    year: data.year,
    summary: data.summary,
    fullText: data.fullText,
    courtListenerId: data.courtListenerId,
    scholarUrl: data.scholarUrl,
    isGoodLaw: data.isGoodLaw,
    relatedCases: data.relatedCases ? JSON.stringify(data.relatedCases) : null,
  }).onDuplicateKeyUpdate({
    set: {
      summary: data.summary,
      fullText: data.fullText,
      isGoodLaw: data.isGoodLaw,
      lastUpdated: new Date(),
    },
  });
}
