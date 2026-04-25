import { useEffect, useState } from "react";
import { ArrowLeft, Inbox, Loader2, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Signup = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  team_name: string | null;
  role: string | null;
  package: string;
  message: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "contacted", "trialing", "converted", "declined"];

const PACKAGE_LABEL: Record<string, string> = {
  essentials: "Team Essentials",
  pro: "Pro Analytics",
};

function AdminSignupsContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_signups")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Could not load sign-ups", description: error.message, variant: "destructive" });
      return;
    }
    setSignups((data ?? []) as Signup[]);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("service_signups").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setSignups((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const filtered = filter === "all" ? signups : signups.filter((s) => s.status === filter);

  const counts = signups.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Inbox className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold">Service Sign-ups</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Leads from the public pricing page. Total: {signups.length}
              {Object.entries(counts).map(([k, v]) => (
                <span key={k} className="ml-2">
                  · {k}: {v}
                </span>
              ))}
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No sign-ups yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{s.full_name}</CardTitle>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <a
                          href={`mailto:${s.email}`}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <Mail className="h-3 w-3" />
                          {s.email}
                        </a>
                        {s.phone && (
                          <a
                            href={`tel:${s.phone}`}
                            className="inline-flex items-center gap-1 hover:text-foreground"
                          >
                            <Phone className="h-3 w-3" />
                            {s.phone}
                          </a>
                        )}
                        <span>{format(new Date(s.created_at), "PP p")}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={s.package === "pro" ? "default" : "secondary"}>
                        {PACKAGE_LABEL[s.package] ?? s.package}
                      </Badge>
                      <Select value={s.status} onValueChange={(v) => updateStatus(s.id, v)}>
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Team / Club</div>
                    <div>{s.team_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Role</div>
                    <div className="capitalize">{s.role?.replace("_", " ") || "—"}</div>
                  </div>
                  {s.message && (
                    <div className="sm:col-span-2">
                      <div className="text-xs uppercase text-muted-foreground">Message</div>
                      <div className="whitespace-pre-wrap">{s.message}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function AdminSignups() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminSignupsContent />
    </ProtectedRoute>
  );
}
