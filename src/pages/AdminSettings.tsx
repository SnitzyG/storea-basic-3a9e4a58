import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Settings className="h-6 w-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent" />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Admin Settings
              </span>
            </CardTitle>
            <CardDescription>Configure platform settings and preferences</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
            <CardDescription>System-wide settings and options</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Admin settings panel - Configure your platform preferences here.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
