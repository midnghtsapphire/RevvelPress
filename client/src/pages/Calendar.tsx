import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Calendar as CalIcon, ChevronLeft, ChevronRight,
  Plus, Zap, Clock, Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

export default function Calendar() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPlatform, setNewPlatform] = useState("twitter");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("09:00");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: events } = trpc.calendar.list.useQuery(undefined, { enabled: !!user });

  const createEvent = trpc.calendar.create.useMutation({
    onSuccess: () => {
      utils.calendar.list.invalidate();
      setDialogOpen(false);
      setNewTitle(""); setNewContent(""); setNewDate(""); setNewTime("09:00");
      toast.success("Event scheduled!");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteEvent = trpc.calendar.delete.useMutation({
    onSuccess: () => { utils.calendar.list.invalidate(); toast.success("Event deleted"); },
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const getEventsForDay = (day: number) => {
    if (!events) return [];
    return events.filter(e => {
      const d = new Date(e.scheduledAt);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const handleCreate = () => {
    if (!newTitle || !newDate) { toast.error("Title and date are required"); return; }
    const scheduledAt = new Date(`${newDate}T${newTime}`);
    createEvent.mutate({
      title: newTitle,
      description: newContent || undefined,
      platform: newPlatform,
      scheduledAt: scheduledAt.toISOString(),
    });
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full gradient-primary" /></div>;
  if (!user) { window.location.href = getLoginUrl(); return null; }

  return (
    <div className="min-h-screen gradient-mesh">
      <nav className="glass sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary text-background">
                <Plus className="w-4 h-4 mr-1" /> Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50">
              <DialogHeader><DialogTitle>Schedule Content</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <Input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="glass-input border-0" />
                <Textarea placeholder="Content to post..." value={newContent} onChange={e => setNewContent(e.target.value)} className="glass-input border-0 min-h-[80px]" />
                <Select value={newPlatform} onValueChange={setNewPlatform}>
                  <SelectTrigger className="glass-input border-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="glass-input border-0" />
                  <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="glass-input border-0" />
                </div>
                <Button className="w-full gradient-primary text-background" onClick={handleCreate} disabled={createEvent.isPending}>
                  {createEvent.isPending ? "Scheduling..." : "Schedule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <div className="container py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalIcon className="w-6 h-6 text-primary" /> Content Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground border-b border-border/30">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-3">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              return (
                <div key={i} className={`min-h-[100px] p-2 border-b border-r border-border/10 ${!day ? "bg-secondary/20" : ""}`}>
                  {day && (
                    <>
                      <span className={`text-xs font-medium ${isToday ? "bg-primary text-background w-6 h-6 rounded-full flex items-center justify-center" : "text-muted-foreground"}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id} className="group flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary truncate">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{ev.title}</span>
                            <button onClick={() => deleteEvent.mutate({ id: ev.id })} className="opacity-0 group-hover:opacity-100 ml-auto">
                              <Trash2 className="w-2.5 h-2.5 text-destructive" />
                            </button>
                          </div>
                        ))}
                        {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events list */}
        {events && events.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
            <div className="space-y-2">
              {events.filter(e => new Date(e.scheduledAt) >= new Date()).sort((a,b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).slice(0, 10).map(ev => (
                <div key={ev.id} className="glass-card rounded-lg p-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${ev.status === "published" ? "bg-primary" : ev.status === "cancelled" ? "bg-destructive" : "bg-accent"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{ev.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">{ev.platform}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(ev.scheduledAt).toLocaleString()}</span>
                  <Button variant="ghost" size="sm" onClick={() => deleteEvent.mutate({ id: ev.id })}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
