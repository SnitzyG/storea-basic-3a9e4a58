import { PublicLayout } from '@/components/marketing/PublicLayout';
import { useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms and Conditions - STOREA';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'STOREA Terms and Conditions of Use - Learn about the terms governing your access and use of the STOREA platform and services.');
    }
  }, []);

  return (
    <PublicLayout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">STOREA Terms and Conditions of Use</h1>
          <p className="text-sm text-muted-foreground mb-4">Last Modified: 10th November 2025</p>
          <p className="text-muted-foreground">
            These Terms govern your access and use of the STOREA platform and services ("Services"). By using the Services, you agree to these Terms.
          </p>
        </div>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">1. Eligibility</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>You confirm that your access and use of the Services is primarily for business purposes and that you have the authority to bind your organisation to these Terms.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">2. Accessing the Services</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Right to Use</h3>
                <p>You are granted a limited, non-exclusive, revocable right to access and use the Services and Documentation solely to enjoy the benefits of the Services.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">System Requirements</h3>
                <p>You must meet the minimum system requirements as notified. We are not responsible for issues arising from failure to meet these requirements.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Third Party Programs and Components</h3>
                <p>You are responsible for any third-party software or components integrated with the Services. Providers of these components may access your data as necessary for their operation.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Documentation</h3>
                <p>Documentation may be provided electronically or in print. Copies may only be used for the purpose of using the Services.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">3. Support, Maintenance, and Enhancements</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>We are not obligated to provide support, maintenance, or updates unless explicitly agreed. We may provide technical support upon request and prioritise defect rectification at our discretion. The Services may be modified or suspended as needed.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold">4. Using the Services</AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Subscription Plans</h3>
                <p>Different Subscription Plans are available. Plan changes may incur fees. Details are provided on the platform.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Registration</h3>
                <p>Registration may be required. You are responsible for maintaining accurate information and protecting account credentials.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">User Access</h3>
                <p>Only authorised personnel may access the Services. You are responsible for all activity under your account.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Restrictions</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>No reverse engineering, copying, or decompiling the Services.</li>
                  <li>No unlawful or inappropriate use.</li>
                  <li>No interfering with the Services or circumventing fees.</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold">5. Your Warranties and Responsibilities</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>You are responsible for cooperating with Us, managing your systems and networks, and backing up your data.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg font-semibold">6. Security and Integrity</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>You must not violate security. We may suspend access if security violations are suspected.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-lg font-semibold">7. Payment</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>Access to some Services may require fees ("Fees"), which must be paid in advance. Free Trials or Educational Trials may apply. Fees include applicable taxes.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg font-semibold">8. Refunds</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>We are generally not obligated to provide refunds unless legally required or at our discretion.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9">
            <AccordionTrigger className="text-lg font-semibold">9. Confidential Information</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>You must protect Our confidential information and use it only as necessary to access the Services.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10">
            <AccordionTrigger className="text-lg font-semibold">10. Privacy</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>We handle personal information in accordance with privacy laws and our privacy policy. Information will not be shared without consent unless required by law.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-11">
            <AccordionTrigger className="text-lg font-semibold">11. Your Data</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>You retain ownership of uploaded data. You grant Us a licence to process and use your data as necessary to provide the Services. Aggregated data may be used for commercial purposes.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-12">
            <AccordionTrigger className="text-lg font-semibold">12. No Liability</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>You use the Services at your own risk. We are not responsible for your data or claims arising from its use.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-13">
            <AccordionTrigger className="text-lg font-semibold">13. Intellectual Property Rights</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>The Services and Documentation remain Our property. You retain ownership of your data but grant Us a licence to use it for service delivery and marketing.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-14">
            <AccordionTrigger className="text-lg font-semibold">14. Reliance on Services</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>Generated information is for informational purposes only and not professional advice. Verification is your responsibility.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-15">
            <AccordionTrigger className="text-lg font-semibold">15. Force Majeure</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>Neither party is liable for events outside reasonable control. Reasonable efforts must be used to mitigate effects.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-16">
            <AccordionTrigger className="text-lg font-semibold">16. Termination and Suspension</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>We may suspend or terminate access for breaches or business changes. Fees are generally non-refundable unless stated. Certain clauses survive termination.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-17">
            <AccordionTrigger className="text-lg font-semibold">17. General</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              <p>These Terms constitute the entire agreement, governed by the laws of South Australia. We may amend the Terms. Headings do not affect interpretation, and singular includes plural.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </PublicLayout>
  );
}
