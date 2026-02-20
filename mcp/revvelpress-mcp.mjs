#!/usr/bin/env node
/**
 * RevvelPress MCP Server — Model Context Protocol integration
 * Provides tools for AI assistants to interact with RevvelPress
 * 
 * Powered by free and open-source APIs
 */

import { createServer } from "http";

const API_BASE = process.env.REVVELPRESS_API_URL || "https://revvelpress.manus.space";
const AUTH_TOKEN = process.env.REVVELPRESS_AUTH_TOKEN || "";

// ─── MCP Protocol Implementation ───

const MCP_TOOLS = [
  {
    name: "revvelpress_create_paper",
    description: "Create a new academic paper in RevvelPress",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Paper title" },
        abstract: { type: "string", description: "Paper abstract (optional)" },
        content: { type: "string", description: "Paper content (optional)" },
        contentFormat: { type: "string", enum: ["richtext", "markdown", "html"], description: "Content format" },
      },
      required: ["title"],
    },
  },
  {
    name: "revvelpress_list_papers",
    description: "List all papers for the authenticated user",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "revvelpress_get_paper",
    description: "Get details of a specific paper",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number", description: "Paper ID" } },
      required: ["id"],
    },
  },
  {
    name: "revvelpress_generate_content",
    description: "Generate viral content from a paper. Types: twitter_thread, tiktok_script, linkedin_post, instagram_caption, blog_post, infographic_text, facebook_post, youtube_script, email_newsletter",
    inputSchema: {
      type: "object",
      properties: {
        paperId: { type: "number", description: "Paper ID to generate content from" },
        contentType: {
          type: "string",
          enum: ["twitter_thread", "tiktok_script", "linkedin_post", "instagram_caption", "blog_post", "infographic_text", "facebook_post", "youtube_script", "email_newsletter"],
          description: "Type of content to generate",
        },
        tone: { type: "string", description: "Tone of the content (optional)" },
      },
      required: ["paperId", "contentType"],
    },
  },
  {
    name: "revvelpress_publish_zenodo",
    description: "Publish a paper to Zenodo and get a DOI",
    inputSchema: {
      type: "object",
      properties: { paperId: { type: "number", description: "Paper ID to publish" } },
      required: ["paperId"],
    },
  },
  {
    name: "revvelpress_list_content",
    description: "List all generated viral content",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "revvelpress_get_usage",
    description: "Get current token usage and subscription info",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "revvelpress_create_calendar_event",
    description: "Create a content calendar event",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event title" },
        scheduledAt: { type: "string", description: "ISO date string for scheduling" },
        platform: { type: "string", description: "Target platform (e.g., twitter, linkedin)" },
        description: { type: "string", description: "Event description" },
      },
      required: ["title", "scheduledAt"],
    },
  },
  {
    name: "revvelpress_generate_abstract",
    description: "Auto-generate an abstract for a paper using AI",
    inputSchema: {
      type: "object",
      properties: { paperId: { type: "number", description: "Paper ID" } },
      required: ["paperId"],
    },
  },
];

// ─── API Helpers ───

async function apiCall(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (AUTH_TOKEN) headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Tool Handlers ───

async function handleToolCall(name, args) {
  switch (name) {
    case "revvelpress_create_paper": {
      const data = await apiCall("/api/trpc/papers.create", {
        method: "POST",
        body: JSON.stringify({ json: args }),
      });
      return { content: [{ type: "text", text: `Paper created with ID: ${data.result?.data?.json?.id}` }] };
    }

    case "revvelpress_list_papers": {
      const data = await apiCall("/api/trpc/papers.list");
      const papers = data.result?.data?.json || [];
      const text = papers.length === 0
        ? "No papers found."
        : papers.map(p => `[${p.id}] ${p.title} (${p.status})`).join("\n");
      return { content: [{ type: "text", text }] };
    }

    case "revvelpress_get_paper": {
      const data = await apiCall(`/api/trpc/papers.get?input=${encodeURIComponent(JSON.stringify({ json: args }))}`);
      const paper = data.result?.data?.json;
      if (!paper) return { content: [{ type: "text", text: "Paper not found." }] };
      return {
        content: [{
          type: "text",
          text: `Title: ${paper.title}\nStatus: ${paper.status}\nFormat: ${paper.contentFormat}\nAbstract: ${paper.abstract || "None"}\nDOI: ${paper.zenodoDoi || "Not published"}`,
        }],
      };
    }

    case "revvelpress_generate_content": {
      const data = await apiCall("/api/trpc/content.generate", {
        method: "POST",
        body: JSON.stringify({ json: args }),
      });
      const result = data.result?.data?.json;
      return {
        content: [{
          type: "text",
          text: `Generated ${args.contentType} (${result?.tokensUsed || 0} tokens used):\n\n${result?.text || "No content generated"}`,
        }],
      };
    }

    case "revvelpress_publish_zenodo": {
      const data = await apiCall("/api/trpc/papers.publishToZenodo", {
        method: "POST",
        body: JSON.stringify({ json: args }),
      });
      const result = data.result?.data?.json;
      return {
        content: [{
          type: "text",
          text: `Published to Zenodo!\nDOI: ${result?.doi}\nURL: ${result?.url}`,
        }],
      };
    }

    case "revvelpress_list_content": {
      const data = await apiCall("/api/trpc/content.listAll");
      const items = data.result?.data?.json || [];
      const text = items.length === 0
        ? "No generated content found."
        : items.map(c => `[${c.id}] ${c.contentType} (Paper #${c.paperId}) — ${c.generatedText?.substring(0, 100)}...`).join("\n\n");
      return { content: [{ type: "text", text }] };
    }

    case "revvelpress_get_usage": {
      const data = await apiCall("/api/trpc/billing.getUsage");
      const usage = data.result?.data?.json;
      return {
        content: [{
          type: "text",
          text: `Plan: ${usage?.tier}\nTokens: ${usage?.tokensBalance}\nUsed this month: ${usage?.tokensUsedThisMonth} / ${usage?.monthlyAllowance}`,
        }],
      };
    }

    case "revvelpress_create_calendar_event": {
      const data = await apiCall("/api/trpc/calendar.create", {
        method: "POST",
        body: JSON.stringify({ json: args }),
      });
      return { content: [{ type: "text", text: `Calendar event created with ID: ${data.result?.data?.json?.id}` }] };
    }

    case "revvelpress_generate_abstract": {
      const data = await apiCall("/api/trpc/papers.generateAbstract", {
        method: "POST",
        body: JSON.stringify({ json: args }),
      });
      return {
        content: [{
          type: "text",
          text: `Generated abstract:\n\n${data.result?.data?.json?.abstract || "No abstract generated"}`,
        }],
      };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
}

// ─── MCP JSON-RPC Server (stdio) ───

const JSONRPC_VERSION = "2.0";

function sendResponse(id, result) {
  const response = JSON.stringify({ jsonrpc: JSONRPC_VERSION, id, result });
  process.stdout.write(response + "\n");
}

function sendError(id, code, message) {
  const response = JSON.stringify({ jsonrpc: JSONRPC_VERSION, id, error: { code, message } });
  process.stdout.write(response + "\n");
}

async function handleRequest(request) {
  const { id, method, params } = request;

  switch (method) {
    case "initialize":
      sendResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "revvelpress-mcp", version: "1.0.0" },
      });
      break;

    case "tools/list":
      sendResponse(id, { tools: MCP_TOOLS });
      break;

    case "tools/call": {
      try {
        const result = await handleToolCall(params.name, params.arguments || {});
        sendResponse(id, result);
      } catch (err) {
        sendResponse(id, { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true });
      }
      break;
    }

    case "notifications/initialized":
      // No response needed for notifications
      break;

    default:
      sendError(id, -32601, `Method not found: ${method}`);
  }
}

// ─── stdio transport ───

let buffer = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    if (line.trim()) {
      try {
        const request = JSON.parse(line);
        handleRequest(request);
      } catch (err) {
        sendError(null, -32700, "Parse error");
      }
    }
  }
});

process.stderr.write("RevvelPress MCP Server started (stdio mode)\n");
process.stderr.write(`API Base: ${API_BASE}\n`);
