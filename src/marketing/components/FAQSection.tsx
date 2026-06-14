import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollReveal } from "@/components/ScrollReveal";

const faqs = [
  {
    question: "What video links do you accept?",
    answer: "Any publicly accessible link works — YouTube, Vimeo, Google Drive, or Dropbox. The video just needs to be viewable without a login.",
  },
  {
    question: "How long does analysis take?",
    answer: "Team Essentials matches are delivered within 48 hours. Pro Analytics matches are delivered within 24 hours.",
  },
  {
    question: "Do my players need to create accounts?",
    answer: "No. Coaches and analysts log in, but players can view their profile pages without an account if the club enables public access.",
  },
  {
    question: "What happens after the free trial?",
    answer: "After your 3 free trial matches, you continue at the standard per-match rate. No subscription, no minimum commitment — just pay per match.",
  },
  {
    question: "Can I request analysis for past matches if I have recordings?",
    answer: "Yes. Past match recordings are analyzed the same way as live matches. Just submit the video link.",
  },
  {
    question: "Is the club data visible to the public?",
    answer: "Clubs can choose to make their match results and player stats publicly visible — useful for sharing on social media. Private tactical notes and detailed coaching reports are always login-only.",
  },
];

export function FAQSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <ScrollReveal animation="fade-up" className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Common questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about our match analysis and tagging service.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full border-t border-border/60">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/60">
                <AccordionTrigger className="text-left text-base md:text-lg font-medium hover:text-primary hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
export default FAQSection;
