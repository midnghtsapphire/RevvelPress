import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Save, Sparkles, Globe, FileText, Zap, Loader2
} from "lucide-react";

export default function PaperEditor() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const paperId = parseInt(params.id || "0");

  const { data: paper, isLoading } = trpc.papers.get.useQuery({ id: paperId }, { enabled: !!user && paperId > 0 });

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [authors, setAuthors] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (paper) {
      setTitle(paper.title || "");
      setAbstract(paper.abstract || "");
      setContent(paper.content || "");
      setKeywords(Array.isArray(paper.keywords) ? (paper.keywords as string[]).join(", ") : "");
      setAuthors(Array.isArray(paper.authors) ? (paper.authors as any[]).map(a => a.name || a).join(", ") : "");
    }
  }, [paper]);

  const updatePaper = trpc.papers.update.useMutation({
    onSuccess: () => { toast.success("Paper saved!"); setHasChanges(false); },
    onError: (err) => toast.error(err.message),
  });

  const generateAbstract = trpc.papers.generateAbstract.useMutation({
    onSuccess: (data) => { setAbstract(data.abstract); setHasChanges(true); toast.success("Abstract generated!"); },
    onError: (err) => toast.error(err.message),
  });

  const publishToZenodo = trpc.papers.publishToZenodo.useMutation({
    onSuccess: (data) => { toast.success(`Published! DOI: ${data.doi}`); },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = useCallback(() => {
    updatePaper.mutate({
      id: paperId,
      title,
      abstract: abstract || undefined,
      content: content || undefined,
      keywords: keywords ? keywords.split(",").map(k => k.trim()) : undefined,
      authors: authors ? authors.split(",").map(a => ({ name: a.trim() })) : undefined,
    });
  }, [paperId, title, abstract, content, keywords, authors, updatePaper]);

  const handleChange = useCallback((setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  }, []);

  if (authLoading || isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) { window.location.href = getLoginUrl(); return null; }

  return (
    <div className="min-h-screen gradient-mesh">
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">{title || "Untitled"}</span>
            {hasChanges && <span className="text-xs text-accent">Unsaved</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="glass-card" onClick={() => setLocation(`/generate/${paperId}`)}>
              <Sparkles className="w-4 h-4 mr-1" /> Generate Content
            </Button>
            <Button variant="outline" size="sm" className="glass-card" onClick={() => publishToZenodo.mutate({ paperId })}
              disabled={publishToZenodo.isPending}>
              {publishToZenodo.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Globe className="w-4 h-4 mr-1" />}
              Publish to Zenodo
            </Button>
            <Button size="sm" className="gradient-primary text-background" onClick={handleSave} disabled={updatePaper.isPending || !hasChanges}>
              {updatePaper.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-4xl mx-auto">
        <div className="glass-card rounded-xl p-8 space-y-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Title</label>
            <Input value={title} onChange={handleChange(setTitle)} placeholder="Paper title..."
              className="glass-input text-xl font-semibold h-12 border-0" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Authors (comma-separated)</label>
              <Input value={authors} onChange={handleChange(setAuthors)} placeholder="John Doe, Jane Smith..."
                className="glass-input border-0" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Keywords (comma-separated)</label>
              <Input value={keywords} onChange={handleChange(setKeywords)} placeholder="machine learning, NLP..."
                className="glass-input border-0" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-muted-foreground">Abstract</label>
              <Button variant="ghost" size="sm" className="text-xs text-primary"
                onClick={() => generateAbstract.mutate({ paperId })} disabled={generateAbstract.isPending}>
                {generateAbstract.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                AI Generate
              </Button>
            </div>
            <Textarea value={abstract} onChange={handleChange(setAbstract)} placeholder="Paper abstract..."
              className="glass-input border-0 min-h-[120px] resize-y" />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Content</label>
            <Textarea value={content} onChange={handleChange(setContent)} placeholder="Write your paper content here... Supports Markdown formatting."
              className="glass-input border-0 min-h-[400px] resize-y font-mono text-sm leading-relaxed" />
          </div>

          {paper?.zenodoDoi && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm">
              <Globe className="w-4 h-4 text-primary" />
              <span>Published on Zenodo — DOI: <a href={`https://doi.org/${paper.zenodoDoi}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">{paper.zenodoDoi}</a></span>
            </div>
          )}

          {paper?.sourceFile && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary text-sm">
              <FileText className="w-4 h-4" />
              <span>Source: {paper.sourceType?.toUpperCase()} file</span>
              <a href={paper.sourceFile} target="_blank" rel="noopener noreferrer" className="text-primary underline ml-auto">View original</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
