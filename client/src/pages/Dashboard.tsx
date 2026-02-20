import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  FileText, Plus, Sparkles, Calendar, Upload, Zap,
  MoreHorizontal, Trash2, ExternalLink, Clock
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState, useRef, useCallback } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: papers, isLoading: papersLoading } = trpc.papers.list.useQuery(undefined, { enabled: !!user });
  const { data: usage } = trpc.billing.getUsage.useQuery(undefined, { enabled: !!user });

  const createPaper = trpc.papers.create.useMutation({
    onSuccess: (data) => {
      setLocation(`/papers/${data.id}`);
      toast.success("Paper created!");
    },
  });

  const deletePaper = trpc.papers.delete.useMutation({
    onSuccess: () => {
      utils.papers.list.invalidate();
      toast.success("Paper deleted");
    },
  });

  const uploadPaper = trpc.papers.upload.useMutation({
    onSuccess: (data) => {
      utils.papers.list.invalidate();
      setLocation(`/papers/${data.id}`);
      toast.success("Paper uploaded!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const typeMap: Record<string, string> = { pdf: "pdf", md: "markdown", markdown: "markdown", docx: "docx" };
    const fileType = typeMap[ext || ""] as "pdf" | "markdown" | "docx";
    if (!fileType) { toast.error("Unsupported file type. Use PDF, Markdown, or DOCX."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadPaper.mutate({ fileName: file.name, fileContent: base64, fileType });
    };
    reader.readAsDataURL(file);
  }, [uploadPaper]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full gradient-primary" /></div>;
  if (!user) { window.location.href = getLoginUrl(); return null; }

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Top bar */}
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-background" />
            </div>
            <span className="font-bold">RevvelPress</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setLocation("/dashboard")} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium">Papers</button>
            <button onClick={() => setLocation("/calendar")} className="px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Calendar className="w-4 h-4 inline mr-1" />Calendar</button>
            <button onClick={() => setLocation("/pricing")} className="px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">Pricing</button>
            <button onClick={() => setLocation("/settings")} className="px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">Settings</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass-card px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-primary" />
              <span className="font-medium">{usage?.tokensBalance ?? 50} tokens</span>
            </div>
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-background">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Papers</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {papers?.length || 0} papers · {usage?.tokensUsedThisMonth || 0} tokens used this month
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".pdf,.md,.markdown,.docx" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" className="glass-card" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Upload
            </Button>
            <Button className="gradient-primary text-background font-semibold" onClick={() => createPaper.mutate({ title: "Untitled Paper" })}
              disabled={createPaper.isPending}>
              <Plus className="w-4 h-4 mr-2" /> New Paper
            </Button>
          </div>
        </div>

        {/* Papers grid */}
        {papersLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="glass-card rounded-xl h-48 animate-pulse" />)}
          </div>
        ) : !papers?.length ? (
          <div className="glass-card rounded-xl p-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No papers yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Create a new paper or upload an existing one to get started.</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" className="glass-card" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload Paper
              </Button>
              <Button className="gradient-primary text-background" onClick={() => createPaper.mutate({ title: "Untitled Paper" })}>
                <Plus className="w-4 h-4 mr-2" /> New Paper
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper) => (
              <div key={paper.id} className="glass-card rounded-xl p-5 hover:border-primary/20 transition-all group cursor-pointer"
                onClick={() => setLocation(`/papers/${paper.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                    paper.status === "published" ? "bg-primary/20 text-primary" :
                    paper.status === "review" ? "bg-accent/20 text-accent" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {paper.status}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/generate/${paper.id}`); }}>
                        <Sparkles className="w-4 h-4 mr-2" /> Generate Content
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deletePaper.mutate({ id: paper.id }); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2">{paper.title}</h3>
                {paper.abstract && <p className="text-muted-foreground text-xs line-clamp-3 mb-3">{paper.abstract}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(paper.updatedAt).toLocaleDateString()}</span>
                  {paper.sourceType !== "created" && <span className="flex items-center gap-1"><Upload className="w-3 h-3" />{paper.sourceType.toUpperCase()}</span>}
                  {paper.zenodoDoi && <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />DOI</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
