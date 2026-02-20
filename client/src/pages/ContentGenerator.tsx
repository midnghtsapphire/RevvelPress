import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Sparkles, Copy, Check, Zap, Loader2,
  Twitter, Linkedin, Instagram, Youtube, FileText, MessageSquare
} from "lucide-react";
import { Streamdown } from "streamdown";

const contentTypes = [
  { id: "twitter_thread", label: "Twitter/X Thread", icon: Twitter, tokens: 3 },
  { id: "linkedin_post", label: "LinkedIn Post", icon: Linkedin, tokens: 2 },
  { id: "instagram_caption", label: "Instagram Caption", icon: Instagram, tokens: 2 },
  { id: "tiktok_script", label: "TikTok Script", icon: Youtube, tokens: 3 },
  { id: "blog_post", label: "Blog Post", icon: FileText, tokens: 5 },
  { id: "infographic", label: "Infographic Text", icon: MessageSquare, tokens: 3 },
] as const;

const tones = ["professional", "casual", "humorous", "inspirational", "provocative"] as const;

export default function ContentGenerator() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ paperId: string }>();
  const paperId = parseInt(params.paperId || "0");

  const { data: paper } = trpc.papers.get.useQuery({ id: paperId }, { enabled: !!user && paperId > 0 });
  const { data: usage } = trpc.billing.getUsage.useQuery(undefined, { enabled: !!user });
  const { data: existingContent } = trpc.content.listByPaper.useQuery({ paperId }, { enabled: !!user && paperId > 0 });

  const [selectedType, setSelectedType] = useState<string>("twitter_thread");
  const [selectedTone, setSelectedTone] = useState<string>("professional");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const generate = trpc.content.generate.useMutation({
    onSuccess: () => {
      toast.success("Content generated!");
      trpc.useUtils().content.listByPaper.invalidate({ paperId });
      trpc.useUtils().billing.getUsage.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedTypeInfo = useMemo(() => contentTypes.find(t => t.id === selectedType), [selectedType]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) { window.location.href = getLoginUrl(); return null; }

  return (
    <div className="min-h-screen gradient-mesh">
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation(`/papers/${paperId}`)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Paper
            </Button>
          </div>
          <div className="glass-card px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary" />
            <span className="font-medium">{usage?.tokensBalance ?? 0} tokens</span>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">Generate Viral Content</h1>
            <p className="text-muted-foreground text-sm">From: <span className="text-foreground font-medium">{paper?.title || "Loading..."}</span></p>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            {/* Controls */}
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3">Content Type</h3>
                <div className="space-y-2">
                  {contentTypes.map((ct) => (
                    <button key={ct.id} onClick={() => setSelectedType(ct.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all ${
                        selectedType === ct.id ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-secondary border border-transparent"
                      }`}>
                      <ct.icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{ct.label}</span>
                      <span className="text-xs text-muted-foreground">{ct.tokens} tok</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3">Tone</h3>
                <div className="flex flex-wrap gap-2">
                  {tones.map((t) => (
                    <button key={t} onClick={() => setSelectedTone(t)}
                      className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${
                        selectedTone === t ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary hover:bg-secondary/80 border border-transparent"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full gradient-primary text-background font-semibold h-11"
                onClick={() => generate.mutate({ paperId, contentType: selectedType as any, tone: selectedTone as any })}
                disabled={generate.isPending}>
                {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate ({selectedTypeInfo?.tokens || 3} tokens)
              </Button>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {generate.isPending && (
                <div className="glass-card rounded-xl p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Generating {selectedTypeInfo?.label}...</p>
                </div>
              )}

              {existingContent?.length === 0 && !generate.isPending && (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No content generated yet</h3>
                  <p className="text-muted-foreground text-sm">Select a content type and tone, then click Generate.</p>
                </div>
              )}

              {existingContent?.map((item) => {
                const typeInfo = contentTypes.find(t => t.id === item.contentType);
                const Icon = typeInfo?.icon || FileText;
                return (
                  <div key={item.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{typeInfo?.label || item.contentType}</span>
                        <span className="text-xs text-muted-foreground capitalize">· {item.tone}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(item.generatedText, item.id)}>
                        {copiedId === item.id ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                      <Streamdown>{item.generatedText}</Streamdown>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      <span>· {item.tokensUsed} tokens</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
