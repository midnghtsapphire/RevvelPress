# RevvelPress V2 TODO

## Phase 1: Database & Core Infrastructure
- [x] Extend database schema with publishing platforms, outlet matching, legal citations
- [x] Create tables: platforms, submissions, outlets, citations, case_law_cache
- [x] Set up Zenodo API integration with token/ORCID from env
- [x] Configure OpenRouter for AI-powered outlet matching and citation generation

## Phase 2: Multi-Platform Auto-Publishing (One-Click Zenodo → All Platforms)
- [x] Zenodo integration: create deposit, upload file, mint DOI
- [x] SSRN auto-submission: format paper, submit via API, track status
- [x] arXiv auto-submission: format paper (TeX), submit via API, track status
- [x] ResearchGate auto-submission: format paper, upload via API/web automation
- [x] Academia.edu auto-submission: format paper, upload via API/web automation
- [x] Google Scholar indexing: auto-submit sitemap, track indexing status
- [x] Submission dashboard: track status across all 5 platforms in real-time
- [x] Format adapter: auto-format each paper to match each platform's requirements
- [x] Metadata cleaner: strip all AI metadata before publishing (clean author, title, date, DOI, ORCID only)

## Phase 3: AI-Powered Outlet Matching & Auto-Submission
- [x] Outlet database: newspapers, magazines, journals with acceptance criteria
- [x] AI scoring engine: analyze paper → score outlets by acceptance probability
- [x] Editorial requirements parser: auto-detect each outlet's format/style requirements
- [x] Auto-format submissions: adapt paper to each outlet's editorial guidelines
- [x] Batch submission system: submit to high-probability outlets simultaneously
- [x] Submission tracking: acceptance/rejection status, feedback collection
- [x] Outlet analytics: success rate per outlet, trending outlets for paper type

## Phase 4: Legal Citation Generation (Full Support)
- [x] Citation format support: Bluebook, ALWD, APA, MLA, Chicago, Harvard, IEEE
- [x] Auto-generate citations from case law, statutes, regulations
- [x] Citation checker: verify citations are correct and current
- [x] Legal paper templates: briefs, motions, memoranda, law review articles
- [x] Case law database integration: CourtListener, Google Scholar Legal (free sources)
- [x] Auto-generate bibliography/works cited in any format
- [x] Shepardize/KeyCite equivalent: check if cases are still good law using free sources
- [x] Citation formatter UI: paste citation → select format → copy formatted result

## Phase 5: Dashboard & Tracking
- [x] Publishing dashboard: submission status across all platforms
- [x] Outlet matching results: AI-scored outlets, acceptance probability
- [x] Citation management: organize, format, verify citations
- [ ] Legal paper builder: wizard-style interface for creating legal documents
- [ ] Analytics: submission success rates, outlet performance, citation usage

## Phase 6: Accessibility & Design
- [ ] WCAG AAA compliance throughout app
- [ ] ECO CODE mode (low energy, reduced animations, dark backgrounds)
- [ ] NEURO CODE / Neurodivergent mode (ADHD-friendly, reduced clutter, focus mode)
- [ ] DYSLEXIC MODE (OpenDyslexic font, increased spacing, high contrast)
- [ ] NO BLUE LIGHT mode (warm color filter, removes blue wavelengths)
- [ ] Unique color identity (warm tones, no pure blues, distinct from other apps)
- [ ] Glassmorphism design language

## Phase 7: Standard Modules (Mandatory)
- [ ] Google OAuth sign-in (via Manus OAuth)
- [ ] Apple Sign-In (via Manus OAuth)
- [ ] Email/password auth with JWT (via Manus OAuth)
- [ ] Stripe billing (subscriptions + one-time payments)
- [ ] Token/credit economy (free tier + paid tokens for bulk submissions)
- [ ] Subscription tiers by usage volume (Free/Starter/Professional/Enterprise)
- [ ] Customer service layer (support tickets, FAQ, contact)
- [ ] Payment failure handling (Stripe webhook events)
- [ ] Self-healing error recovery (ErrorBoundary component)
- [ ] Analytics dashboard (admin panel with stats)

## Phase 8: AI Integration & Metadata Handling
- [ ] OpenRouter integration for outlet matching and citation generation
- [ ] FOSS model selection to minimize costs
- [ ] Clear display of AI-generated content with copy functionality
- [ ] Metadata cleaner: NO watermarks, NO AI metadata in exports
- [ ] Clean metadata only: author, title, description, date, DOI, ORCID
- [ ] Strip all AI-related metadata before publishing to any platform

## Phase 9: Testing & Deployment
- [ ] Write vitest tests for all core features
- [ ] Test multi-platform submissions with mock APIs
- [ ] Test citation generation and formatting
- [ ] Test outlet matching algorithm
- [ ] Push to MIDNGHTSAPPHIRE/RevvelPress on GitHub
- [ ] Deploy live with public URL
- [ ] Add card to meetaudreyevans.com hub with icon, description, launch button

## Phase 10: Attribution & Documentation
- [ ] Footer attribution for integrated components (OpenRouter, Zenodo, SSRN, arXiv, etc.)
- [ ] API attribution: free sources (CourtListener, Google Scholar Legal)
- [ ] Admin auto-auth for angelreporters@gmail.com (admin role via owner openId)
- [ ] CLI tool for batch submissions and citation management
- [ ] MCP server for Model Context Protocol integration
