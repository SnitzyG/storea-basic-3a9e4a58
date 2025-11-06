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
                  <li>Animations & Micro-interactions</li>
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

          {/* 8. Animations & Micro-interactions */}
          <section id="animations">
            <h2 className="text-3xl font-bold mb-6">8. Animations & Micro-interactions</h2>
            
            <div className="space-y-6">
              {/* Animation Timing Standards */}
              <Card>
                <CardHeader>
                  <CardTitle>Animation Timing Standards</CardTitle>
                  <CardDescription>Consistent timing creates predictable, professional interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Type</th>
                          <th className="text-left p-3">Duration</th>
                          <th className="text-left p-3">Use Case</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3 font-medium">Quick Feedback</td>
                          <td className="p-3"><code className="text-xs">100-150ms</code></td>
                          <td className="p-3 text-sm text-muted-foreground">Button click, toggle, immediate feedback</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-medium">Standard Transition</td>
                          <td className="p-3"><code className="text-xs">200ms</code></td>
                          <td className="p-3 text-sm text-muted-foreground">Page load, modal open, general transitions</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3 font-medium">Deliberate Motion</td>
                          <td className="p-3"><code className="text-xs">300-400ms</code></td>
                          <td className="p-3 text-sm text-muted-foreground">Collapse/expand, reveal, drawer open</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium">Slow Animation</td>
                          <td className="p-3"><code className="text-xs">500ms+</code></td>
                          <td className="p-3 text-sm text-muted-foreground">Complex sequences, hero sections</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Easing Functions */}
              <Card>
                <CardHeader>
                  <CardTitle>Animation Easing Functions</CardTitle>
                  <CardDescription>Easing creates natural, organic motion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">ease-in</h4>
                        <code className="text-xs bg-muted px-2 py-1 rounded block mb-2">cubic-bezier(0.4, 0, 1, 1)</code>
                        <p className="text-sm text-muted-foreground">Start slow, accelerate. Use for exits.</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">ease-out</h4>
                        <code className="text-xs bg-muted px-2 py-1 rounded block mb-2">cubic-bezier(0, 0, 0.2, 1)</code>
                        <p className="text-sm text-muted-foreground">Start fast, decelerate. Use for entrances.</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">ease-in-out</h4>
                        <code className="text-xs bg-muted px-2 py-1 rounded block mb-2">cubic-bezier(0.4, 0, 0.2, 1)</code>
                        <p className="text-sm text-muted-foreground">Smooth throughout. Use for transitions.</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">linear</h4>
                        <code className="text-xs bg-muted px-2 py-1 rounded block mb-2">No easing</code>
                        <p className="text-sm text-muted-foreground">Constant speed. Use for spinners, loading bars.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hover Effects */}
              <Card>
                <CardHeader>
                  <CardTitle>Hover Effects</CardTitle>
                  <CardDescription>Interactive feedback on hover</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Button Hover</h4>
                      <Button className="transition-opacity duration-150 hover:opacity-90">
                        Hover Me
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Opacity 90%, 150ms ease • All button variants
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Link Hover</h4>
                      <a href="#" className="text-primary hover:text-accent transition-colors duration-150 underline">
                        Hover Link Example
                      </a>
                      <p className="text-xs text-muted-foreground mt-2">
                        Color change to Terracotta, 150ms ease
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Card Hover</h4>
                      <div className="p-4 border rounded-lg transition-all duration-200 hover:shadow-elegant hover:scale-[1.02] cursor-pointer">
                        <p className="text-sm">Hover over this card</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Shadow elevation + scale 1.02, 200ms ease
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Icon Hover</h4>
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-md border transition-all duration-150 hover:scale-110 hover:text-accent cursor-pointer">
                        <Check className="h-5 w-5" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Color change + scale 1.1, 150ms ease
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Table Row Hover</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <tbody>
                            <tr className="transition-colors duration-150 hover:bg-muted cursor-pointer">
                              <td className="p-3">Row 1</td>
                              <td className="p-3">Data</td>
                            </tr>
                            <tr className="transition-colors duration-150 hover:bg-muted cursor-pointer">
                              <td className="p-3">Row 2</td>
                              <td className="p-3">Data</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Beige background, 150ms ease
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Focus States */}
              <Card>
                <CardHeader>
                  <CardTitle>Focus States</CardTitle>
                  <CardDescription>Keyboard navigation and accessibility</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-3">Ring Style</h4>
                        <Button className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                          Tab to Focus
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          3px solid Terracotta • 2px offset from element
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Input Focus</h4>
                        <Input placeholder="Click or tab to focus" />
                        <p className="text-xs text-muted-foreground mt-2">
                          Terracotta ring + Forest Green border
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Focus Requirements</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Always visible, high contrast</li>
                        <li>• Fade in animation: 100ms</li>
                        <li>• Keyboard focus: Always visible (never remove outline)</li>
                        <li>• Mouse focus: Optional, determined by focus-visible</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Click/Press Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Click/Press Feedback</CardTitle>
                  <CardDescription>Tactile response on interaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Button Press</h4>
                      <Button className="active:scale-[0.98] transition-transform duration-50">
                        Click Me
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Scale down 0.98, 50ms
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Checkbox Click</h4>
                      <div className="flex items-center gap-2">
                        <Checkbox id="anim-check" className="transition-transform active:scale-110 duration-150" />
                        <Label htmlFor="anim-check">Click to toggle</Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Scale 1.1 then 1.0, 150ms
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Haptic Feedback</h4>
                      <p className="text-sm text-muted-foreground">
                        Vibrate on mobile (optional) - Use for confirmations and important actions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loading Animations */}
              <Card>
                <CardHeader>
                  <CardTitle>Loading Animations</CardTitle>
                  <CardDescription>Progress indicators and loading states</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Spinner</h4>
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Rotating 360°, 1.5s linear infinite
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Shimmer (Skeleton)</h4>
                      <div className="space-y-3">
                        <div className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-[shimmer_1.5s_ease-in-out_infinite] rounded"></div>
                        <div className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted animate-[shimmer_1.5s_ease-in-out_infinite] rounded"></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Left-to-right gradient, 1.5s ease-in-out infinite • Subtle 60% opacity
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Pulse</h4>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse animation-delay-200"></div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse animation-delay-400"></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Opacity 0.5 to 1.0, 2s ease-in-out infinite
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reveal Animations */}
              <Card>
                <CardHeader>
                  <CardTitle>Reveal Animations (Entrance)</CardTitle>
                  <CardDescription>Elements appearing on screen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Animation</th>
                            <th className="text-left p-3">Transform</th>
                            <th className="text-left p-3">Duration</th>
                            <th className="text-left p-3">Easing</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-3 font-medium">Fade In</td>
                            <td className="p-3"><code className="text-xs">Opacity 0 → 1</code></td>
                            <td className="p-3"><code className="text-xs">200ms</code></td>
                            <td className="p-3"><code className="text-xs">ease-out</code></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 font-medium">Slide In (Top)</td>
                            <td className="p-3"><code className="text-xs">translateY(-20px) → (0, 0)</code></td>
                            <td className="p-3"><code className="text-xs">200ms</code></td>
                            <td className="p-3"><code className="text-xs">ease-out</code></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 font-medium">Slide In (Left)</td>
                            <td className="p-3"><code className="text-xs">translateX(-20px) → (0, 0)</code></td>
                            <td className="p-3"><code className="text-xs">200ms</code></td>
                            <td className="p-3"><code className="text-xs">ease-out</code></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 font-medium">Scale In</td>
                            <td className="p-3"><code className="text-xs">scale(0.95) → 1</code></td>
                            <td className="p-3"><code className="text-xs">200ms</code></td>
                            <td className="p-3"><code className="text-xs">ease-out</code></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium">Combined</td>
                            <td className="p-3"><code className="text-xs">Fade + Slide</code></td>
                            <td className="p-3"><code className="text-xs">200ms</code></td>
                            <td className="p-3"><code className="text-xs">ease-out</code></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Use for modal entrances, popover appearances, page content reveals
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Exit Animations */}
              <Card>
                <CardHeader>
                  <CardTitle>Exit Animations</CardTitle>
                  <CardDescription>Elements leaving the screen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Animation</th>
                            <th className="text-left p-3">Transform</th>
                            <th className="text-left p-3">Duration</th>
                            <th className="text-left p-3">Easing</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-3 font-medium">Fade Out</td>
                            <td className="p-3"><code className="text-xs">Opacity 1 → 0</code></td>
                            <td className="p-3"><code className="text-xs">150ms</code></td>
                            <td className="p-3"><code className="text-xs">ease-in</code></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-3 font-medium">Slide Out (Bottom)</td>
                            <td className="p-3"><code className="text-xs">translateY(0, 0) → (0, 20px)</code></td>
                            <td className="p-3"><code className="text-xs">150ms</code></td>
                            <td className="p-3"><code className="text-xs">ease-in</code></td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium">Scale Out</td>
                            <td className="p-3"><code className="text-xs">scale(1) → 0.95</code></td>
                            <td className="p-3"><code className="text-xs">150ms</code></td>
                            <td className="p-3"><code className="text-xs">ease-in</code></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Exit animations are faster (150ms) than entrances (200ms) for snappy feel
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stagger Effects */}
              <Card>
                <CardHeader>
                  <CardTitle>Stagger Effects</CardTitle>
                  <CardDescription>Sequential animations for lists and groups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Apply animations with 50ms delay per item for sequential reveal
                    </p>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded animate-fade-in">Item 1</div>
                      <div className="p-3 bg-muted rounded animate-fade-in animation-delay-100">Item 2</div>
                      <div className="p-3 bg-muted rounded animate-fade-in animation-delay-200">Item 3</div>
                      <div className="p-3 bg-muted rounded animate-fade-in animation-delay-300">Item 4</div>
                    </div>
                    <div className="p-4 bg-accent-subtle rounded-lg mt-4">
                      <h4 className="font-semibold mb-2">Implementation</h4>
                      <code className="text-xs block bg-background p-3 rounded overflow-x-auto">
                        {`// CSS: animation-delay: calc(50ms * var(--item-index))`}
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use for: Card grids, list items, navigation menus, table rows
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Best Practices */}
              <Card className="border-accent">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Info className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-3">Animation Best Practices</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5 flex-shrink-0" />
                          <span><strong>Be consistent:</strong> Use the same timing and easing for similar interactions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5 flex-shrink-0" />
                          <span><strong>Keep it subtle:</strong> Animations should enhance, not distract</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5 flex-shrink-0" />
                          <span><strong>Respect motion preferences:</strong> Honor prefers-reduced-motion settings</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5 flex-shrink-0" />
                          <span><strong>Performance first:</strong> Use transform and opacity for 60fps animations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-[hsl(var(--construction-success))] mt-0.5 flex-shrink-0" />
                          <span><strong>Test on mobile:</strong> Ensure animations feel natural on touch devices</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 9. Cards & Content */}
          <section id="cards">
            <h2 className="text-3xl font-bold mb-6">9. Content Components - Cards</h2>
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

          {/* 10. Accessibility */}
          <section id="accessibility">
            <h2 className="text-3xl font-bold mb-6">10. Accessibility & Implementation</h2>
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