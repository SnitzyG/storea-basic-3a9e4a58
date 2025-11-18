import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';

export const ContactForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const { trackContactForm } = useAnalytics();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track the contact form submission
    trackContactForm();
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true);
      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    }, 500);
  };

  return (
    <Card className="max-w-2xl w-full">
      {submitted ? (
        <CardContent className="pt-6 pb-6 text-center">
          <h3 className="text-lg font-semibold mb-2 text-primary">
            Thank you for reaching out!
          </h3>
          <p className="text-sm text-muted-foreground">
            We've received your message and will get back to you soon.
          </p>
        </CardContent>
      ) : (
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Your name"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="your.email@example.com"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="message" className="text-sm">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                placeholder="Tell us what you're thinking..."
                rows={3}
                className="resize-none"
              />
            </div>

            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
};
