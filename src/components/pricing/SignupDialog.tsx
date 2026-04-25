import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const signupSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  team_name: z.string().trim().max(100).optional().or(z.literal("")),
  role: z.string().min(1, "Please select a role"),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

interface SignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: "essentials" | "pro" | null;
  packageName: string;
}

export function SignupDialog({ open, onOpenChange, packageId, packageName }: SignupDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    team_name: "",
    role: "",
    message: "",
  });

  const reset = () => {
    setForm({ full_name: "", email: "", phone: "", team_name: "", role: "", message: "" });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageId) return;

    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Please check the form",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("service_signups").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      team_name: parsed.data.team_name || null,
      role: parsed.data.role,
      package: packageId,
      message: parsed.data.message || null,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Could not submit",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setSuccess(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <DialogHeader className="mt-4">
              <DialogTitle className="text-center">You're on the list!</DialogTitle>
              <DialogDescription className="text-center">
                Thanks for signing up for <span className="font-medium text-foreground">{packageName}</span>.
                We'll be in touch within 24 hours to set up your free trial.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-6" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Start your free trial</DialogTitle>
              <DialogDescription>
                You're signing up for <span className="font-medium text-foreground">{packageName}</span>.
                We'll get back to you within 24 hours.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input
                    id="full_name"
                    required
                    maxLength={100}
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    maxLength={30}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="team_name">Team / Club</Label>
                  <Input
                    id="team_name"
                    maxLength={100}
                    value={form.team_name}
                    onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">I am a... *</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="player">Player</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="club_admin">Club / Academy admin</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Tell us about your team (optional)</Label>
                <Textarea
                  id="message"
                  rows={3}
                  maxLength={1000}
                  placeholder="League, level, what you're hoping to get from analysis..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit sign-up
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
