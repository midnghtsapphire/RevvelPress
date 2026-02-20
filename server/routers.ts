import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateViralContent, generatePaperSummary } from "./services/ai";
import { createZenodoDeposit, uploadFileToZenodo, publishZenodoDeposit } from "./services/zenodo";
import { createCheckoutSession, createCustomerPortalSession } from "./stripe/stripe";
import { SUBSCRIPTION_TIERS } from "./stripe/products";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { publishingRouter } from "./routers/publishingRouter";

async function checkAndDeductTokens(userId: number, tokensNeeded: number) {
  const user = await db.getUserById(userId);
  if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  if (user.tokensBalance < tokensNeeded) {
    throw new TRPCError({ code: "FORBIDDEN", message: `Insufficient tokens. You have ${user.tokensBalance}, need ${tokensNeeded}. Upgrade your plan.` });
  }
  await db.updateUserTokens(userId, tokensNeeded);
  await db.logTokenUsage(userId, "content_generation", tokensNeeded);
  return user;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  papers: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserPapers(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const paper = await db.getPaperById(input.id);
      if (!paper || paper.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      return paper;
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1), abstract: z.string().optional(), content: z.string().optional(),
      contentFormat: z.enum(["richtext", "markdown", "html"]).optional(),
      authors: z.any().optional(), keywords: z.any().optional(), citations: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createPaper({
        userId: ctx.user.id, title: input.title, abstract: input.abstract || null,
        content: input.content || null, contentFormat: input.contentFormat || "richtext",
        authors: input.authors || null, keywords: input.keywords || null,
        citations: input.citations || null, sourceType: "created",
      });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(), title: z.string().optional(), abstract: z.string().optional(),
      content: z.string().optional(), contentFormat: z.enum(["richtext", "markdown", "html"]).optional(),
      authors: z.any().optional(), keywords: z.any().optional(), citations: z.any().optional(),
      status: z.enum(["draft", "review", "published"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const paper = await db.getPaperById(input.id);
      if (!paper || paper.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, ...data } = input;
      await db.updatePaper(id, data as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const paper = await db.getPaperById(input.id);
      if (!paper || paper.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      await db.deletePaper(input.id);
      return { success: true };
    }),
    upload: protectedProcedure.input(z.object({
      fileName: z.string(), fileContent: z.string(), fileType: z.enum(["pdf", "markdown", "docx"]),
      title: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const fileBuffer = Buffer.from(input.fileContent, "base64");
      const fileKey = `papers/${ctx.user.id}/${nanoid()}-${input.fileName}`;
      const mimeMap: Record<string, string> = { pdf: "application/pdf", markdown: "text/markdown", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
      const { url } = await storagePut(fileKey, fileBuffer, mimeMap[input.fileType]);
      let extractedContent = input.fileType === "markdown" ? Buffer.from(input.fileContent, "base64").toString("utf-8") : `[Uploaded ${input.fileType.toUpperCase()}: ${input.fileName}]`;
      const id = await db.createPaper({
        userId: ctx.user.id, title: input.title || input.fileName.replace(/\.[^.]+$/, ""),
        content: extractedContent, contentFormat: input.fileType === "markdown" ? "markdown" : "richtext",
        sourceFile: url, sourceType: input.fileType,
      });
      return { id, url };
    }),
    publishToZenodo: protectedProcedure.input(z.object({ paperId: z.number() })).mutation(async ({ ctx, input }) => {
      const paper = await db.getPaperById(input.paperId);
      if (!paper || paper.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      await checkAndDeductTokens(ctx.user.id, 5);
      const authors = (paper.authors as any[]) || [{ name: ctx.user.name || "Author" }];
      const deposit = await createZenodoDeposit({ title: paper.title, description: paper.abstract || paper.title, authors, keywords: (paper.keywords as string[]) || [] });
      await uploadFileToZenodo(deposit.id, deposit.links.bucket, `${paper.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`, paper.content || paper.title);
      const published = await publishZenodoDeposit(deposit.id);
      await db.updatePaper(input.paperId, { zenodoDepositId: deposit.id.toString(), zenodoDoi: published.doi, status: "published" });
      return { depositId: deposit.id, doi: published.doi, doiUrl: published.doi_url, url: published.links.html };
    }),
    generateAbstract: protectedProcedure.input(z.object({ paperId: z.number() })).mutation(async ({ ctx, input }) => {
      const paper = await db.getPaperById(input.paperId);
      if (!paper || paper.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      if (!paper.content) throw new TRPCError({ code: "BAD_REQUEST", message: "Paper has no content" });
      await checkAndDeductTokens(ctx.user.id, 2);
      const abstract = await generatePaperSummary(paper.content);
      await db.updatePaper(input.paperId, { abstract });
      return { abstract };
    }),
  }),

  content: router({
    generate: protectedProcedure.input(z.object({
      paperId: z.number(),
      contentType: z.enum(["twitter_thread", "tiktok_script", "linkedin_post", "instagram_caption", "blog_post", "infographic_text", "facebook_post", "youtube_script", "email_newsletter"]),
      tone: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const paper = await db.getPaperById(input.paperId);
      if (!paper || paper.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
      const result = await generateViralContent({ paperTitle: paper.title, paperAbstract: paper.abstract || "", paperContent: paper.content || "", contentType: input.contentType, tone: input.tone });
      await checkAndDeductTokens(ctx.user.id, result.tokensUsed);
      const contentId = await db.createGeneratedContent({ userId: ctx.user.id, paperId: input.paperId, contentType: input.contentType, generatedText: result.text, tone: input.tone || null, model: "gemini-2.5-flash", tokensUsed: result.tokensUsed });
      return { id: contentId, text: result.text, tokensUsed: result.tokensUsed };
    }),
    listByPaper: protectedProcedure.input(z.object({ paperId: z.number() })).query(({ input }) => db.getContentByPaper(input.paperId)),
    listAll: protectedProcedure.query(({ ctx }) => db.getUserContent(ctx.user.id)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteContent(input.id); return { success: true }; }),
  }),

  calendar: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserCalendarEvents(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1), description: z.string().optional(), platform: z.string().optional(),
      scheduledAt: z.string().transform(s => new Date(s)), paperId: z.number().optional(), contentId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createCalendarEvent({ userId: ctx.user.id, title: input.title, description: input.description || null, platform: input.platform || null, scheduledAt: input.scheduledAt, paperId: input.paperId || null, contentId: input.contentId || null });
      return { id };
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), description: z.string().optional(), platform: z.string().optional(), scheduledAt: z.string().transform(s => new Date(s)).optional(), status: z.enum(["scheduled", "published", "cancelled"]).optional() })).mutation(async ({ input }) => {
      const { id, ...data } = input; await db.updateCalendarEvent(id, data as any); return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteCalendarEvent(input.id); return { success: true }; }),
  }),

  billing: router({
    getPlans: publicProcedure.query(() => SUBSCRIPTION_TIERS),
    getUsage: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      const history = await db.getUserTokenHistory(ctx.user.id);
      return { tier: user?.subscriptionTier || "free", tokensBalance: user?.tokensBalance || 0, tokensUsedThisMonth: user?.tokensUsedThisMonth || 0, monthlyAllowance: user?.monthlyTokenAllowance || 50, history };
    }),
    createCheckout: protectedProcedure.input(z.object({ tier: z.enum(["starter", "professional", "enterprise"]), origin: z.string() })).mutation(async ({ ctx, input }) => {
      const tierConfig = SUBSCRIPTION_TIERS[input.tier];
      if (!tierConfig || !("stripePriceId" in tierConfig)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid tier" });
      const session = await createCheckoutSession({ userId: ctx.user.id, userEmail: ctx.user.email || "", userName: ctx.user.name || "", priceId: (tierConfig as any).stripePriceId, origin: input.origin });
      return { url: session.url };
    }),
    createPortalSession: protectedProcedure.input(z.object({ origin: z.string() })).mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.stripeCustomerId) throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription" });
      const session = await createCustomerPortalSession(user.stripeCustomerId, input.origin);
      return { url: session.url };
    }),
  }),

  settings: router({
    getAccessibility: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return (user?.accessibilitySettings as any) || { ecoCode: false, neuroCode: false, dyslexicMode: false, noBlueLight: false, wcagAAA: false };
    }),
    updateAccessibility: protectedProcedure.input(z.object({ ecoCode: z.boolean().optional(), neuroCode: z.boolean().optional(), dyslexicMode: z.boolean().optional(), noBlueLight: z.boolean().optional(), wcagAAA: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      await db.updateUserAccessibility(ctx.user.id, input); return { success: true };
    }),
  }),

  support: router({
    createTicket: protectedProcedure.input(z.object({ subject: z.string().min(1), message: z.string().min(1), category: z.enum(["billing", "technical", "refund", "cancel", "general"]).optional() })).mutation(async ({ ctx, input }) => {
      const id = await db.createSupportTicket({ userId: ctx.user.id, subject: input.subject, message: input.message, category: input.category }); return { id };
    }),
    listTickets: protectedProcedure.query(({ ctx }) => db.getUserTickets(ctx.user.id)),
  }),

  admin: router({
    getAnalytics: adminProcedure.query(() => db.getAnalytics()),
    getUsers: adminProcedure.query(() => db.getAllUsers()),
  }),

  publishing: publishingRouter,
});

export type AppRouter = typeof appRouter;
