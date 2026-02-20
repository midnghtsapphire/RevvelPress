import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Zap, Eye, Brain, BookOpen, Sun, Shield, CreditCard, Loader2
} from "lucide-react";

const accessibilityModes = [
  { key: "ecoCode", label: "ECO CODE", desc: "Reduce energy consumption with dimmed visuals", icon: Sun },
  { key: "neuroCode", label: "NEURO CODE", desc: "Disable animations and transitions for neurodivergent users", icon: Brain },
  { key: "dyslexicMode", label: "DYSLEXIC MODE", desc: "Use dyslexia-friendly fonts and spacing", icon: BookOpen },
  { key: "noBlueLight", label: "NO BLUE LIGHT", desc: "Warm filter to reduce eye strain", icon: Eye },
  { key: "wcagAAA", label: "WCAG AAA", desc: "Maximum contrast and enlarged text for accessibility", icon: Shield },
] as const;

export default function Settings() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: accessibility, isLoading: accLoading } = trpc.settings.getAccessibility.useQuery(undefined, { enabled: !!user });
  const { data: usage } = trpc.billing.getUsage.useQuery(undefined, { enabled: !!user });

  const updateAccessibility = trpc.settings.updateAccessibility.useMutation({
    onSuccess: () => {
      utils.settings.getAccessibility.invalidate();
      toast.success("Settings updated!");
    },
  });

  const portalSession = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleToggle = (key: string, value: boolean) => {
    updateAccessibility.mutate({ [key]: value } as any);
    // Apply CSS class immediately
    const body = document.body;
    const classMap: Record<string, string> = {
      ecoCode: "eco-code", neuroCode: "neuro-code", dyslexicMode: "dyslexic-mode",
      noBlueLight: "no-blue-light", wcagAAA: "wcag-aaa",
    };
    if (classMap[key]) {
      if (value) body.classList.add(classMap[key]);
      else body.classList.remove(classMap[key]);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) { window.location.href = getLoginUrl(); return null; }

  return (
    <div className="min-h-screen gradient-mesh">
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </nav>

      <div className="container py-8 max-w-2xl mx-auto space-y-8">
        {/* Account */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{user.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user.email || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="capitalize">{user.role}</span></div>
          </div>
        </div>

        {/* Subscription */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Subscription</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="capitalize font-medium">{usage?.tier || "free"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tokens Balance</span><span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" />{usage?.tokensBalance || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Used This Month</span><span>{usage?.tokensUsedThisMonth || 0} / {usage?.monthlyAllowance || 50}</span></div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => setLocation("/pricing")}>Change Plan</Button>
            {usage?.tier !== "free" && (
              <Button variant="outline" size="sm" onClick={() => portalSession.mutate({ origin: window.location.origin })}
                disabled={portalSession.isPending}>
                {portalSession.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Manage Billing
              </Button>
            )}
          </div>
        </div>

        {/* Accessibility */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Accessibility Modes</h2>
          <div className="space-y-4">
            {accessibilityModes.map((mode) => {
              const Icon = mode.icon;
              const isEnabled = accessibility?.[mode.key as keyof typeof accessibility] || false;
              return (
                <div key={mode.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{mode.label}</div>
                      <div className="text-xs text-muted-foreground">{mode.desc}</div>
                    </div>
                  </div>
                  <Switch checked={!!isEnabled} onCheckedChange={(v) => handleToggle(mode.key, v)} disabled={accLoading} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin link */}
        {user.role === "admin" && (
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-bold mb-2">Admin</h2>
            <Button variant="outline" size="sm" onClick={() => setLocation("/admin")}>Open Admin Panel</Button>
          </div>
        )}

        {/* Logout */}
        <div className="text-center">
          <Button variant="ghost" className="text-destructive" onClick={() => { logout(); setLocation("/"); }}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
