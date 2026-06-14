import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";

import { MarketingLayout } from "@/marketing/layouts/MarketingLayout";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const submitSchema = z.object({
  submitter_name: z
    .string()
    .trim()
    .min(1, "Your name is required")
    .max(100, "Name must be less than 100 characters"),
  submitter_email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  club_name: z
    .string()
    .trim()
    .min(1, "Club name is required")
    .max(150, "Club name must be less than 150 characters"),
  video_url: z
    .string()
    .trim()
    .min(1, "Match video URL is required")
    .url("Please enter a valid URL (https://...)")
    .max(2000, "URL is too long"),
  match_date: z.date().optional(),
  opponent: z.string().trim().max(150, "Opponent name too long").optional().or(z.literal("")),
  competition: z.string().trim().max(150, "Competition name too long").optional().or(z.literal("")),
  package: z.enum(["essentials", "pro"], {
    required_error: "Please select a package",
  }),
  notes: z.string().trim().max(2000, "Notes must be less than 2000 characters").optional().or(z.literal("")),
});

type SubmitFormValues = z.infer<typeof submitSchema>;

export default function Submit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      submitter_name: "",
      submitter_email: "",
      club_name: "",
      video_url: "",
      match_date: undefined,
      opponent: "",
      competition: "",
      package: undefined as unknown as "essentials",
      notes: "",
    },
  });

  const onSubmit = async (values: SubmitFormValues) => {
    setIsSubmitting(true);
    try {
      const client = supabase as any;
      const { error } = await client.from("match_submissions").insert({
        submitter_name: values.submitter_name,
        submitter_email: values.submitter_email,
        club_name: values.club_name,
        video_url: values.video_url,
        match_date: values.match_date ? format(values.match_date, "yyyy-MM-dd") : null,
        opponent: values.opponent || null,
        competition: values.competition || null,
        package: values.package,
        notes: values.notes || null,
        status: "pending",
      });

      if (error) throw error;

      setSubmittedEmail(values.submitter_email);
      form.reset();
    } catch (err) {
      console.error("Submission failed", err);
      toast.error("Submission failed. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedEmail) {
    return (
      <MarketingLayout>
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-up">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Match submitted
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We've received your match. Expect your dashboard within 48 hours.
              We'll email you at <span className="font-medium text-foreground">{submittedEmail}</span> when it's ready.
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setSubmittedEmail(null)}
              className="mt-4"
            >
              Submit another match
            </Button>
          </div>
        </section>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-3 mb-10 animate-fade-up">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Submit a match
            </h1>
            <p className="text-lg text-muted-foreground">
              Share your match video and we'll deliver a full data dashboard within 48 hours.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Submitter info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="submitter_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Coach" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="submitter_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@club.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="club_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Glacis United FC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match video URL *</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      YouTube, Vimeo, Google Drive, or Dropbox. Must be publicly accessible.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="match_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Match date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="opponent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opponent</FormLabel>
                      <FormControl>
                        <Input placeholder="Mons Calpe SC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="competition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competition</FormLabel>
                    <FormControl>
                      <Input placeholder="Gibraltar Premier League" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Package selection */}
              <FormField
                control={form.control}
                name="package"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Choose a package *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        <label
                          className={cn(
                            "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all",
                            "hover:border-primary/60 hover:bg-accent/40",
                            field.value === "essentials"
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border"
                          )}
                        >
                          <RadioGroupItem value="essentials" className="mt-1" />
                          <div className="flex-1">
                            <div className="font-semibold">Team Essentials</div>
                            <div className="text-sm text-muted-foreground mt-0.5">$25 / match</div>
                            <div className="text-xs text-muted-foreground mt-2">Delivered in 48 hours</div>
                          </div>
                        </label>

                        <label
                          className={cn(
                            "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all",
                            "hover:border-primary/60 hover:bg-accent/40",
                            field.value === "pro"
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border"
                          )}
                        >
                          <RadioGroupItem value="pro" className="mt-1" />
                          <div className="flex-1">
                            <div className="font-semibold">Pro Analytics</div>
                            <div className="text-sm text-muted-foreground mt-0.5">$100 / match</div>
                            <div className="text-xs text-muted-foreground mt-2">Delivered in 24 hours</div>
                          </div>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Anything we should know about the match, formations, or players to watch?"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit match"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </section>
    </MarketingLayout>
  );
}
