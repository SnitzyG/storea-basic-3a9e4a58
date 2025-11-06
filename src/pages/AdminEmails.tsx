import { AdminLayout } from '@/components/admin/AdminLayout';
import { EmailMonitoringDashboard } from '@/components/admin/EmailMonitoringDashboard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function AdminEmails() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Mail className="h-6 w-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent" />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Email Monitoring
              </span>
            </CardTitle>
            <CardDescription>Monitor system email activity and delivery status</CardDescription>
          </CardHeader>
        </Card>

        <EmailMonitoringDashboard />
      </div>
    </AdminLayout>
  );
}
