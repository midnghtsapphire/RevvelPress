import { invokeLLM } from "../_core/llm";

/**
 * AI-powered outlet matching engine
 * Analyzes paper and scores outlets by acceptance probability
 */
export async function scoreOutlets(params: {
  paperTitle: string;
  paperAbstract: string;
  paperContent: string;
  paperKeywords: string[];
  outletsList: Array<{
    id: number;
    name: string;
    type: string;
    category: string;
    acceptanceCriteria: string;
    editorialGuidelines: string;
  }>;
}): Promise<
  Array<{
    outletId: number;
    outletName: string;
    acceptanceProbability: number;
    reasoning: string;
    formatAdaptations: string[];
  }>
> {
  const systemPrompt = `You are an expert academic editor and journal submission strategist. 
Analyze the provided paper and score each outlet by acceptance probability (0-100).
Consider: paper topic, outlet scope, acceptance criteria, editorial focus, and fit.
Return JSON array with scores and reasoning for each outlet.`;

  const outletDescriptions = params.outletsList
    .map(
      (o) =>
        `- ${o.name} (${o.type}, ${o.category}): ${o.acceptanceCriteria} | Guidelines: ${o.editorialGuidelines}`
    )
    .join("\n");

  const userMessage = `Paper Title: ${params.paperTitle}
Keywords: ${params.paperKeywords.join(", ")}
Abstract: ${params.paperAbstract}
Content (first 3000 chars): ${params.paperContent.substring(0, 3000)}

Outlets to score:
${outletDescriptions}

Score each outlet 0-100 for acceptance probability. Return JSON array with: outletId, outletName, acceptanceProbability, reasoning, formatAdaptations (list of changes needed).`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "outlet_scores",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              outletId: { type: "number" },
              outletName: { type: "string" },
              acceptanceProbability: { type: "number" },
              reasoning: { type: "string" },
              formatAdaptations: { type: "array", items: { type: "string" } },
            },
            required: ["outletId", "outletName", "acceptanceProbability", "reasoning", "formatAdaptations"],
            additionalProperties: false,
          },
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    const parsed = JSON.parse(content);
    // Sort by acceptance probability descending
    return parsed.sort((a: any, b: any) => b.acceptanceProbability - a.acceptanceProbability);
  }

  throw new Error("Failed to score outlets");
}

/**
 * Generate format adaptations for a specific outlet
 */
export async function generateFormatAdaptations(params: {
  paperTitle: string;
  paperAbstract: string;
  paperContent: string;
  outletName: string;
  editorialGuidelines: string;
}): Promise<{
  titleAdaptation: string;
  abstractAdaptation: string;
  contentAdaptation: string;
  keyChanges: string[];
  estimatedWordCount: number;
}> {
  const systemPrompt = `You are an expert editor specializing in adapting academic papers for different outlets.
Adapt the paper to match ${params.outletName}'s editorial guidelines while maintaining scientific integrity.
Return JSON with: titleAdaptation, abstractAdaptation, contentAdaptation, keyChanges, estimatedWordCount.`;

  const userMessage = `Editorial Guidelines: ${params.editorialGuidelines}

Original Paper:
Title: ${params.paperTitle}
Abstract: ${params.paperAbstract}
Content (first 2000 chars): ${params.paperContent.substring(0, 2000)}

Adapt this paper for ${params.outletName}. Focus on: tone, length, emphasis, structure, terminology.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "format_adaptations",
        strict: true,
        schema: {
          type: "object",
          properties: {
            titleAdaptation: { type: "string" },
            abstractAdaptation: { type: "string" },
            contentAdaptation: { type: "string" },
            keyChanges: { type: "array", items: { type: "string" } },
            estimatedWordCount: { type: "number" },
          },
          required: ["titleAdaptation", "abstractAdaptation", "contentAdaptation", "keyChanges", "estimatedWordCount"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    return JSON.parse(content);
  }

  throw new Error("Failed to generate format adaptations");
}

/**
 * Batch submit to multiple high-probability outlets
 */
export async function batchSubmitToOutlets(params: {
  paperId: number;
  paperTitle: string;
  paperAbstract: string;
  paperContent: string;
  fileUrl: string;
  outlets: Array<{
    outletId: number;
    outletName: string;
    contactEmail: string;
    submissionUrl: string;
    acceptanceProbability: number;
  }>;
  minAcceptanceProbability?: number;
}): Promise<
  Array<{
    outletId: number;
    outletName: string;
    status: string;
    submissionId: string;
    submissionUrl: string;
    error?: string;
  }>
> {
  const minThreshold = params.minAcceptanceProbability || 60;
  const qualifyingOutlets = params.outlets.filter((o) => o.acceptanceProbability >= minThreshold);

  const results = [];

  for (const outlet of qualifyingOutlets) {
    try {
      // Generate submission email
      const emailContent = await generateSubmissionEmail({
        paperTitle: params.paperTitle,
        paperAbstract: params.paperAbstract,
        outletName: outlet.outletName,
        contactEmail: outlet.contactEmail,
      });

      // In production, this would send the email or submit via API
      results.push({
        outletId: outlet.outletId,
        outletName: outlet.outletName,
        status: "submitted",
        submissionId: `submit-${Date.now()}-${outlet.outletId}`,
        submissionUrl: outlet.submissionUrl,
      });
    } catch (error) {
      results.push({
        outletId: outlet.outletId,
        outletName: outlet.outletName,
        status: "failed",
        submissionId: "",
        submissionUrl: outlet.submissionUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Generate professional submission email
 */
export async function generateSubmissionEmail(params: {
  paperTitle: string;
  paperAbstract: string;
  outletName: string;
  contactEmail: string;
}): Promise<string> {
  const systemPrompt = `You are an expert academic writer. Generate a professional submission email to ${params.outletName}.
The email should be compelling, concise, and follow academic submission conventions.
Include: salutation, brief introduction, paper summary, why it fits the outlet, and professional closing.`;

  const userMessage = `Paper Title: ${params.paperTitle}
Abstract: ${params.paperAbstract}
Outlet: ${params.outletName}
Contact: ${params.contactEmail}

Generate a professional submission email (200-300 words).`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

/**
 * Track submission status across outlets
 */
export interface OutletSubmissionStatus {
  outletId: number;
  outletName: string;
  submissionId: string;
  status: "pending" | "submitted" | "under_review" | "accepted" | "rejected" | "revision_requested";
  submittedDate: Date;
  lastUpdated: Date;
  feedback?: string;
  acceptanceDate?: Date;
}

export async function updateSubmissionStatus(
  submissionId: string,
  newStatus: OutletSubmissionStatus["status"],
  feedback?: string
): Promise<OutletSubmissionStatus> {
  return {
    outletId: 0,
    outletName: "",
    submissionId,
    status: newStatus,
    submittedDate: new Date(),
    lastUpdated: new Date(),
    feedback,
  };
}
