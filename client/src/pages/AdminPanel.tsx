import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Users, FileText, Zap, BarChart3, Loader2, Shield
} from "lucide-react";

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = trpc.admin.getAnalytics.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const { data: users } = trpc.admin.getUsers.useQuery(undefined, { enabled: !!user && user.role === "admin" });

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) { window.location.href = getLoginUrl(); return null; }
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="glass-card rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
            <span className="text-sm font-medium text-primary">Admin Panel</span>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-primary" },
            { label: "Total Papers", value: stats?.totalPapers || 0, icon: FileText, color: "text-emerald-400" },
            { label: "Content Generated", value: stats?.totalContent || 0, icon: Zap, color: "text-rose-400" },
            { label: "Tokens Used", value: stats?.totalTokensUsed || 0, icon: BarChart3, color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Users</h2>
          {isLoading ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Tokens</th>
                    <th className="pb-3 font-medium">Papers</th>
                    <th className="pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/10">
                      <td className="py-3 font-medium">{u.name || "—"}</td>
                      <td className="py-3 text-muted-foreground">{u.email || "—"}</td>
                      <td className="py-3"><span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary capitalize">{u.subscriptionTier || "free"}</span></td>
                      <td className="py-3">{u.tokensBalance || 0}</td>
                      <td className="py-3">{u.paperCount || 0}</td>
                      <td className="py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
