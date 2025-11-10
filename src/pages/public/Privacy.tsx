import { PublicLayout } from '@/components/marketing/PublicLayout';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Privacy() {
  usePageMeta({
    title: 'Privacy Policy - STOREA',
    description: 'STOREA Privacy Policy - Learn how we collect, use, and protect your personal and business information in accordance with Australian privacy laws.'
  });

  return (
    <PublicLayout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">STOREA Privacy Policy</h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            STOREA values and respects your privacy. We are committed to protecting your personal and business information in accordance with the Privacy Act 1988 (Cth) and other applicable privacy laws.
          </p>

          <p className="text-muted-foreground mb-8">This policy explains:</p>
          <ul className="list-disc pl-6 mb-8 text-muted-foreground">
            <li>What information we collect</li>
            <li>How we use and protect it</li>
            <li>How you can access or correct it</li>
            <li>How to contact us</li>
          </ul>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. What is Personal Information?</h2>
            <p className="text-muted-foreground mb-4">
              Personal information is any information or opinion about an individual that identifies you directly or indirectly. Examples include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Your name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Mailing or street address</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. What is Business Information?</h2>
            <p className="text-muted-foreground mb-4">
              Business information is any information or opinion about a business that identifies it directly or indirectly. Examples include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Business name</li>
              <li>ABN</li>
              <li>Business address</li>
              <li>Phone number</li>
              <li>Type of business</li>
              <li>Number of employees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. What Information Do We Collect?</h2>
            <p className="text-muted-foreground mb-4">
              We collect personal and business information depending on your interactions with us or what you choose to share.
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">Personal Information:</h3>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Name</li>
              <li>Date of birth</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Mailing or street address</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3">Business Information:</h3>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Business name</li>
              <li>ABN</li>
              <li>Business address</li>
              <li>Business phone number</li>
              <li>Type of business</li>
              <li>Number of employees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. How We Collect Information</h2>
            <p className="text-muted-foreground mb-4">We collect information directly from you when you:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Interact with us online or in person</li>
              <li>Call or email us</li>
              <li>Use our platform</li>
              <li>Subscribe to our mailing list</li>
              <li>Participate in surveys</li>
              <li>Attend a STOREA event</li>
              <li>Apply for a position with us</li>
            </ul>
            <p className="text-muted-foreground">
              We may also collect information from third parties or public sources to improve our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Provide requested services or information</li>
              <li>Deliver a personalized experience</li>
              <li>Improve the quality of our services</li>
              <li>Conduct internal administration</li>
              <li>Conduct marketing and research</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Sharing Information</h2>
            <p className="text-muted-foreground mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li>Third-party service providers (e.g., IT providers)</li>
              <li>Marketing providers</li>
              <li>Professional advisors</li>
            </ul>
            <p className="text-muted-foreground mb-2">We may also transfer information overseas but only if:</p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>You consent, or</li>
              <li>The recipient is subject to similar privacy laws, or</li>
              <li>Required or authorised by Australian law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. How We Protect Your Information</h2>
            <p className="text-muted-foreground mb-4">We take reasonable steps to keep your information safe, including:</p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Securing our premises and records</li>
              <li>Restricting access to personnel who need it</li>
              <li>Using technology like firewalls and antivirus software</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Online Activity</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">Cookies</h3>
            <p className="text-muted-foreground mb-4">
              Our website uses cookies to improve your browsing experience. Cookies do not personally identify you. You can block or delete cookies in your browser, but some features may not work properly.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">Google Analytics</h3>
            <p className="text-muted-foreground mb-4">
              We use Google Analytics to understand website traffic. Most data is anonymous, but it may sometimes be connected to you.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3">Direct Marketing</h3>
            <p className="text-muted-foreground">
              With your consent, we may send you marketing communications. You can opt-out at any time via the "unsubscribe" link.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Retention of Information</h2>
            <p className="text-muted-foreground">
              We only retain information as long as necessary for our relationship with you, unless retention is required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Accessing and Correcting Your Information</h2>
            <p className="text-muted-foreground mb-4">
              You can request access to or correction of your personal or business information by contacting us at:
            </p>
            <p className="text-muted-foreground mb-4">
              Email: <a href="mailto:richard@storea.com.au" className="text-primary hover:underline">richard@storea.com.au</a>
            </p>
            <p className="text-muted-foreground">
              We will usually respond within 14 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Links to Third-Party Sites</h2>
            <p className="text-muted-foreground">
              Our website may link to third-party websites. STOREA is not responsible for their privacy practices. Please read their privacy policies before sharing information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Complaints</h2>
            <p className="text-muted-foreground mb-4">
              If you have a complaint about how we handle your information, contact us at:
            </p>
            <p className="text-muted-foreground mb-4">
              Email: <a href="mailto:richard@storea.com.au" className="text-primary hover:underline">richard@storea.com.au</a>
            </p>
            <p className="text-muted-foreground">
              If unsatisfied with our response, you may contact the Office of Australian Information Commissioner: <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.oaic.gov.au</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground mb-2">
              For any questions or concerns about this Privacy Policy:
            </p>
            <p className="text-muted-foreground mb-1">
              Email: <a href="mailto:richard@storea.com.au" className="text-primary hover:underline">richard@storea.com.au</a>
            </p>
            <p className="text-muted-foreground mb-4">
              Phone: 1800-STOREA
            </p>
            <p className="text-sm text-muted-foreground italic">
              Last Modified: 10th November 2025
            </p>
          </section>
        </article>
      </div>
    </PublicLayout>
  );
}
