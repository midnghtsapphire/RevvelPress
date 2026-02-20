import { invokeLLM } from "../_core/llm";

const CONTENT_PROMPTS: Record<string, string> = {
  twitter_thread: `You are a viral Twitter/X thread writer. Convert the following academic paper content into an engaging Twitter/X thread (5-10 tweets). Use hooks, numbered tweets, and end with a call to action. Make it accessible to a general audience while maintaining accuracy. Use emojis sparingly. Format each tweet on its own line, prefixed with the tweet number.`,

  tiktok_script: `You are a TikTok content creator specializing in educational content. Convert the following academic paper into a 60-second TikTok script. Include: [HOOK] to grab attention in first 3 seconds, [BODY] with key findings explained simply, [CTA] call to action. Use conversational language, analogies, and trending formats.`,

  linkedin_post: `You are a LinkedIn thought leader. Convert the following academic paper into a professional LinkedIn post (1500-2000 characters). Start with a compelling hook, break into short paragraphs, include key insights, and end with a question to drive engagement. Use professional but accessible language.`,

  instagram_caption: `You are an Instagram content strategist. Convert the following academic paper into an engaging Instagram caption (under 2200 characters). Include a strong opening line, key takeaways as bullet points, relevant hashtags (15-20), and a call to action. Make it visually descriptive.`,

  blog_post: `You are a science communicator and blogger. Convert the following academic paper into a compelling blog post (800-1200 words). Include: an attention-grabbing title, introduction with hook, key findings explained for general audience, implications, and conclusion. Use subheadings, analogies, and accessible language.`,

  infographic_text: `You are an infographic designer. Extract the key data points, statistics, and findings from the following academic paper and organize them into infographic-ready text blocks. Include: Title, 5-7 key statistics/facts, a brief summary, and source citation. Format clearly with labels.`,

  facebook_post: `You are a Facebook content creator. Convert the following academic paper into an engaging Facebook post. Start with a question or surprising fact, explain the key findings in 2-3 short paragraphs, and end with a discussion prompt. Keep it conversational and shareable.`,

  youtube_script: `You are a YouTube educational content creator. Convert the following academic paper into a 5-minute YouTube video script. Include: [INTRO] with hook and channel intro, [BODY] with key findings broken into segments, [OUTRO] with summary and call to subscribe. Use conversational tone with visual cues in brackets.`,

  email_newsletter: `You are an email newsletter writer. Convert the following academic paper into a newsletter edition. Include: Subject line, preview text, greeting, key findings summary, why it matters section, actionable takeaways, and sign-off. Keep it scannable with bold key points.`,
};

export async function generateViralContent(params: {
  paperTitle: string;
  paperAbstract: string;
  paperContent: string;
  contentType: string;
  tone?: string;
}): Promise<{ text: string; tokensUsed: number }> {
  const systemPrompt = CONTENT_PROMPTS[params.contentType] || CONTENT_PROMPTS.blog_post;
  const toneInstruction = params.tone ? `\n\nTone: ${params.tone}` : "";

  const userMessage = `Paper Title: ${params.paperTitle}\n\nAbstract: ${params.paperAbstract || "Not provided"}\n\nContent:\n${params.paperContent?.substring(0, 8000) || "Not provided"}${toneInstruction}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const text = typeof response.choices[0]?.message?.content === "string"
    ? response.choices[0].message.content
    : "";

  const tokensUsed = response.usage?.total_tokens
    ? Math.ceil(response.usage.total_tokens / 100) // Convert API tokens to app tokens
    : 3;

  return { text, tokensUsed };
}

export async function generatePaperSummary(content: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an academic writing assistant. Summarize the following paper content into a concise abstract (150-250 words). Maintain academic tone and include key findings, methodology, and implications." },
      { role: "user", content: content.substring(0, 10000) },
    ],
  });

  return typeof response.choices[0]?.message?.content === "string"
    ? response.choices[0].message.content
    : "";
}
