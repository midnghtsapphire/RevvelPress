import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import {
  ArrowLeft, Send, MessageCircle, BookOpen, Mail, Loader2
} from "lucide-react";

export default function Support() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) { toast.error("Please fill in all fields"); return; }
    setSending(true);
    // For now, just show success - in production this would send an email/ticket
    setTimeout(() => {
      toast.success("Support request submitted! We'll get back to you soon.");
      setSubject(""); setMessage("");
      setSending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen gradient-mesh">
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Button variant="ghost" size="sm" onClick={() => setLocation(user ? "/dashboard" : "/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </nav>

      <div className="container py-16 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Support Center</h1>
          <p className="text-muted-foreground">Need help? We're here for you.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: BookOpen, title: "Documentation", desc: "Guides and tutorials for getting started", action: "Coming soon" },
            { icon: MessageCircle, title: "Community", desc: "Join our Discord community for help", action: "Coming soon" },
            { icon: Mail, title: "Email Support", desc: "Direct support for paid plans", action: "support@revvelpress.com" },
          ].map((item) => (
            <div key={item.title} className="glass-card rounded-xl p-5 text-center">
              <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
              <span className="text-xs text-primary">{item.action}</span>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Submit a Request</h2>
          <div className="space-y-4">
            <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="glass-input border-0" />
            <Textarea placeholder="Describe your issue or question..." value={message} onChange={e => setMessage(e.target.value)}
              className="glass-input border-0 min-h-[150px]" />
            <Button className="gradient-primary text-background w-full" onClick={handleSubmit} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Request
            </Button>
          </div>
        </div>

        <div className="mt-8 glass-card rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: "How do tokens work?", a: "Each AI content generation costs tokens. Different content types cost different amounts. Free accounts get 50 tokens/month." },
              { q: "Can I cancel my subscription?", a: "Yes! Go to Settings > Manage Billing to cancel anytime. You'll keep access until the end of your billing period." },
              { q: "What file formats can I upload?", a: "We support PDF, Markdown (.md), and DOCX files for paper uploads." },
              { q: "How does Zenodo publishing work?", a: "We use the Zenodo API to create a deposit, upload your paper, and publish it with a DOI. You need a Zenodo account." },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-sm font-semibold mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
