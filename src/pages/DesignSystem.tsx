import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Palette, 
  Type, 
  Layout, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Copy,
  Sun,
  Moon,
  Ruler,
  Grid
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { toast } from '@/hooks/use-toast';

const DesignSystem = () => {
  const { theme, toggleTheme } = useTheme();
  const [copiedValue, setCopiedValue] = useState<string>('');

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedValue(value);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedValue(''), 2000);
  };

  const ColorSwatch = ({ color, name, value }: { color: string; name: string; value: string }) => (
    <div 
      className="group relative rounded-lg border cursor-pointer transition-all hover:scale-105 hover:shadow-md"
      onClick={() => copyToClipboard(value, name)}
    >
      <div 
        className={`h-16 rounded-t-lg ${color}`}
        style={{ backgroundColor: color.startsWith('hsl') ? color : undefined }}
      />
      <div className="p-3">
        <div className="font-medium text-sm">{name}</div>
        <div className="text-xs text-muted-foreground font-mono">{value}</div>
        {copiedValue === value && (
          <div className="absolute inset-0 bg-success/10 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
        )}
      </div>
    </div>
  );

  const SpacingBlock = ({ size, value }: { size: string; value: string }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg border">
      <div className={`bg-primary rounded`} style={{ width: value, height: '24px' }} />
      <div className="flex-1">
        <div className="font-medium">{size}</div>
        <div className="text-sm text-muted-foreground font-mono">{value}</div>
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => copyToClipboard(value, size)}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold font-display mb-2">Design System</h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive design tokens and components for STOREALite
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
        <Separator />
      </div>

      <Tabs defaultValue="colors" className="space-y-8">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        {/* Colors */}
        <TabsContent value="colors" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Primary Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Primary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch color="hsl(221, 83%, 53%)" name="Primary" value="hsl(221, 83%, 53%)" />
                  <ColorSwatch color="hsl(221, 83%, 45%)" name="Primary Hover" value="hsl(221, 83%, 45%)" />
                  <ColorSwatch color="hsl(221, 83%, 95%)" name="Primary Light" value="hsl(221, 83%, 95%)" />
                  <ColorSwatch color="hsl(210, 40%, 98%)" name="Primary Foreground" value="hsl(210, 40%, 98%)" />
                </div>
              </div>

              {/* Secondary Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Secondary & Accent</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch color="hsl(210, 40%, 96%)" name="Secondary" value="hsl(210, 40%, 96%)" />
                  <ColorSwatch color="hsl(142, 76%, 36%)" name="Accent" value="hsl(142, 76%, 36%)" />
                  <ColorSwatch color="hsl(210, 40%, 96%)" name="Muted" value="hsl(210, 40%, 96%)" />
                  <ColorSwatch color="hsl(215, 16%, 47%)" name="Muted Foreground" value="hsl(215, 16%, 47%)" />
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch color="hsl(142, 76%, 36%)" name="Success" value="hsl(142, 76%, 36%)" />
                  <ColorSwatch color="hsl(43, 96%, 56%)" name="Warning" value="hsl(43, 96%, 56%)" />
                  <ColorSwatch color="hsl(0, 84%, 60%)" name="Error" value="hsl(0, 84%, 60%)" />
                  <ColorSwatch color="hsl(221, 83%, 53%)" name="Info" value="hsl(221, 83%, 53%)" />
                </div>
              </div>

              {/* Role Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Role-Specific Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ColorSwatch color="hsl(221, 83%, 53%)" name="Architect" value="hsl(221, 83%, 53%)" />
                  <ColorSwatch color="hsl(142, 76%, 36%)" name="Builder" value="hsl(142, 76%, 36%)" />
                  <ColorSwatch color="hsl(271, 81%, 56%)" name="Homeowner" value="hsl(271, 81%, 56%)" />
                  <ColorSwatch color="hsl(43, 96%, 56%)" name="Contractor" value="hsl(43, 96%, 56%)" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography Scale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Font Families</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-sans text-2xl mb-2">Inter - Sans Serif</div>
                    <div className="font-sans text-muted-foreground">
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <div className="text-sm text-muted-foreground font-mono mt-2">
                      font-family: 'Inter', system-ui, sans-serif
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-display text-2xl mb-2">Playfair Display - Serif</div>
                    <div className="font-display text-muted-foreground">
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <div className="text-sm text-muted-foreground font-mono mt-2">
                      font-family: 'Playfair Display', serif
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Size Scale</h3>
                <div className="space-y-3">
                  <div className="text-xs">Extra Small (12px) - text-xs</div>
                  <div className="text-sm">Small (14px) - text-sm</div>
                  <div className="text-base">Base (16px) - text-base</div>
                  <div className="text-lg">Large (18px) - text-lg</div>
                  <div className="text-xl">Extra Large (20px) - text-xl</div>
                  <div className="text-2xl">2X Large (24px) - text-2xl</div>
                  <div className="text-3xl">3X Large (32px) - text-3xl</div>
                  <div className="text-4xl">4X Large (48px) - text-4xl</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Font Weights</h3>
                <div className="space-y-2">
                  <div className="font-normal">Regular (400) - font-normal</div>
                  <div className="font-medium">Medium (500) - font-medium</div>
                  <div className="font-semibold">Semibold (600) - font-semibold</div>
                  <div className="font-bold">Bold (700) - font-bold</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spacing */}
        <TabsContent value="spacing" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Spacing System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Base Unit: 4px</h3>
                <div className="space-y-3">
                  <SpacingBlock size="Extra Small" value="4px" />
                  <SpacingBlock size="Small" value="8px" />
                  <SpacingBlock size="Medium" value="12px" />
                  <SpacingBlock size="Large" value="16px" />
                  <SpacingBlock size="Extra Large" value="24px" />
                  <SpacingBlock size="2X Large" value="32px" />
                  <SpacingBlock size="3X Large" value="48px" />
                  <SpacingBlock size="4X Large" value="64px" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components */}
        <TabsContent value="components" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm">Small</Button>
                    <Button>Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button disabled>Disabled</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Elements */}
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Input field" />
                <Input placeholder="Disabled input" disabled />
                <div className="flex gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts & Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This is an info alert with default styling.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    This is a destructive alert for errors.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Progress & Loading */}
            <Card>
              <CardHeader>
                <CardTitle>Progress & Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm">Progress Bar</div>
                  <Progress value={65} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm">Success Progress</div>
                  <Progress value={100} className="[&>div]:bg-success" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patterns */}
        <TabsContent value="patterns" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Card Layouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Simple Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Basic card content with header and body.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <p className="text-sm">
                        Card with colored left border accent.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interactive Elements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="font-medium">Hover Effect</div>
                    <div className="text-sm text-muted-foreground">
                      Subtle background change on hover
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg focus-within:ring-2 focus-within:ring-ring transition-all">
                    <Input placeholder="Focus ring example" className="border-0 p-0 focus-visible:ring-0" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Design Tokens */}
        <TabsContent value="tokens" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid className="h-5 w-5" />
                Design Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Border Radius</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary rounded-sm" />
                      <div>
                        <div className="font-medium">Small</div>
                        <div className="text-sm text-muted-foreground">0.25rem (4px)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary rounded-md" />
                      <div>
                        <div className="font-medium">Medium</div>
                        <div className="text-sm text-muted-foreground">0.375rem (6px)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary rounded-lg" />
                      <div>
                        <div className="font-medium">Large</div>
                        <div className="text-sm text-muted-foreground">0.5rem (8px)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary rounded-xl" />
                      <div>
                        <div className="font-medium">Extra Large</div>
                        <div className="text-sm text-muted-foreground">0.75rem (12px)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Shadows</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-card shadow-sm rounded-lg border">
                      <div className="font-medium">Small Shadow</div>
                      <div className="text-sm text-muted-foreground">shadow-sm</div>
                    </div>
                    <div className="p-4 bg-card shadow-md rounded-lg border">
                      <div className="font-medium">Medium Shadow</div>
                      <div className="text-sm text-muted-foreground">shadow-md</div>
                    </div>
                    <div className="p-4 bg-card shadow-lg rounded-lg border">
                      <div className="font-medium">Large Shadow</div>
                      <div className="text-sm text-muted-foreground">shadow-lg</div>
                    </div>
                    <div className="p-4 bg-card shadow-xl rounded-lg border">
                      <div className="font-medium">Extra Large Shadow</div>
                      <div className="text-sm text-muted-foreground">shadow-xl</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DesignSystem;