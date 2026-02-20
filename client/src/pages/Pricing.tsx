import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Check, Zap, ArrowLeft, Loader2 } from "lucide-react";

const tierColors: Record<string, string> = {
  free: "border-border/30",
  starter: "border-primary/40",
  pro: "border-primary ring-2 ring-primary/20",
  enterprise: "border-accent/40",
};

export default function Pricing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: plans } = trpc.billing.getPlans.useQuery();
  const { data: usage } = trpc.billing.getUsage.useQuery(undefined, { enabled: !!user });

  const subscribe = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const plansList = plans ? Object.entries(plans).map(([id, p]: [string, any]) => ({
    id, name: p.name, price: p.priceMonthly / 100, tokensPerMonth: p.monthlyTokens, features: p.features,
  })) : [];

  return (
    <div className="min-h-screen gradient-mesh">
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Button variant="ghost" size="sm" onClick={() => setLocation(user ? "/dashboard" : "/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {!user && !loading && (
            <Button size="sm" className="gradient-primary text-background" onClick={() => { window.location.href = getLoginUrl(); }}>
              Sign Up Free
            </Button>
          )}
        </div>
      </nav>

      <div className="container py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Simple, Token-Based Pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start free with 50 tokens. Upgrade when you need more. Cancel anytime.
          </p>
          {usage && (
            <div className="inline-flex items-center gap-2 mt-4 glass-card px-4 py-2 rounded-full text-sm">
              <Zap className="w-4 h-4 text-primary" />
              Current: <span className="font-semibold capitalize">{usage.tier}</span> · {usage.tokensBalance} tokens remaining
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plansList.map((plan) => {
            const isCurrentPlan = usage?.tier === plan.id;
            return (
              <div key={plan.id} className={`glass-card rounded-xl p-6 ${tierColors[plan.id] || ""} transition-all hover:scale-[1.02]`}>
                <div className="mb-4">
                  <h3 className="text-lg font-bold capitalize">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    {plan.price > 0 && <span className="text-muted-foreground text-sm">/month</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.tokensPerMonth} tokens/month</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                ) : plan.id === "free" ? (
                  <Button variant="outline" className="w-full" disabled>Free Forever</Button>
                ) : (
                  <Button className={`w-full ${plan.id === "professional" ? "gradient-primary text-background" : ""}`}
                    onClick={() => {
                      if (!user) { window.location.href = getLoginUrl(); return; }
                      subscribe.mutate({ tier: plan.id as any, origin: window.location.origin });
                    }}
                    disabled={subscribe.isPending}>
                    {subscribe.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {plan.price === 0 ? "Get Started" : "Subscribe"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All plans include auto-renewal. Cancel anytime from your settings. Unused tokens do not roll over.</p>
          <p className="mt-1">Test payments with card: 4242 4242 4242 4242</p>
        </div>
      </div>
    </div>
  );
}
