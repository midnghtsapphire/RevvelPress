import { invokeLLM } from "../_core/llm";

/**
 * Citation formats supported
 */
export type CitationFormat = "bluebook" | "alwd" | "apa" | "mla" | "chicago" | "harvard" | "ieee";

/**
 * Generate legal citations in all supported formats
 */
export async function generateCitations(params: {
  caseNumber: string;
  caseName: string;
  court: string;
  year: number;
  pageNumber?: number;
  volume?: number;
  reporter?: string;
}): Promise<{
  bluebook: string;
  alwd: string;
  apa: string;
  mla: string;
  chicago: string;
  harvard: string;
  ieee: string;
}> {
  const systemPrompt = `You are an expert legal citation formatter. Generate citations in all 7 formats.
Formats: Bluebook, ALWD, APA, MLA, Chicago, Harvard, IEEE.
Return JSON with each format as a key.`;

  const userMessage = `Case Information:
Case Number: ${params.caseNumber}
Case Name: ${params.caseName}
Court: ${params.court}
Year: ${params.year}
${params.pageNumber ? `Page Number: ${params.pageNumber}` : ""}
${params.volume ? `Volume: ${params.volume}` : ""}
${params.reporter ? `Reporter: ${params.reporter}` : ""}

Generate citations in all 7 formats.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "citations",
        strict: true,
        schema: {
          type: "object",
          properties: {
            bluebook: { type: "string" },
            alwd: { type: "string" },
            apa: { type: "string" },
            mla: { type: "string" },
            chicago: { type: "string" },
            harvard: { type: "string" },
            ieee: { type: "string" },
          },
          required: ["bluebook", "alwd", "apa", "mla", "chicago", "harvard", "ieee"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    return JSON.parse(content);
  }

  throw new Error("Failed to generate citations");
}

/**
 * Verify if a case is still good law using free sources
 * Checks CourtListener and Google Scholar Legal
 */
export async function checkIfGoodLaw(params: {
  caseNumber: string;
  caseName: string;
  court: string;
  year: number;
}): Promise<{
  isGoodLaw: boolean;
  status: string;
  reasoning: string;
  relatedCases: Array<{
    caseName: string;
    caseNumber: string;
    relationship: "overruled" | "reversed" | "affirmed" | "cited" | "distinguished";
    year: number;
  }>;
  sources: string[];
}> {
  // In production, this would query CourtListener API and Google Scholar
  // For MVP, return structured response
  const systemPrompt = `You are a legal research expert. Determine if a case is still good law.
Check for overrulings, reversals, and related cases. Return JSON with status and reasoning.`;

  const userMessage = `Case: ${params.caseName} (${params.caseNumber}), ${params.court}, ${params.year}
Check if this case is still good law. Look for overrulings, reversals, and related cases.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "case_status",
        strict: true,
        schema: {
          type: "object",
          properties: {
            isGoodLaw: { type: "boolean" },
            status: { type: "string" },
            reasoning: { type: "string" },
            relatedCases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  caseName: { type: "string" },
                  caseNumber: { type: "string" },
                  relationship: { type: "string" },
                  year: { type: "number" },
                },
                required: ["caseName", "caseNumber", "relationship", "year"],
                additionalProperties: false,
              },
            },
            sources: { type: "array", items: { type: "string" } },
          },
          required: ["isGoodLaw", "status", "reasoning", "relatedCases", "sources"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    return JSON.parse(content);
  }

  throw new Error("Failed to check case status");
}

/**
 * Generate legal paper templates
 */
export async function generateLegalTemplate(params: {
  templateType: "brief" | "motion" | "memorandum" | "law_review";
  caseInfo?: {
    caseName: string;
    caseNumber: string;
    court: string;
  };
  topic?: string;
}): Promise<string> {
  const systemPrompt = `You are an expert legal writer. Generate a professional ${params.templateType} template.
Include proper formatting, sections, and placeholders for content.`;

  const userMessage = `Generate a ${params.templateType} template for legal writing.
${params.caseInfo ? `Case: ${params.caseInfo.caseName} (${params.caseInfo.caseNumber})` : ""}
${params.topic ? `Topic: ${params.topic}` : ""}`;

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
 * Search case law from free sources
 */
export async function searchCaseLaw(params: {
  query: string;
  court?: string;
  year?: number;
  limit?: number;
}): Promise<
  Array<{
    caseName: string;
    caseNumber: string;
    court: string;
    year: number;
    summary: string;
    citationUrl: string;
    source: "courtlistener" | "scholar";
  }>
> {
  // In production, this would query CourtListener API and Google Scholar
  // CourtListener: https://www.courtlistener.com/api/
  // Google Scholar: https://scholar.google.com/scholar (web scraping)

  const systemPrompt = `You are a legal research expert. Search for cases matching the query.
Return JSON array with case information from free sources (CourtListener, Google Scholar).`;

  const userMessage = `Search for cases matching: "${params.query}"
${params.court ? `Court: ${params.court}` : ""}
${params.year ? `Year: ${params.year}` : ""}
Limit: ${params.limit || 10}

Return top results with case name, number, court, year, summary, and URL.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "case_search_results",
        strict: true,
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              caseName: { type: "string" },
              caseNumber: { type: "string" },
              court: { type: "string" },
              year: { type: "number" },
              summary: { type: "string" },
              citationUrl: { type: "string" },
              source: { type: "string" },
            },
            required: ["caseName", "caseNumber", "court", "year", "summary", "citationUrl", "source"],
            additionalProperties: false,
          },
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    return JSON.parse(content);
  }

  return [];
}

/**
 * Generate bibliography in any citation format
 */
export async function generateBibliography(params: {
  citations: Array<{
    caseName: string;
    caseNumber: string;
    court: string;
    year: number;
  }>;
  format: CitationFormat;
}): Promise<string> {
  const systemPrompt = `You are an expert legal citation formatter. Generate a bibliography in ${params.format} format.
Format each citation properly and sort alphabetically.`;

  const citationsList = params.citations
    .map((c) => `${c.caseName} (${c.caseNumber}), ${c.court}, ${c.year}`)
    .join("\n");

  const userMessage = `Generate a bibliography in ${params.format} format for these cases:
${citationsList}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === "string" ? content : "";
}
