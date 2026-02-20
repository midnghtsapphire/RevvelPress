import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import * as publishingService from "../services/publishingService";
import * as outletMatchingService from "../services/outletMatchingService";
import * as citationService from "../services/citationService";

export const publishingRouter = router({
  // ============================================================================
  // PAPERS
  // ============================================================================

  createPaper: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        abstract: z.string().optional(),
        content: z.string().optional(),
        contentType: z.enum(["academic", "legal", "news"]).optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        authors: z.array(z.object({ name: z.string(), affiliation: z.string().optional() })).optional(),
        keywords: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createPaper(ctx.user.id, input);
    }),

  getUserPapers: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserPapers(ctx.user.id);
  }),

  getPaperById: protectedProcedure
    .input(z.object({ paperId: z.number() }))
    .query(async ({ input }) => {
      return await db.getPaperById(input.paperId);
    }),

  // ============================================================================
  // ZENODO PUBLISHING
  // ============================================================================

  publishToZenodo: protectedProcedure
    .input(
      z.object({
        paperId: z.number(),
        fileBuffer: z.string(), // Base64 encoded
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const paper = await db.getPaperById(input.paperId);
      if (!paper) throw new Error("Paper not found");

      // Decode base64 file
      const fileBuffer = Buffer.from(input.fileBuffer, "base64");

      const authors = paper.authors ? JSON.parse(paper.authors as any) : [];
      const keywords = paper.keywords ? JSON.parse(paper.keywords as any) : [];

      const result = await publishingService.publishToZenodo({
        title: paper.title,
        abstract: paper.abstract || "",
        authors,
        keywords,
        fileBuffer,
        fileName: input.fileName,
      });

      // Save DOI to paper
      // TODO: Update paper with DOI

      return result;
    }),

  // ============================================================================
  // MULTI-PLATFORM PUBLISHING
  // ============================================================================

  publishToAllPlatforms: protectedProcedure
    .input(
      z.object({
        paperId: z.number(),
        platforms: z.array(z.enum(["zenodo", "ssrn", "arxiv", "researchgate", "academia", "scholar"])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const paper = await db.getPaperById(input.paperId);
      if (!paper) throw new Error("Paper not found");

      const results: any = {};

      for (const platform of input.platforms) {
        try {
          let submission;

          if (platform === "zenodo") {
            // Already handled by publishToZenodo
            submission = { status: "pending", platformName: "zenodo" };
          } else if (platform === "ssrn") {
            submission = await publishingService.publishToSSRN({
              title: paper.title,
              abstract: paper.abstract || "",
              authors: paper.authors ? JSON.parse(paper.authors as any).map((a: any) => a.name) : [],
              keywords: paper.keywords ? JSON.parse(paper.keywords as any) : [],
              content: paper.content || "",
              doi: paper.doi || undefined,
            });
          } else if (platform === "arxiv") {
            submission = await publishingService.publishToArXiv({
              title: paper.title,
              abstract: paper.abstract || "",
              authors: paper.authors ? JSON.parse(paper.authors as any).map((a: any) => a.name) : [],
              content: paper.content || "",
              doi: paper.doi || undefined,
            });
          } else if (platform === "researchgate") {
            submission = await publishingService.publishToResearchGate({
              title: paper.title,
              abstract: paper.abstract || "",
              authors: paper.authors ? JSON.parse(paper.authors as any).map((a: any) => a.name) : [],
              fileUrl: paper.fileUrl || "",
              doi: paper.doi || undefined,
            });
          } else if (platform === "academia") {
            submission = await publishingService.publishToAcademia({
              title: paper.title,
              abstract: paper.abstract || "",
              authors: paper.authors ? JSON.parse(paper.authors as any).map((a: any) => a.name) : [],
              fileUrl: paper.fileUrl || "",
              doi: paper.doi || undefined,
            });
          } else if (platform === "scholar") {
            submission = await publishingService.indexGoogleScholar({
              title: paper.title,
              abstract: paper.abstract || "",
              authors: paper.authors ? JSON.parse(paper.authors as any).map((a: any) => a.name) : [],
              doi: paper.doi || "",
              doiUrl: paper.doi ? `https://doi.org/${paper.doi}` : "",
            });
          }

          results[platform] = submission;
        } catch (error) {
          results[platform] = { error: error instanceof Error ? error.message : "Unknown error" };
        }
      }

      return results;
    }),

  // ============================================================================
  // OUTLET MATCHING
  // ============================================================================

  scoreOutlets: protectedProcedure
    .input(
      z.object({
        paperId: z.number(),
        outlets: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            type: z.string(),
            category: z.string(),
            acceptanceCriteria: z.string(),
            editorialGuidelines: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const paper = await db.getPaperById(input.paperId);
      if (!paper) throw new Error("Paper not found");

      const keywords = paper.keywords ? JSON.parse(paper.keywords as any) : [];

      const scores = await outletMatchingService.scoreOutlets({
        paperTitle: paper.title,
        paperAbstract: paper.abstract || "",
        paperContent: paper.content || "",
        paperKeywords: keywords,
        outletsList: input.outlets,
      });

      // Save scores to database
      for (const score of scores) {
        await db.createOutletMatch(input.paperId, score.outletId, {
          acceptanceProbability: score.acceptanceProbability,
          aiReasonings: { reasoning: score.reasoning },
          formatAdaptations: score.formatAdaptations,
        });
      }

      return scores;
    }),

  getOutletMatches: protectedProcedure
    .input(z.object({ paperId: z.number() }))
    .query(async ({ input }) => {
      return await db.getOutletMatches(input.paperId);
    }),

  // ============================================================================
  // LEGAL CITATIONS
  // ============================================================================

  generateCitations: protectedProcedure
    .input(
      z.object({
        caseNumber: z.string(),
        caseName: z.string(),
        court: z.string(),
        year: z.number(),
        pageNumber: z.number().optional(),
        volume: z.number().optional(),
        reporter: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const citations = await citationService.generateCitations(input);

      // Save to database
      // TODO: Link to paper if paperId provided

      return citations;
    }),

  checkIfGoodLaw: protectedProcedure
    .input(
      z.object({
        caseNumber: z.string(),
        caseName: z.string(),
        court: z.string(),
        year: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await citationService.checkIfGoodLaw(input);
    }),

  searchCaseLaw: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        court: z.string().optional(),
        year: z.number().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await citationService.searchCaseLaw(input);
    }),

  generateBibliography: protectedProcedure
    .input(
      z.object({
        citations: z.array(
          z.object({
            caseName: z.string(),
            caseNumber: z.string(),
            court: z.string(),
            year: z.number(),
          })
        ),
        format: z.enum(["bluebook", "alwd", "apa", "mla", "chicago", "harvard", "ieee"]),
      })
    )
    .query(async ({ input }) => {
      return await citationService.generateBibliography(input);
    }),

  generateLegalTemplate: protectedProcedure
    .input(
      z.object({
        templateType: z.enum(["brief", "motion", "memorandum", "law_review"]),
        caseInfo: z
          .object({
            caseName: z.string(),
            caseNumber: z.string(),
            court: z.string(),
          })
          .optional(),
        topic: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await citationService.generateLegalTemplate(input);
    }),
});
