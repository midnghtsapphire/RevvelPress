# RevvelPress TODO

## Core Features
- [x] Database schema (papers, content, tokens, subscriptions, calendar)
- [x] Rich text paper editor with formatting and citations
- [x] Upload papers (PDF, Markdown, DOCX)
- [x] AI viral content generator (Twitter/X threads, TikTok scripts, LinkedIn, Instagram, blog posts)
- [x] One-click publish to Zenodo (API integration)
- [x] SSRN submission helper
- [x] Content calendar and scheduling

## Standard Modules (Mandatory)
- [x] Google OAuth sign-in (via Manus OAuth)
- [x] Apple Sign-In (via Manus OAuth)
- [x] Email/password auth with JWT (via Manus OAuth)
- [x] Stripe billing (subscriptions + one-time payments)
- [x] Token/credit economy (free tier + paid tokens)
- [x] Subscription tiers by usage volume (Free/Starter/Professional/Enterprise)
- [x] Customer service layer (support tickets, FAQ, contact)
- [x] Payment failure handling (Stripe webhook events)
- [x] Universal accessibility modes (WCAG AAA, ADHD, Dyslexic, ECO CODE, NEURO CODE)
- [x] Self-healing error recovery (ErrorBoundary component)
- [x] Analytics dashboard (admin panel with stats)

## AI Integration
- [x] OpenRouter integration for content generation
- [x] FOSS model selection to minimize costs (gemini-2.5-flash via invokeLLM)
- [x] Clear display of generated content with copy functionality

## Design
- [x] Glassmorphism UI dark mode
- [x] Responsive mobile-friendly design
- [x] Landing page with CTAs

## Deployment
- [ ] Push to MIDNGHTSAPPHIRE on GitHub
- [ ] Deploy live with public URL
- [ ] Add card to meetaudreyevans.com hub

## Attribution
- [x] Footer attribution for integrated components (OpenRouter, Zenodo, SSRN)

## Additional Requirements
- [x] Admin auto-auth for angelreporters@gmail.com (admin role via owner openId)
- [x] Unique color identity (NO brown, NO pure blue — emerald/coral palette)
- [x] Colors survive blue light filters (warm tones, no pure blues)
- [x] Glassmorphism with unique palette distinct from other apps

## Accessibility Modes (Toggleable in Settings Panel)
- [x] ECO CODE mode — low energy, reduced animations, dark backgrounds
- [x] NEURO CODE / Neurodivergent mode — ADHD-friendly, reduced clutter, focus mode
- [x] DYSLEXIC MODE — OpenDyslexic font, increased spacing, high contrast
- [x] NO BLUE LIGHT mode — warm color filter, removes blue wavelengths
- [x] WCAG AAA compliance — full accessibility throughout app

## CLI & MCP
- [x] CLI tool (revvelpress-cli.mjs) — all paper/content/calendar/billing commands
- [x] MCP server (revvelpress-mcp.mjs) — Model Context Protocol integration
- [x] Tests (28 passing — auth, billing, papers, content, calendar, settings, admin)
