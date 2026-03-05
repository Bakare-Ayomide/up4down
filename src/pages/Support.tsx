import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, ExternalLink, HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const Support = () => {
  const { settings } = useSiteSettings();
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    supabase
      .from("faq_entries")
      .select("id, question, answer")
      .eq("published", true)
      .order("sort_order")
      .then(({ data }) => { if (data) setFaqs(data as any); });
  }, []);

  const app = settings.app_settings;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-3">Support</h1>
          <p className="text-muted-foreground text-lg">How can we help you?</p>
        </div>

        {/* Contact */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {app.support_email && (
            <Card className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Email Support</h3>
                <a href={`mailto:${app.support_email}`} className="text-sm text-primary hover:underline">{app.support_email}</a>
              </div>
            </Card>
          )}
          {app.support_url && (
            <Card className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ExternalLink className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Help Center</h3>
                <a href={app.support_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Visit Help Center</a>
              </div>
            </Card>
          )}
        </div>

        {/* FAQ */}
        {faqs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map(faq => (
                <AccordionItem key={faq.id} value={faq.id} className="border border-border rounded-xl px-4">
                  <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground whitespace-pre-wrap">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Support;
