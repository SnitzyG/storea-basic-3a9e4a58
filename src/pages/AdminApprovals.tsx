import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserApprovalDashboard } from '@/components/admin/UserApprovalDashboard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AdminApprovals() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-6 w-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent" />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                User Approvals
              </span>
            </CardTitle>
            <CardDescription>Review and approve pending user registrations</CardDescription>
          </CardHeader>
        </Card>

        <UserApprovalDashboard />
      </div>
    </AdminLayout>
  );
}
