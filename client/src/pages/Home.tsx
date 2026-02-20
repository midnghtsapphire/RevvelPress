import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  FileText, Sparkles, Calendar, Upload, Globe, Zap,
  Twitter, Linkedin, Instagram, Youtube, ArrowRight, Shield
} from "lucide-react";

const features = [
  { icon: FileText, title: "Academic Paper Editor", desc: "Write, format, and cite with a rich text editor built for researchers." },
  { icon: Upload, title: "Upload Papers", desc: "Import PDF, Markdown, or DOCX files and start generating instantly." },
  { icon: Sparkles, title: "AI Viral Content", desc: "Auto-generate Twitter threads, TikTok scripts, LinkedIn posts, and more." },
  { icon: Globe, title: "One-Click Publish", desc: "Publish directly to Zenodo with DOI assignment. SSRN submission helper included." },
  { icon: Calendar, title: "Content Calendar", desc: "Schedule and manage your content distribution across all platforms." },
  { icon: Shield, title: "Token Economy", desc: "Start free with 50 tokens. Scale with flexible subscription tiers." },
];

const platforms = [
  { icon: Twitter, name: "Twitter/X Threads", color: "text-emerald-400" },
  { icon: Linkedin, name: "LinkedIn Posts", color: "text-emerald-300" },
  { icon: Instagram, name: "Instagram Captions", color: "text-rose-400" },
  { icon: Youtube, name: "YouTube Scripts", color: "text-rose-300" },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen gradient-mesh">
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold tracking-tight">RevvelPress</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => setLocation("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => setLocation("/support")} className="hover:text-foreground transition-colors">Support</button>
          </div>
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <Button onClick={() => setLocation("/dashboard")} className="gradient-primary text-background font-semibold">
                Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { window.location.href = getLoginUrl(); }}>Sign In</Button>
                <Button onClick={() => { window.location.href = getLoginUrl(); }} className="gradient-primary text-background font-semibold">Get Started Free</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="container py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm text-primary mb-6">
              <Sparkles className="w-4 h-4" /> AI-Powered Academic Content Platform
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
              Turn Research Into
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Viral Content</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Write academic papers, then auto-generate Twitter threads, TikTok scripts,
              LinkedIn posts, blog articles, and more — all from one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="gradient-primary text-background font-semibold px-8 h-12 text-base"
                onClick={() => user ? setLocation("/dashboard") : (window.location.href = getLoginUrl())}>
                Start Free — 50 Tokens <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="glass-card h-12 text-base" onClick={() => setLocation("/pricing")}>
                View Pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {platforms.map((p) => (
            <motion.div key={p.name} className="flex items-center gap-2 glass-card px-4 py-2 rounded-full" whileHover={{ scale: 1.05 }}>
              <p.icon className={`w-5 h-5 ${p.color}`} />
              <span className="text-sm font-medium">{p.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">From paper creation to viral distribution — one seamless workflow.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2></div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: "01", title: "Write or Upload", desc: "Create a paper in our editor or upload an existing PDF/DOCX/Markdown file." },
            { step: "02", title: "Generate Content", desc: "Select platforms and tone. AI creates viral-ready content from your research." },
            { step: "03", title: "Publish & Schedule", desc: "Publish to Zenodo, copy content to social media, or schedule via calendar." },
          ].map((s, i) => (
            <motion.div key={s.step} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}>
              <div className="text-5xl font-bold text-primary/20 mb-4">{s.step}</div>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container py-20">
        <div className="glass-card rounded-2xl p-10 md:p-16 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Amplify Your Research?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join researchers turning papers into viral content. Start with 50 free tokens — no credit card required.</p>
          <Button size="lg" className="gradient-primary text-background font-semibold px-10 h-12 text-base"
            onClick={() => user ? setLocation("/dashboard") : (window.location.href = getLoginUrl())}>
            Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <footer className="glass border-t border-border/50">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center"><Zap className="w-4 h-4 text-background" /></div>
            <span className="font-semibold">RevvelPress</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">AI content generation provided by free/open-source models via OpenRouter. Publishing provided by Zenodo API. Built by Audrey Evans.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button onClick={() => setLocation("/pricing")} className="hover:text-foreground">Pricing</button>
            <button onClick={() => setLocation("/support")} className="hover:text-foreground">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
