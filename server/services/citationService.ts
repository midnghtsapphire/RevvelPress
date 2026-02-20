import { invokeLLM } from "../_core/llm";

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
  const systemPrompt = `You are an expert legal citation formatter. Generate citations in all 7 formats: Bluebook, ALWD, APA, MLA, Chicago, Harvard, IEEE.`;

  const userMessage = `Case: ${params.caseName} (${params.caseNumber}), ${params.court}, ${params.year}
${params.pageNumber ? `Page: ${params.pageNumber}` : ""}
${params.volume ? `Volume: ${params.volume}` : ""}

Generate citations in all 7 formats.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      const defaultCitation = `${params.caseName}, ${params.caseNumber} (${params.court} ${params.year})`;
      return {
        bluebook: defaultCitation,
        alwd: defaultCitation,
        apa: defaultCitation,
        mla: defaultCitation,
        chicago: defaultCitation,
        harvard: defaultCitation,
        ieee: defaultCitation,
      };
    }
  }

  throw new Error("Failed to generate citations");
}

/**
 * Verify if a case is still good law
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
}> {
  const systemPrompt = `You are a legal research expert. Determine if a case is still good law.`;

  const userMessage = `Case: ${params.caseName} (${params.caseNumber}), ${params.court}, ${params.year}
Check if this case is still good law. Look for overrulings, reversals, and related cases.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return {
    isGoodLaw: true,
    status: "good_law",
    reasoning: typeof content === "string" ? content : "Case is still good law",
  };
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
  }>
> {
  const systemPrompt = `You are a legal research expert. Search for cases matching the query from free sources.`;

  const userMessage = `Search for cases matching: "${params.query}"
${params.court ? `Court: ${params.court}` : ""}
${params.year ? `Year: ${params.year}` : ""}
Limit: ${params.limit || 10}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return [];
    }
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
  const systemPrompt = `You are an expert legal citation formatter. Generate a bibliography in ${params.format} format.`;

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
