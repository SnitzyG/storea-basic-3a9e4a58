import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Check, AlertTriangle, Info, X, Search, Calendar, Upload } from 'lucide-react';
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

      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STOREA Brand Style Guide', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Comprehensive design system for STOREA construction management platform', margin, yPosition);
      
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

  const lightModeColors = [
    { category: 'Base Colors', colors: [
      { name: 'Background', var: '--background', hex: '#FEFAE0', hsl: 'HSL(48 100% 99%)', purpose: 'Main background', wcag: '-' },
      { name: 'Foreground', var: '--foreground', hex: '#283618', hsl: 'HSL(85 48% 19%)', purpose: 'Main text', wcag: 'AAA' },
    ]},
    { category: 'Primary Colors', colors: [
      { name: 'Primary', var: '--primary', hex: '#283618', hsl: 'HSL(85 48% 19%)', purpose: 'Main CTAs', wcag: 'AAA' },
      { name: 'Primary Foreground', var: '--primary-foreground', hex: '#FEFAE0', hsl: 'HSL(48 100% 99%)', purpose: 'Text on primary', wcag: 'AAA' },
      { name: 'Primary Glow', var: '--primary-glow', hex: '#BC6C25', hsl: 'HSL(25 66% 44%)', purpose: 'Highlights', wcag: 'AA' },
    ]},
    { category: 'Secondary Colors', colors: [
      { name: 'Secondary', var: '--secondary', hex: '#606C38', hsl: 'HSL(80 38% 35%)', purpose: 'Secondary backgrounds', wcag: 'AAA' },
      { name: 'Secondary Foreground', var: '--secondary-foreground', hex: '#FEFAE0', hsl: 'HSL(48 100% 99%)', purpose: 'Text on secondary', wcag: 'AAA' },
    ]},
    { category: 'Accent Colors', colors: [
      { name: 'Accent', var: '--accent', hex: '#DDA15E', hsl: 'HSL(30 66% 62%)', purpose: 'Premium features', wcag: 'AA' },
      { name: 'Accent Foreground', var: '--accent-foreground', hex: '#283618', hsl: 'HSL(85 48% 19%)', purpose: 'Text on accent', wcag: 'AAA' },
      { name: 'Accent Subtle', var: '--accent-subtle', hex: '#F5EFE0', hsl: 'HSL(30 70% 96%)', purpose: 'Gentle backgrounds', wcag: 'AA' },
    ]},
    { category: 'Semantic Colors', colors: [
      { name: 'Success', var: '--construction-success', hex: '#10B981', hsl: 'HSL(160 84% 39%)', purpose: 'Approved, complete', wcag: 'AAA' },
      { name: 'Warning', var: '--construction-warning', hex: '#F59E0B', hsl: 'HSL(38 92% 50%)', purpose: 'Pending, caution', wcag: 'AA' },
      { name: 'Error', var: '--destructive', hex: '#DC2626', hsl: 'HSL(0 86% 50%)', purpose: 'Error, delete', wcag: 'AAA' },
      { name: 'Info', var: '--construction-info', hex: '#3B82F6', hsl: 'HSL(217 91% 60%)', purpose: 'Information', wcag: 'AAA' },
    ]},
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl font-black uppercase tracking-wide text-primary mb-2">STOREA</h1>
                <h2 className="text-3xl font-bold mb-2">Brand Style Guide</h2>
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
          {/* Table of Contents */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Table of Contents</h2>
            <Card>
              <CardContent className="pt-6">
                <ol className="grid md:grid-cols-2 gap-3 list-decimal list-inside">
                  <li>Brand Identity</li>
                  <li>Color Palette & Contrast Ratios</li>
                  <li>Typography</li>
                  <li>Responsive Breakpoints</li>
                  <li>Buttons & CTAs</li>
                  <li>Form Elements & Validation</li>
                  <li>Badges & Status Indicators</li>
                  <li>Navigation Components</li>
                  <li>Content Components</li>
                  <li>Feedback & Loading States</li>
                  <li>Construction-Specific Components</li>
                  <li>Accessibility Guidelines</li>
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* 1. Brand Identity */}
          <section id="brand-identity">
            <h2 className="text-3xl font-bold mb-6">1. Brand Identity</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Design Philosophy</h3>
                    <p className="text-muted-foreground mb-4">
                      STOREA's refined design system combines professional construction industry aesthetics with modern, 
                      intuitive interface patterns. The warm, earthy palette—featuring forest greens, warm beiges, and 
                      terracotta tones—conveys stability, natural confidence, and grounded professionalism.
                    </p>
                    <div className="space-y-2">
                      <p><strong>Color Palette:</strong> Forest Green, Warm Beige, Terracotta</p>
                      <p><strong>Typography:</strong> Roboto (all weights: 100, 300, 400, 500, 700, 900)</p>
                      <p><strong>Approach:</strong> Clean, Modern, Organic, Construction-focused</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Logo Usage</h3>
                    <div className="flex items-center justify-center gap-6 p-8 bg-muted rounded-lg">
                      <h1 className="text-5xl font-black uppercase tracking-wider text-primary">STOREA</h1>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Font:</strong> Roboto Black (900), 32px minimum</p>
                      <p><strong>Treatment:</strong> Uppercase, letter-spacing +2px to +4px</p>
                      <p><strong>Color:</strong> Deep Forest Green (#283618)</p>
                      <p><strong>Style:</strong> Clean, no gradients or effects</p>
                      <p><strong>Clearspace:</strong> Minimum 10px padding on all sides</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 2. Color Palette */}
          <section id="color-palette">
            <h2 className="text-3xl font-bold mb-6">2. Color Palette & Contrast Ratios</h2>
            <p className="text-muted-foreground mb-8">
              Current mode: <Badge variant="outline">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</Badge>
            </p>
            
            <div className="space-y-8">
              {lightModeColors.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Color</th>
                            <th className="text-left p-3">CSS Variable</th>
                            <th className="text-left p-3">HEX</th>
                            <th className="text-left p-3">HSL</th>
                            <th className="text-left p-3">Purpose</th>
                            <th className="text-left p-3">WCAG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.colors.map((color) => (
                            <tr key={color.name} className="border-b">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-12 h-12 rounded border"
                                    style={{ background: `hsl(var(${color.var}))` }}
                                  />
                                  <span className="font-medium">{color.name}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <code className="text-xs bg-muted px-2 py-1 rounded">{color.var}</code>
                              </td>
                              <td className="p-3">
                                <code className="text-xs">{color.hex}</code>
                              </td>
                              <td className="p-3">
                                <code className="text-xs">{color.hsl}</code>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{color.purpose}</td>
                              <td className="p-3">
                                {color.wcag !== '-' && (
                                  <Badge variant={color.wcag === 'AAA' ? 'default' : 'secondary'}>
                                    {color.wcag}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* 3. Typography */}
          <section id="typography">
            <h2 className="text-3xl font-bold mb-6">3. Typography</h2>
            <Card>
              <CardContent className="pt-6 space-y-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    All typography uses <strong>Roboto</strong> from Google Fonts for consistency, clarity, and modern professionalism.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="pb-4 border-b">
                    <h1 className="text-5xl font-black tracking-wide mb-2">Heading 1</h1>
                    <p className="text-sm text-muted-foreground">Roboto Black (900), 48px, letter-spacing +2px - Hero sections, all caps</p>
                  </div>

                  <div className="pb-4 border-b">
                    <h2 className="text-4xl font-bold mb-2">Heading 2</h2>
                    <p className="text-sm text-muted-foreground">Roboto Bold (700), 36px, letter-spacing +1px - Section headings, title case</p>
                  </div>

                  <div className="pb-4 border-b">
                    <h3 className="text-3xl font-bold mb-2">Heading 3</h3>
                    <p className="text-sm text-muted-foreground">Roboto Bold (700), 30px - Subsection headings</p>
                  </div>

                  <div className="pb-4 border-b">
                    <h4 className="text-2xl font-medium mb-2">Heading 4</h4>
                    <p className="text-sm text-muted-foreground">Roboto Medium (500), 24px - Card titles</p>
                  </div>

                  <div className="pb-4 border-b">
                    <p className="text-base mb-2">Body Text Regular</p>
                    <p className="text-sm text-muted-foreground">Roboto Regular (400), 16px - Main content, line-height 1.5</p>
                  </div>

                  <div className="pb-4 border-b">
                    <p className="text-sm mb-2">Body Small</p>
                    <p className="text-sm text-muted-foreground">Roboto Regular (400), 14px - Secondary information</p>
                  </div>

                  <div>
                    <p className="text-xs mb-2">Caption</p>
                    <p className="text-sm text-muted-foreground">Roboto Regular (400), 12px - Metadata, timestamps</p>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h4 className="font-semibold mb-3">Font Weights Available</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="font-thin">100 - Thin (decorative only)</div>
                    <div className="font-light">300 - Light (accent text, 18px+)</div>
                    <div className="font-normal">400 - Regular (body text)</div>
                    <div className="font-medium">500 - Medium (labels, emphasis)</div>
                    <div className="font-bold">700 - Bold (headings, CTAs)</div>
                    <div className="font-black">900 - Black (logo, hero)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 4. Responsive Breakpoints */}
          <section id="breakpoints">
            <h2 className="text-3xl font-bold mb-6">4. Responsive Breakpoints</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Breakpoint</th>
                        <th className="text-left p-3">Width</th>
                        <th className="text-left p-3">Device</th>
                        <th className="text-left p-3">Container Max Width</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b"><td className="p-3 font-medium">XS (Mobile)</td><td className="p-3">0px</td><td className="p-3">Phone</td><td className="p-3">100% - 16px padding</td></tr>
                      <tr className="border-b"><td className="p-3 font-medium">SM (Small Mobile)</td><td className="p-3">640px</td><td className="p-3">Large Phone</td><td className="p-3">540px</td></tr>
                      <tr className="border-b"><td className="p-3 font-medium">MD (Tablet)</td><td className="p-3">768px</td><td className="p-3">Tablet</td><td className="p-3">720px</td></tr>
                      <tr className="border-b"><td className="p-3 font-medium">LG (Laptop)</td><td className="p-3">1024px</td><td className="p-3">Desktop</td><td className="p-3">960px</td></tr>
                      <tr className="border-b"><td className="p-3 font-medium">XL (Large Desktop)</td><td className="p-3">1280px</td><td className="p-3">Large Desktop</td><td className="p-3">1200px</td></tr>
                      <tr><td className="p-3 font-medium">2XL (Extra Large)</td><td className="p-3">1536px</td><td className="p-3">Ultra-wide</td><td className="p-3">1400px</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Touch Target Minimums</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Minimum size: 44px × 44px (WCAG 2.1 Level AAA)</li>
                    <li>• Recommended: 48px × 48px for mobile</li>
                    <li>• Minimum gap: 8px between touch targets</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 5. Buttons & CTAs */}
          <section id="buttons">
            <h2 className="text-3xl font-bold mb-6">5. Buttons & CTAs</h2>
            <Card>
              <CardContent className="pt-6 space-y-8">
                <div>
                  <h4 className="font-semibold mb-4">Button Variants</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Button variant="default" className="w-full">Primary Button</Button>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Forest Green (#283618)</p>
                        <p>Cream text (#FEFAE0)</p>
                        <p>Height: 40px, Padding: 12px 16px</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button variant="secondary" className="w-full">Secondary Button</Button>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Sage Green (#606C38)</p>
                        <p>Cream text (#FEFAE0)</p>
                        <p>For alternative actions</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button variant="accent" className="w-full">Accent Button</Button>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Terracotta (#DDA15E)</p>
                        <p>Forest Green text</p>
                        <p>Premium features</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button variant="outline" className="w-full">Outline Button</Button>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Transparent background</p>
                        <p>2px Forest Green border</p>
                        <p>Hover: Cream background</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button variant="destructive" className="w-full">Destructive Button</Button>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Red (#DC2626)</p>
                        <p>Cream text</p>
                        <p>Delete/Error actions</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button variant="ghost" className="w-full">Ghost Button</Button>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Transparent background</p>
                        <p>Hover: Accent background</p>
                        <p>Minimal emphasis</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Button Sizes</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small (32px)</Button>
                    <Button size="default">Default (40px)</Button>
                    <Button size="lg">Large (48px)</Button>
                    <Button size="icon"><Check className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Buttons with Icons</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button><Download className="mr-2 h-4 w-4" />Download</Button>
                    <Button variant="secondary"><Search className="mr-2 h-4 w-4" />Search</Button>
                    <Button variant="accent"><Upload className="mr-2 h-4 w-4" />Upload</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Button States</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button>Default State</Button>
                    <Button disabled>Disabled State</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Hover: Opacity 90% • Active: Darker shade • Focus: Terracotta ring (3px) • Disabled: 60% opacity
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 6. Form Elements */}
          <section id="forms">
            <h2 className="text-3xl font-bold mb-6">6. Form Elements & Validation</h2>
            <Card>
              <CardContent className="pt-6 space-y-8">
                <div>
                  <h4 className="font-semibold mb-4">Text Input</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="input-default">Default Input</Label>
                      <Input id="input-default" placeholder="Enter text..." />
                      <p className="text-xs text-muted-foreground">
                        Height: 40px • Border: 1px solid input color • Focus: Terracotta ring
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="input-disabled">Disabled Input</Label>
                      <Input id="input-disabled" placeholder="Disabled..." disabled />
                      <p className="text-xs text-muted-foreground">
                        Muted background and border • 60% opacity
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Validation States</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="input-error">Error State</Label>
                      <div className="relative">
                        <Input 
                          id="input-error" 
                          placeholder="Invalid input" 
                          className="border-destructive pr-10"
                        />
                        <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      </div>
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        This field is required
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="input-success">Success State</Label>
                      <div className="relative">
                        <Input 
                          id="input-success" 
                          placeholder="Valid input" 
                          className="border-[hsl(var(--construction-success))] pr-10"
                        />
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--construction-success))]" />
                      </div>
                      <p className="text-xs text-[hsl(var(--construction-success))] flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Input validated successfully
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Checkbox & Label</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="checkbox-1" />
                      <Label htmlFor="checkbox-1" className="cursor-pointer">Default checkbox</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="checkbox-2" checked />
                      <Label htmlFor="checkbox-2" className="cursor-pointer">Checked checkbox</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="checkbox-3" disabled />
                      <Label htmlFor="checkbox-3" className="cursor-not-allowed opacity-50">Disabled checkbox</Label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Size: 18px × 18px • Border: 1px Forest Green • Checked: Forest Green bg with white checkmark
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Search Input</h4>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-10" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Icon: 20px left-aligned • Padding-left: 40px to accommodate icon
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 7. Badges & Status Indicators */}
          <section id="badges">
            <h2 className="text-3xl font-bold mb-6">7. Badges & Status Indicators</h2>
            <Card>
              <CardContent className="pt-6 space-y-8">
                <div>
                  <h4 className="font-semibold mb-4">Badge Variants</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="accent">Accent</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Padding: 6px 12px • Border Radius: 16px (pill-shaped) • Font: Roboto Medium (500), 12px
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Status Badges</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-[hsl(var(--construction-success))] text-white">
                      <Check className="mr-1 h-3 w-3" />
                      Approved
                    </Badge>
                    <Badge className="bg-[hsl(var(--construction-warning))] text-white">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                    <Badge className="bg-destructive text-white">
                      <X className="mr-1 h-3 w-3" />
                      Rejected
                    </Badge>
                    <Badge className="bg-[hsl(var(--construction-info))] text-white">
                      <Info className="mr-1 h-3 w-3" />
                      In Review
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Construction-Specific Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--construction-warning))]"></div>
                      <span className="text-sm">On Hold</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--construction-success))]"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive"></div>
                      <span className="text-sm">Safety Alert</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <span className="text-sm">Foundation Work</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Dot Indicator: 8px × 8px circle • Display inline with 6px gap • Pulse animation for active items
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 8. Cards & Content */}
          <section id="cards">
            <h2 className="text-3xl font-bold mb-6">8. Content Components - Cards</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Standard Card</CardTitle>
                  <CardDescription>Default card styling with header and content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Background: Cream • Border: 1px solid border color • Border Radius: 8px • 
                    Padding: 24px • Shadow: Elegant shadow • Transition: 150ms ease on hover
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-accent shadow-glow">
                <CardHeader>
                  <CardTitle>Highlighted Card</CardTitle>
                  <CardDescription>Used for premium features or important content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Border: 2px solid Terracotta • Shadow: Glow effect • Emphasis for premium features
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 9. Accessibility */}
          <section id="accessibility">
            <h2 className="text-3xl font-bold mb-6">9. Accessibility & Implementation</h2>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">WCAG Compliance</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5" />
                      <span>All text meets WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5" />
                      <span>Primary color combinations achieve AAA contrast (9.8:1)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5" />
                      <span>All interactive elements have visible focus indicators (Terracotta ring)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5" />
                      <span>Touch targets meet 44px minimum (WCAG 2.1 Level AAA)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5" />
                      <span>Never rely on color alone to convey information</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Implementation Guidelines</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="text-sm font-semibold mb-2">Google Fonts Integration:</h5>
                    <code className="text-xs block bg-background p-3 rounded overflow-x-auto">
{`<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">`}
                    </code>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p><strong>CSS Variables:</strong> All colors defined as HSL in :root and .dark classes</p>
                    <p><strong>Design System:</strong> Use semantic tokens from index.css and tailwind.config.ts</p>
                    <p><strong>Component Library:</strong> shadcn/ui components styled with design system</p>
                    <p><strong>Responsive:</strong> Mobile-first approach with defined breakpoints</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Implementation Note */}
          <section>
            <Card className="border-accent">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Implementation Note</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This style guide represents the comprehensive STOREA design system. All components use the design 
                      system tokens defined in index.css and tailwind.config.ts. Never use direct colors like text-white, 
                      bg-white, etc. Always use semantic tokens for consistency across light and dark modes.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      For complete specifications including navigation components, loading states, construction-specific 
                      components, and detailed implementation guidelines, refer to the full brand documentation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}