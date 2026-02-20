import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as publishingService from "../services/publishingService";
import * as outletMatchingService from "../services/outletMatchingService";
import * as citationService from "../services/citationService";

export const publishingRouter = router({
  publishToZenodo: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        abstract: z.string(),
        authors: z.array(z.object({ name: z.string() })),
        keywords: z.array(z.string()).optional(),
        fileBuffer: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const fileBuffer = Buffer.from(input.fileBuffer, "base64");
      return await publishingService.publishToZenodo({
        title: input.title,
        abstract: input.abstract,
        authors: input.authors,
        keywords: input.keywords,
        fileBuffer,
        fileName: input.fileName,
      });
    }),

  publishToAllPlatforms: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        abstract: z.string(),
        authors: z.array(z.string()),
        content: z.string(),
        platforms: z.array(z.enum(["zenodo", "ssrn", "arxiv", "researchgate", "academia", "scholar"])),
      })
    )
    .mutation(async ({ input }) => {
      const results: any = {};

      for (const platform of input.platforms) {
        try {
          if (platform === "ssrn") {
            results[platform] = await publishingService.publishToSSRN({
              title: input.title,
              abstract: input.abstract,
              authors: input.authors,
              keywords: [],
              content: input.content,
            });
          } else if (platform === "arxiv") {
            results[platform] = await publishingService.publishToArXiv({
              title: input.title,
              abstract: input.abstract,
              authors: input.authors,
              content: input.content,
            });
          }
        } catch (error) {
          results[platform] = { error: error instanceof Error ? error.message : "Unknown error" };
        }
      }

      return results;
    }),

  scoreOutlets: protectedProcedure
    .input(
      z.object({
        paperTitle: z.string(),
        paperAbstract: z.string(),
        paperContent: z.string(),
        paperKeywords: z.array(z.string()),
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
      return await outletMatchingService.scoreOutlets({
        paperTitle: input.paperTitle,
        paperAbstract: input.paperAbstract,
        paperContent: input.paperContent,
        paperKeywords: input.paperKeywords,
        outletsList: input.outlets,
      });
    }),

  generateCitations: protectedProcedure
    .input(
      z.object({
        caseNumber: z.string(),
        caseName: z.string(),
        court: z.string(),
        year: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await citationService.generateCitations(input);
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
});
