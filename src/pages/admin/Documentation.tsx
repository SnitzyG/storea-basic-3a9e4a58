import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComprehensivePDFGenerator } from '@/utils/comprehensivePDFGenerator';
import { platformDocumentation } from '@/data/platformDocumentation';
import { Download, FileText, Database, Shield, Users, Settings, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Documentation() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      setIsGenerating(true);
      toast({
        title: 'Generating PDF...',
        description: 'Creating comprehensive 100+ page documentation. This may take a moment.',
      });

      // Use setTimeout to allow toast to render before heavy processing
      setTimeout(() => {
        try {
          const generator = new ComprehensivePDFGenerator();
          generator.download('STOREA_Complete_Documentation.pdf');

          toast({
            title: 'PDF Generated',
            description: 'Comprehensive documentation PDF has been downloaded.',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to generate PDF documentation.',
            variant: 'destructive',
          });
          console.error('PDF generation error:', error);
        } finally {
          setIsGenerating(false);
        }
      }, 100);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF documentation.',
        variant: 'destructive',
      });
      console.error('PDF generation error:', error);
      setIsGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Platform Documentation</h1>
            <p className="text-muted-foreground">Complete technical and user experience guide</p>
          </div>
          <Button onClick={handleDownloadPDF} disabled={isGenerating} size="lg">
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documentation Overview</CardTitle>
            <CardDescription>
              Generated: {new Date(platformDocumentation.metadata.lastUpdated).toLocaleDateString()} • 
              Version {platformDocumentation.metadata.version}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Comprehensive Guide</p>
                  <p className="text-xs text-muted-foreground">30+ pages of documentation</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Database Schema</p>
                  <p className="text-xs text-muted-foreground">75+ tables documented</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">User Roles</p>
                  <p className="text-xs text-muted-foreground">5 roles, full UX flows</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="roles">User Roles</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>{platformDocumentation.systemOverview.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-semibold">Technology Stack</h3>
                  {platformDocumentation.systemOverview.techStack.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-primary">{item.technology}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  External APIs & Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {platformDocumentation.integrations.services.map((service, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <Badge variant="secondary">{service.purpose}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{service.cost}</p>
                    {service.features && (
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {service.features.map((feature, fIndex) => (
                          <li key={fIndex}>{feature}</li>
                        ))}
                      </ul>
                    )}
                    {index < platformDocumentation.integrations.services.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Edge Functions</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {platformDocumentation.edgeFunctions.functions.map((fn, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-card">
                        <p className="font-medium text-sm">{fn.name}</p>
                        <p className="text-xs text-muted-foreground">{fn.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Schema
                </CardTitle>
                <CardDescription>{platformDocumentation.database.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {platformDocumentation.database.categories.map((category, index) => (
                  <div key={index}>
                    <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.tables.map((table, tIndex) => (
                        <Badge key={tIndex} variant="outline">{table}</Badge>
                      ))}
                    </div>
                    {index < platformDocumentation.database.categories.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Roles & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {platformDocumentation.userRoles.roles.map((role, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{role.title}</h3>
                      <Badge>{role.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                    <div>
                      <p className="text-sm font-medium mb-2">Capabilities:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {role.capabilities.map((capability, cIndex) => (
                          <li key={cIndex}>{capability}</li>
                        ))}
                      </ul>
                    </div>
                    {index < platformDocumentation.userRoles.roles.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Permission Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Feature</th>
                          <th className="text-center p-2">Architect</th>
                          <th className="text-center p-2">Builder</th>
                          <th className="text-center p-2">Contractor</th>
                          <th className="text-center p-2">Homeowner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformDocumentation.userRoles.permissionMatrix.map((perm, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{perm.feature}</td>
                            <td className="text-center p-2">{perm.architect ? '✓' : '✗'}</td>
                            <td className="text-center p-2">{perm.builder ? '✓' : '✗'}</td>
                            <td className="text-center p-2">{perm.contractor ? '✓' : '✗'}</td>
                            <td className="text-center p-2">{perm.homeowner ? '✓' : '✗'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Implementation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Authentication</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {platformDocumentation.security.authentication.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Authorization</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {platformDocumentation.security.authorization.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Data Protection</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {platformDocumentation.security.dataProtection.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Monitoring</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {platformDocumentation.security.monitoring.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Required Setup & Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Environment Secrets</h3>
                  {platformDocumentation.setup.secrets.map((secret, index) => (
                    <div key={index} className="mb-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{secret.name}</p>
                        {secret.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{secret.purpose}</p>
                      {secret.setup && (
                        <div className="text-xs bg-background p-2 rounded border">
                          <pre className="whitespace-pre-wrap">{secret.setup}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Supabase Configuration</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {platformDocumentation.setup.supabaseConfig.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2">STOREA Bot Setup</h3>
                  <ul className="list-decimal list-inside space-y-1 text-sm">
                    {platformDocumentation.setup.storeaBot.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Deployment</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {platformDocumentation.setup.deployment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
