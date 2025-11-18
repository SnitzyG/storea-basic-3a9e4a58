import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  faqs: FAQ[];
}

export const FAQSection = ({ title = "Frequently Asked Questions", faqs }: FAQSectionProps) => {
  if (faqs.length === 0) return null;

  return (
    <section className="mt-16 mb-8 max-w-3xl mx-auto" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-bold mb-6 text-center">
        {title}
      </h2>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {faqs.map((faq, index) => (
          <AccordionItem 
            key={index} 
            value={`item-${index}`}
            className="border border-border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="text-left hover:no-underline py-4">
              <span className="font-medium">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
