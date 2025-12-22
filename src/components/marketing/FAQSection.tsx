import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
interface FAQ {
  question: string;
  answer: string;
}
interface FAQSectionProps {
  title?: string;
  faqs: FAQ[];
}
export const FAQSection = ({
  title = "Frequently Asked Questions",
  faqs
}: FAQSectionProps) => {
  if (faqs.length === 0) return null;
  return <section className="mt-16 mb-8 max-w-3xl mx-auto" aria-labelledby="faq-heading">
      
      
    </section>;
};