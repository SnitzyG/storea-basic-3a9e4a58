import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Building2, Users, FileText, Calendar, CheckSquare, MessageSquare, DollarSign, ClipboardList, Download } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { jsPDF } from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function StyleGuide() {
  const { theme, toggleTheme } = useTheme();

  const downloadStyleGuide = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      // Helper to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STOREA Brand Style Guide', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Comprehensive design system for STOREA construction management platform', margin, yPosition);
      yPosition += 15;

      // Brand Identity
      checkPageBreak(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Brand Identity', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const brandText = [
        'Primary Theme: Professional Navy & Gold',
        'Typography: Outfit (sans-serif), Montserrat (display)',
        'Approach: Clean, Modern, Construction-focused'
      ];
      brandText.forEach(text => {
        pdf.text(text, margin, yPosition);
        yPosition += 7;
      });
      yPosition += 10;

      // Color Palette
      colorCategories.forEach(category => {
        checkPageBreak(40);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(category.name, margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        category.colors.forEach(color => {
          checkPageBreak(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(color.name, margin + 5, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${color.var}`, margin + 60, yPosition);
          pdf.text(`Light: ${color.light}`, margin + 5, yPosition + 5);
          pdf.text(`Dark: ${color.dark}`, margin + 5, yPosition + 10);
          yPosition += 15;
        });
        yPosition += 5;
      });

      // Typography
      checkPageBreak(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Typography', margin, yPosition);
      yPosition += 10;

      const typographyInfo = [
        { name: 'Heading 1', desc: 'Montserrat Bold, 48px - Hero sections' },
        { name: 'Heading 2', desc: 'Montserrat Bold, 36px - Section headings' },
        { name: 'Heading 3', desc: 'Montserrat SemiBold, 30px - Subsections' },
        { name: 'Heading 4', desc: 'Outfit SemiBold, 24px - Card titles' },
        { name: 'Body Text', desc: 'Outfit Regular, 16px - Main content' },
        { name: 'Caption', desc: 'Outfit Regular, 14px/12px - Secondary info' }
      ];

      pdf.setFontSize(10);
      typographyInfo.forEach(item => {
        checkPageBreak(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.name, margin + 5, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.desc, margin + 40, yPosition);
        yPosition += 8;
      });
      yPosition += 10;

      // Usage Guidelines
      checkPageBreak(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Usage Guidelines', margin, yPosition);
      yPosition += 10;

      const guidelines = [
        { title: 'Primary (Navy/Gold)', text: 'Use for main actions, CTAs, and brand elements' },
        { title: 'Secondary', text: 'For alternative actions and less prominent UI elements' },
        { title: 'Accent (Gold)', text: 'Highlight important information and premium features' },
        { title: 'Destructive (Red)', text: 'Only for delete, remove, or error actions' }
      ];

      pdf.setFontSize(10);
      guidelines.forEach(guideline => {
        checkPageBreak(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(guideline.title, margin + 5, yPosition);
        yPosition += 5;
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(guideline.text, maxWidth - 10);
        pdf.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 5 + 5;
      });

      // Accessibility
      checkPageBreak(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Accessibility Standards', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const a11yText = [
        'All text meets WCAG AA standards (4.5:1 for normal, 3:1 for large)',
        'All interactive elements have visible focus rings',
        'Never rely on color alone to convey information'
      ];
      a11yText.forEach(text => {
        checkPageBreak(10);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 5 + 3;
      });

      // Save the PDF
      pdf.save('STOREA-Style-Guide.pdf');
      toast({
        title: "Style Guide Downloaded",
        description: "The PDF has been saved to your downloads folder.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const colorCategories = [
    {
      name: 'Base Colors',
      colors: [
        { name: 'Background', var: '--background', light: 'HSL(0 0% 100%)', dark: 'HSL(215 30% 12%)', desc: 'Main background' },
        { name: 'Foreground', var: '--foreground', light: 'HSL(215 25% 15%)', dark: 'HSL(0 0% 98%)', desc: 'Main text color' },
      ]
    },
    {
      name: 'Primary Colors',
      colors: [
        { name: 'Primary', var: '--primary', light: 'HSL(215 45% 25%)', dark: 'HSL(40 85% 60%)', desc: 'Deep navy blue / Vibrant gold' },
        { name: 'Primary Foreground', var: '--primary-foreground', light: 'HSL(0 0% 100%)', dark: 'HSL(215 30% 12%)', desc: 'Text on primary' },
        { name: 'Primary Glow', var: '--primary-glow', light: 'HSL(40 85% 60%)', dark: 'HSL(40 90% 70%)', desc: 'Gold accent / Lighter gold' },
      ]
    },
    {
      name: 'Secondary Colors',
      colors: [
        { name: 'Secondary', var: '--secondary', light: 'HSL(215 15% 95%)', dark: 'HSL(215 25% 20%)', desc: 'Light gray-blue / Dark navy' },
        { name: 'Secondary Foreground', var: '--secondary-foreground', light: 'HSL(215 25% 25%)', dark: 'HSL(0 0% 98%)', desc: 'Text on secondary' },
      ]
    },
    {
      name: 'Accent Colors',
      colors: [
        { name: 'Accent', var: '--accent', light: 'HSL(40 85% 95%)', dark: 'HSL(40 60% 25%)', desc: 'Light gold tint / Deep gold' },
        { name: 'Accent Foreground', var: '--accent-foreground', light: 'HSL(215 45% 25%)', dark: 'HSL(40 85% 95%)', desc: 'Text on accent' },
        { name: 'Accent Subtle', var: '--accent-subtle', light: 'HSL(40 70% 98%)', dark: 'HSL(40 50% 15%)', desc: 'Very subtle gold' },
      ]
    },
    {
      name: 'Muted Colors',
      colors: [
        { name: 'Muted', var: '--muted', light: 'HSL(215 15% 96%)', dark: 'HSL(215 25% 16%)', desc: 'Muted background' },
        { name: 'Muted Foreground', var: '--muted-foreground', light: 'HSL(215 15% 45%)', dark: 'HSL(215 15% 65%)', desc: 'Muted text' },
      ]
    },
    {
      name: 'UI Elements',
      colors: [
        { name: 'Border', var: '--border', light: 'HSL(215 15% 88%)', dark: 'HSL(215 25% 22%)', desc: 'Border color' },
        { name: 'Input', var: '--input', light: 'HSL(215 15% 88%)', dark: 'HSL(215 25% 22%)', desc: 'Input border' },
        { name: 'Ring', var: '--ring', light: 'HSL(215 45% 25%)', dark: 'HSL(40 85% 60%)', desc: 'Focus ring' },
      ]
    },
    {
      name: 'Card & Popover',
      colors: [
        { name: 'Card', var: '--card', light: 'HSL(0 0% 100%)', dark: 'HSL(215 28% 15%)', desc: 'Card background' },
        { name: 'Card Foreground', var: '--card-foreground', light: 'HSL(215 25% 15%)', dark: 'HSL(0 0% 98%)', desc: 'Card text' },
        { name: 'Popover', var: '--popover', light: 'HSL(0 0% 100%)', dark: 'HSL(215 28% 15%)', desc: 'Popover background' },
        { name: 'Popover Foreground', var: '--popover-foreground', light: 'HSL(215 25% 15%)', dark: 'HSL(0 0% 98%)', desc: 'Popover text' },
      ]
    },
    {
      name: 'Destructive',
      colors: [
        { name: 'Destructive', var: '--destructive', light: 'HSL(0 84% 60%)', dark: 'HSL(0 63% 31%)', desc: 'Error/delete actions' },
        { name: 'Destructive Foreground', var: '--destructive-foreground', light: 'HSL(0 0% 100%)', dark: 'HSL(0 0% 98%)', desc: 'Text on destructive' },
      ]
    },
    {
      name: 'Construction Specific',
      colors: [
        { name: 'Warning', var: '--construction-warning', light: 'HSL(38 92% 50%)', dark: 'HSL(38 92% 50%)', desc: 'Warning states' },
        { name: 'Success', var: '--construction-success', light: 'HSL(142 71% 45%)', dark: 'HSL(142 71% 45%)', desc: 'Success states' },
        { name: 'Info', var: '--construction-info', light: 'HSL(199 89% 48%)', dark: 'HSL(199 89% 48%)', desc: 'Info states' },
      ]
    }
  ];

  const gradients = [
    { name: 'Primary Gradient', class: 'bg-gradient-primary', desc: 'Navy to gold gradient for hero sections' },
    { name: 'Gold Gradient', class: 'bg-gradient-gold', desc: 'Rich gold gradient for premium features' },
    { name: 'Subtle Gradient', class: 'bg-gradient-subtle', desc: 'Subtle background gradient' },
  ];

  const shadows = [
    { name: 'Elegant Shadow', class: 'shadow-elegant', desc: 'Primary-colored elegant shadow' },
    { name: 'Glow Effect', class: 'shadow-glow', desc: 'Glowing effect for highlights' },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <StorealiteLogo className="text-4xl mb-4" />
              <h1 className="text-4xl font-bold mb-2">Brand Style Guide</h1>
              <p className="text-muted-foreground text-lg">
                Comprehensive design system for STOREA construction management platform
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadStyleGuide} variant="default">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={toggleTheme} variant="outline">
                Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 space-y-16">
        {/* Brand Overview */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Brand Identity</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Design Philosophy</h3>
                  <p className="text-muted-foreground mb-4">
                    STOREA's design system combines professional construction industry aesthetics with modern,
                    intuitive interface patterns. The navy and gold color scheme conveys trust, professionalism,
                    and premium quality.
                  </p>
                  <div className="space-y-2">
                    <p><strong>Primary Theme:</strong> Professional Navy & Gold</p>
                    <p><strong>Typography:</strong> Outfit (sans-serif), Montserrat (display)</p>
                    <p><strong>Approach:</strong> Clean, Modern, Construction-focused</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Logo Usage</h3>
                  <div className="flex items-center gap-6 p-6 bg-muted rounded-lg">
                    <StorealiteLogo variant="text-only" className="text-5xl" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The STOREA wordmark uses a bold, uppercase treatment with a navy-to-gold gradient.
                    Always maintain adequate clearspace and never distort the logo proportions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Color Palette */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Color Palette</h2>
          <p className="text-muted-foreground mb-8">
            Current mode: <Badge variant="outline">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</Badge>
          </p>
          
          <div className="space-y-8">
            {colorCategories.map((category) => (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {category.colors.map((color) => (
                      <div key={color.name} className="grid md:grid-cols-4 gap-4 items-center p-4 border rounded-lg">
                        <div>
                          <div 
                            className="w-full h-16 rounded-lg border mb-2"
                            style={{ background: `hsl(var(${color.var}))` }}
                          />
                          <p className="font-semibold text-sm">{color.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">CSS Variable</p>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{color.var}</code>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{theme === 'light' ? 'Light' : 'Dark'} Value</p>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {theme === 'light' ? color.light : color.dark}
                          </code>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{color.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Gradients */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Gradients</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                {gradients.map((gradient) => (
                  <div key={gradient.name} className="space-y-3">
                    <div className={`w-full h-32 rounded-lg ${gradient.class}`} />
                    <div>
                      <p className="font-semibold">{gradient.name}</p>
                      <p className="text-sm text-muted-foreground mb-2">{gradient.desc}</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{gradient.class}</code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Shadows & Effects */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Shadows & Effects</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                {shadows.map((shadow) => (
                  <div key={shadow.name} className="space-y-4">
                    <div className={`w-full h-32 bg-card rounded-lg ${shadow.class} flex items-center justify-center border`}>
                      <p className="font-semibold">Example</p>
                    </div>
                    <div>
                      <p className="font-semibold">{shadow.name}</p>
                      <p className="text-sm text-muted-foreground mb-2">{shadow.desc}</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{shadow.class}</code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Typography</h2>
          <Card>
            <CardContent className="pt-6 space-y-8">
              <div>
                <h1 className="text-5xl font-display font-bold mb-2">Heading 1</h1>
                <p className="text-sm text-muted-foreground">
                  Montserrat Bold, 48px - Used for hero sections and primary headings
                </p>
              </div>
              <div>
                <h2 className="text-4xl font-display font-bold mb-2">Heading 2</h2>
                <p className="text-sm text-muted-foreground">
                  Montserrat Bold, 36px - Section headings
                </p>
              </div>
              <div>
                <h3 className="text-3xl font-display font-semibold mb-2">Heading 3</h3>
                <p className="text-sm text-muted-foreground">
                  Montserrat SemiBold, 30px - Subsection headings
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-semibold mb-2">Heading 4</h4>
                <p className="text-sm text-muted-foreground">
                  Outfit SemiBold, 24px - Card titles
                </p>
              </div>
              <div>
                <p className="text-base mb-2">Body Text (Regular)</p>
                <p className="text-sm text-muted-foreground">
                  Outfit Regular, 16px - Main content and descriptions
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Caption Text</p>
                <p className="text-xs text-muted-foreground">
                  Outfit Regular, 14px / 12px - Secondary information and labels
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Buttons</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Button className="w-full">Primary Button</Button>
                  <p className="text-sm text-muted-foreground">
                    Default variant - Primary actions
                  </p>
                </div>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full">Secondary Button</Button>
                  <p className="text-sm text-muted-foreground">
                    Secondary actions
                  </p>
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">Outline Button</Button>
                  <p className="text-sm text-muted-foreground">
                    Tertiary actions
                  </p>
                </div>
                <div className="space-y-3">
                  <Button variant="destructive" className="w-full">Destructive Button</Button>
                  <p className="text-sm text-muted-foreground">
                    Delete/remove actions
                  </p>
                </div>
                <div className="space-y-3">
                  <Button variant="accent" className="w-full">Accent Button</Button>
                  <p className="text-sm text-muted-foreground">
                    Highlighted actions
                  </p>
                </div>
                <div className="space-y-3">
                  <Button disabled className="w-full">Disabled Button</Button>
                  <p className="text-sm text-muted-foreground">
                    Inactive state
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Badges</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Badge>Default</Badge>
                  <p className="text-xs text-muted-foreground">Primary status</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary">Secondary</Badge>
                  <p className="text-xs text-muted-foreground">Info status</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="outline">Outline</Badge>
                  <p className="text-xs text-muted-foreground">Neutral status</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="destructive">Destructive</Badge>
                  <p className="text-xs text-muted-foreground">Error status</p>
                </div>
                <div className="space-y-2">
                  <Badge variant="accent">Accent</Badge>
                  <p className="text-xs text-muted-foreground">Highlight status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Icons */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Icon System</h2>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                Using Lucide React icons. Standard sizes: 16px (small), 20px (default), 24px (large)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
                {[
                  { icon: Building2, name: 'Projects' },
                  { icon: Users, name: 'Team' },
                  { icon: FileText, name: 'Documents' },
                  { icon: Calendar, name: 'Calendar' },
                  { icon: CheckSquare, name: 'Tasks' },
                  { icon: MessageSquare, name: 'Messages' },
                  { icon: DollarSign, name: 'Financials' },
                  { icon: ClipboardList, name: 'RFIs' },
                ].map(({ icon: Icon, name }) => (
                  <div key={name} className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                    <p className="text-xs text-center">{name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card with Header</CardTitle>
                <CardDescription>This is a description of the card content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Standard card component with header, description, and content area.
                  Used throughout the application for containing related information.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-glow border-primary">
              <CardHeader>
                <CardTitle>Highlighted Card</CardTitle>
                <CardDescription>With glow effect and primary border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enhanced card with glow shadow and primary border for emphasized content
                  or premium features.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Usage Guidelines */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Usage Guidelines</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Primary (Navy/Gold)</h4>
                  <p className="text-sm text-muted-foreground">
                    Use for main actions, CTAs, and brand elements. The navy-to-gold transition
                    represents the journey from planning to completion.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Secondary</h4>
                  <p className="text-sm text-muted-foreground">
                    For alternative actions, backgrounds, and less prominent UI elements.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Accent (Gold)</h4>
                  <p className="text-sm text-muted-foreground">
                    Highlight important information, premium features, and success states.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Destructive (Red)</h4>
                  <p className="text-sm text-muted-foreground">
                    Only for delete, remove, or error actions. Use sparingly.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spacing & Layout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Container Widths</h4>
                  <p className="text-sm text-muted-foreground">
                    Max width: 1400px (2xl), Standard padding: 2rem (8), Mobile padding: 1rem (4)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Spacing Scale</h4>
                  <p className="text-sm text-muted-foreground">
                    Use Tailwind's spacing scale: 4px increments (1 = 4px, 2 = 8px, 4 = 16px, 6 = 24px, 8 = 32px)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contrast Ratios</h4>
                  <p className="text-sm text-muted-foreground">
                    All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Focus States</h4>
                  <p className="text-sm text-muted-foreground">
                    All interactive elements have visible focus rings using the ring color
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Color Independence</h4>
                  <p className="text-sm text-muted-foreground">
                    Never rely on color alone to convey information. Use icons, labels, or patterns
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Implementation */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Implementation</h2>
          <Card>
            <CardHeader>
              <CardTitle>Using the Design System</CardTitle>
              <CardDescription>How to apply colors and styles in your code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Tailwind Classes</h4>
                <code className="block bg-muted p-4 rounded-lg text-sm">
                  {`<div className="bg-primary text-primary-foreground">\n  Primary colored element\n</div>`}
                </code>
              </div>
              <div>
                <h4 className="font-semibold mb-2">CSS Variables</h4>
                <code className="block bg-muted p-4 rounded-lg text-sm">
                  {`.custom-element {\n  background: hsl(var(--primary));\n  color: hsl(var(--primary-foreground));\n}`}
                </code>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Gradients</h4>
                <code className="block bg-muted p-4 rounded-lg text-sm">
                  {`<div className="bg-gradient-primary">\n  Gradient background\n</div>`}
                </code>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
    </AdminLayout>
  );
}
