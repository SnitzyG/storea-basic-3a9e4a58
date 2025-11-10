import { PublicLayout } from '@/components/marketing/PublicLayout';
import { useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy - STOREA';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'STOREA Privacy Policy - Learn how we collect, use, and protect your personal and business information in accordance with Australian privacy laws.');
    }
  }, []);


  return (
    <PublicLayout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-y-auto max-h-[calc(100vh-120px)]">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">STOREA Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-4">Last Modified: 10th November 2025</p>
          <p className="text-muted-foreground mb-2">
            STOREA values and respects your privacy. We are committed to protecting your personal and business information in accordance with the Privacy Act 1988 (Cth) and other applicable privacy laws.
          </p>
          <p className="text-muted-foreground">This policy explains:</p>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li>What information we collect</li>
            <li>How we use and protect it</li>
            <li>How you can access or correct it</li>
            <li>How to contact us</li>
          </ul>
        </div>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">1. What is Personal Information?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-4">
                Personal information is any information or opinion about an individual that identifies you directly or indirectly. Examples include:
              </p>
              <ul className="list-disc pl-6">
                <li>Your name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Mailing or street address</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">2. What is Business Information?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-4">
                Business information is any information or opinion about a business that identifies it directly or indirectly. Examples include:
              </p>
              <ul className="list-disc pl-6">
                <li>Business name</li>
                <li>ABN</li>
                <li>Business address</li>
                <li>Phone number</li>
                <li>Type of business</li>
                <li>Number of employees</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">3. What Information Do We Collect?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <p>
                We collect personal and business information depending on your interactions with us or what you choose to share.
              </p>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Personal Information:</h3>
                <ul className="list-disc pl-6">
                  <li>Name</li>
                  <li>Date of birth</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Mailing or street address</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Business Information:</h3>
                <ul className="list-disc pl-6">
                  <li>Business name</li>
                  <li>ABN</li>
                  <li>Business address</li>
                  <li>Business phone number</li>
                  <li>Type of business</li>
                  <li>Number of employees</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold">4. How We Collect Information</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <p>We collect information directly from you when you:</p>
              <ul className="list-disc pl-6">
                <li>Interact with us online or in person</li>
                <li>Call or email us</li>
                <li>Use our platform</li>
                <li>Subscribe to our mailing list</li>
                <li>Participate in surveys</li>
                <li>Attend a STOREA event</li>
                <li>Apply for a position with us</li>
              </ul>
              <p>
                We may also collect information from third parties or public sources to improve our services.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold">5. How We Use Your Information</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc pl-6">
                <li>Provide requested services or information</li>
                <li>Deliver a personalized experience</li>
                <li>Improve the quality of our services</li>
                <li>Conduct internal administration</li>
                <li>Conduct marketing and research</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg font-semibold">6. Sharing Information</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6">
                <li>Third-party service providers (e.g., IT providers)</li>
                <li>Marketing providers</li>
                <li>Professional advisors</li>
              </ul>
              <p>We may also transfer information overseas but only if:</p>
              <ul className="list-disc pl-6">
                <li>You consent, or</li>
                <li>The recipient is subject to similar privacy laws, or</li>
                <li>Required or authorised by Australian law</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-lg font-semibold">7. How We Protect Your Information</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p className="mb-4">We take reasonable steps to keep your information safe, including:</p>
              <ul className="list-disc pl-6">
                <li>Securing our premises and records</li>
                <li>Restricting access to personnel who need it</li>
                <li>Using technology like firewalls and antivirus software</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg font-semibold">8. Online Activity</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Cookies</h3>
                <p>
                  Our website uses cookies to improve your browsing experience. Cookies do not personally identify you. You can block or delete cookies in your browser, but some features may not work properly.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Google Analytics</h3>
                <p>
                  We use Google Analytics to understand website traffic. Most data is anonymous, but it may sometimes be connected to you.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Direct Marketing</h3>
                <p>
                  With your consent, we may send you marketing communications. You can opt-out at any time via the "unsubscribe" link.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9">
            <AccordionTrigger className="text-lg font-semibold">9. Retention of Information</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>
                We only retain information as long as necessary for our relationship with you, unless retention is required by law.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10">
            <AccordionTrigger className="text-lg font-semibold">10. Accessing and Correcting Your Information</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <p>
                You can request access to or correction of your personal or business information by contacting us at:
              </p>
              <p>
                Email: <a href="mailto:richard@storea.com.au" className="text-primary hover:underline">richard@storea.com.au</a>
              </p>
              <p>
                We will usually respond within 14 days.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-11">
            <AccordionTrigger className="text-lg font-semibold">11. Links to Third-Party Sites</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>
                Our website may link to third-party websites. STOREA is not responsible for their privacy practices. Please read their privacy policies before sharing information.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-12">
            <AccordionTrigger className="text-lg font-semibold">12. Complaints</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <p>
                If you have a complaint about how we handle your information, contact us at:
              </p>
              <p>
                Email: <a href="mailto:richard@storea.com.au" className="text-primary hover:underline">richard@storea.com.au</a>
              </p>
              <p>
                If unsatisfied with our response, you may contact the Office of Australian Information Commissioner: <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.oaic.gov.au</a>
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-13">
            <AccordionTrigger className="text-lg font-semibold">13. Contact Us</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-2">
              <p>
                For any questions or concerns about this Privacy Policy:
              </p>
              <p>
                Email: <a href="mailto:richard@storea.com.au" className="text-primary hover:underline">richard@storea.com.au</a>
              </p>
              <p>
                Phone: 1800-STOREA
              </p>
              <p className="text-sm italic pt-2">
                Last Modified: 10th November 2025
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </PublicLayout>
  );
}
