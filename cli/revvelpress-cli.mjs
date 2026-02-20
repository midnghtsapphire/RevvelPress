#!/usr/bin/env node
/**
 * RevvelPress CLI — Command-line interface for power users
 * Usage: node revvelpress-cli.mjs <command> [options]
 * 
 * Powered by free and open-source APIs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, basename, extname } from "path";

const API_BASE = process.env.REVVELPRESS_API_URL || "https://revvelpress.manus.space";
const CONFIG_PATH = resolve(process.env.HOME || "~", ".revvelpress.json");

// ─── Config ───
function loadConfig() {
  if (existsSync(CONFIG_PATH)) {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  }
  return {};
}

function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// ─── HTTP helpers ───
async function apiCall(path, options = {}) {
  const config = loadConfig();
  const headers = { "Content-Type": "application/json" };
  if (config.token) headers["Authorization"] = `Bearer ${config.token}`;
  
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Commands ───
const commands = {
  help() {
    console.log(`
╔══════════════════════════════════════════════════════╗
║  RevvelPress CLI — Academic Content Power Tools      ║
╚══════════════════════════════════════════════════════╝

USAGE:
  revvelpress <command> [options]

COMMANDS:
  help                          Show this help message
  config set <key> <value>      Set configuration value
  config get <key>              Get configuration value
  config show                   Show all configuration

  papers list                   List all your papers
  papers create <title>         Create a new paper
  papers get <id>               Get paper details
  papers delete <id>            Delete a paper
  papers upload <file>          Upload a paper (PDF, MD, DOCX)

  generate <paper-id> <type>    Generate viral content
    Types: twitter_thread, tiktok_script, linkedin_post,
           instagram_caption, blog_post, infographic_text,
           facebook_post, youtube_script, email_newsletter

  content list                  List all generated content
  content list-by-paper <id>    List content for a paper

  calendar list                 List calendar events
  calendar create <title> <date> <platform>  Create event

  billing plans                 Show subscription plans
  billing usage                 Show token usage

  publish zenodo <paper-id>     Publish paper to Zenodo

CONFIGURATION:
  revvelpress config set api_url <url>
  revvelpress config set token <auth-token>

EXAMPLES:
  revvelpress papers create "My Research Paper"
  revvelpress generate 1 twitter_thread
  revvelpress publish zenodo 1
  revvelpress billing usage

ATTRIBUTION:
  AI content generation provided by OpenRouter (FOSS models)
  Publishing provided by Zenodo API
`);
  },

  async config(args) {
    const [action, key, value] = args;
    const config = loadConfig();
    
    if (action === "set" && key && value) {
      config[key] = value;
      saveConfig(config);
      console.log(`✓ Set ${key} = ${value}`);
    } else if (action === "get" && key) {
      console.log(config[key] || "(not set)");
    } else if (action === "show") {
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log("Usage: revvelpress config <set|get|show> [key] [value]");
    }
  },

  async papers(args) {
    const [action, ...rest] = args;
    
    if (action === "list") {
      const data = await apiCall("/api/trpc/papers.list");
      const papers = data.result?.data?.json || [];
      if (papers.length === 0) { console.log("No papers found."); return; }
      console.log("\n📄 Your Papers:\n");
      console.log("ID   | Status  | Title");
      console.log("─────┼─────────┼─────────────────────────");
      papers.forEach(p => {
        console.log(`${String(p.id).padEnd(5)}| ${p.status.padEnd(8)}| ${p.title.substring(0, 50)}`);
      });
      console.log(`\nTotal: ${papers.length} papers`);
    } else if (action === "create" && rest.length > 0) {
      const title = rest.join(" ");
      const data = await apiCall("/api/trpc/papers.create", {
        method: "POST",
        body: JSON.stringify({ json: { title } }),
      });
      console.log(`✓ Paper created with ID: ${data.result?.data?.json?.id}`);
    } else if (action === "get" && rest[0]) {
      const data = await apiCall(`/api/trpc/papers.get?input=${encodeURIComponent(JSON.stringify({ json: { id: parseInt(rest[0]) } }))}`);
      const paper = data.result?.data?.json;
      if (!paper) { console.log("Paper not found."); return; }
      console.log(`\n📄 ${paper.title}`);
      console.log(`Status: ${paper.status} | Format: ${paper.contentFormat}`);
      if (paper.abstract) console.log(`\nAbstract: ${paper.abstract.substring(0, 300)}...`);
      if (paper.zenodoDoi) console.log(`DOI: ${paper.zenodoDoi}`);
    } else if (action === "delete" && rest[0]) {
      await apiCall("/api/trpc/papers.delete", {
        method: "POST",
        body: JSON.stringify({ json: { id: parseInt(rest[0]) } }),
      });
      console.log(`✓ Paper ${rest[0]} deleted.`);
    } else if (action === "upload" && rest[0]) {
      const filePath = resolve(rest[0]);
      if (!existsSync(filePath)) { console.error(`File not found: ${filePath}`); process.exit(1); }
      const ext = extname(filePath).toLowerCase().replace(".", "");
      const typeMap = { pdf: "pdf", md: "markdown", markdown: "markdown", docx: "docx" };
      const fileType = typeMap[ext];
      if (!fileType) { console.error(`Unsupported file type: ${ext}. Use PDF, MD, or DOCX.`); process.exit(1); }
      const content = readFileSync(filePath);
      const base64 = content.toString("base64");
      const data = await apiCall("/api/trpc/papers.upload", {
        method: "POST",
        body: JSON.stringify({ json: { fileName: basename(filePath), fileContent: base64, fileType } }),
      });
      console.log(`✓ Paper uploaded with ID: ${data.result?.data?.json?.id}`);
    } else {
      console.log("Usage: revvelpress papers <list|create|get|delete|upload> [args]");
    }
  },

  async generate(args) {
    const [paperId, contentType] = args;
    if (!paperId || !contentType) {
      console.log("Usage: revvelpress generate <paper-id> <content-type>");
      console.log("Types: twitter_thread, tiktok_script, linkedin_post, instagram_caption, blog_post, infographic_text, facebook_post, youtube_script, email_newsletter");
      return;
    }
    console.log(`⚡ Generating ${contentType} for paper #${paperId}...`);
    const data = await apiCall("/api/trpc/content.generate", {
      method: "POST",
      body: JSON.stringify({ json: { paperId: parseInt(paperId), contentType } }),
    });
    const result = data.result?.data?.json;
    console.log(`\n✓ Generated! (${result?.tokensUsed || 0} tokens used)\n`);
    console.log("─".repeat(60));
    console.log(result?.text || "No content generated");
    console.log("─".repeat(60));
  },

  async content(args) {
    const [action, ...rest] = args;
    if (action === "list") {
      const data = await apiCall("/api/trpc/content.listAll");
      const items = data.result?.data?.json || [];
      if (items.length === 0) { console.log("No generated content found."); return; }
      console.log("\n⚡ Generated Content:\n");
      items.forEach(c => {
        console.log(`[${c.id}] ${c.contentType} (Paper #${c.paperId}) — ${c.tokensUsed} tokens`);
        console.log(`    ${c.generatedText?.substring(0, 100)}...`);
        console.log();
      });
    } else if (action === "list-by-paper" && rest[0]) {
      const data = await apiCall(`/api/trpc/content.listByPaper?input=${encodeURIComponent(JSON.stringify({ json: { paperId: parseInt(rest[0]) } }))}`);
      const items = data.result?.data?.json || [];
      if (items.length === 0) { console.log("No content found for this paper."); return; }
      items.forEach(c => {
        console.log(`[${c.id}] ${c.contentType} — ${c.tokensUsed} tokens`);
        console.log(`    ${c.generatedText?.substring(0, 100)}...`);
        console.log();
      });
    } else {
      console.log("Usage: revvelpress content <list|list-by-paper> [paper-id]");
    }
  },

  async calendar(args) {
    const [action, ...rest] = args;
    if (action === "list") {
      const data = await apiCall("/api/trpc/calendar.list");
      const events = data.result?.data?.json || [];
      if (events.length === 0) { console.log("No calendar events found."); return; }
      console.log("\n📅 Calendar Events:\n");
      events.forEach(e => {
        const date = new Date(e.scheduledAt).toLocaleDateString();
        console.log(`[${e.id}] ${e.title} — ${date} (${e.platform || "any"}) [${e.status}]`);
      });
    } else if (action === "create" && rest.length >= 2) {
      const title = rest[0];
      const scheduledAt = rest[1];
      const platform = rest[2] || null;
      const data = await apiCall("/api/trpc/calendar.create", {
        method: "POST",
        body: JSON.stringify({ json: { title, scheduledAt, platform } }),
      });
      console.log(`✓ Event created with ID: ${data.result?.data?.json?.id}`);
    } else {
      console.log("Usage: revvelpress calendar <list|create> [title] [date] [platform]");
    }
  },

  async billing(args) {
    const [action] = args;
    if (action === "plans") {
      const data = await apiCall("/api/trpc/billing.getPlans");
      const plans = data.result?.data?.json;
      if (!plans) { console.log("Could not fetch plans."); return; }
      console.log("\n💳 Subscription Plans:\n");
      for (const [key, plan] of Object.entries(plans)) {
        const p = plan;
        console.log(`${p.name.toUpperCase()} — $${(p.priceMonthly / 100).toFixed(2)}/mo (${p.monthlyTokens} tokens)`);
        p.features.forEach(f => console.log(`  ✓ ${f}`));
        console.log();
      }
    } else if (action === "usage") {
      const data = await apiCall("/api/trpc/billing.getUsage");
      const usage = data.result?.data?.json;
      if (!usage) { console.log("Could not fetch usage."); return; }
      console.log(`\n⚡ Token Usage:`);
      console.log(`  Plan: ${usage.tier}`);
      console.log(`  Balance: ${usage.tokensBalance} tokens`);
      console.log(`  Used this month: ${usage.tokensUsedThisMonth} / ${usage.monthlyAllowance}`);
    } else {
      console.log("Usage: revvelpress billing <plans|usage>");
    }
  },

  async publish(args) {
    const [target, paperId] = args;
    if (target === "zenodo" && paperId) {
      console.log(`📤 Publishing paper #${paperId} to Zenodo...`);
      const data = await apiCall("/api/trpc/papers.publishToZenodo", {
        method: "POST",
        body: JSON.stringify({ json: { paperId: parseInt(paperId) } }),
      });
      const result = data.result?.data?.json;
      console.log(`\n✓ Published to Zenodo!`);
      console.log(`  DOI: ${result?.doi}`);
      console.log(`  URL: ${result?.url}`);
    } else {
      console.log("Usage: revvelpress publish zenodo <paper-id>");
    }
  },
};

// ─── Main ───
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const commandArgs = args.slice(1);

  if (commands[command]) {
    try {
      await commands[command](commandArgs);
    } catch (err) {
      console.error(`\n❌ Error: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    commands.help();
    process.exit(1);
  }
}

main();
