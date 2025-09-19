import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChangeOrdersSectionProps {
  projectId: string;
  userRole: string;
}

interface ChangeOrder {
  id: string;
  order_number: string;
  title: string;
  financial_impact: number;
  status: string;
  created_at: string;
}

export function ChangeOrdersSection({ projectId, userRole }: ChangeOrdersSectionProps) {
  const [orders, setOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [projectId]);

  const fetchOrders = async () => {
    try {
      const { data } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching change orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Orders</CardTitle>
        <CardDescription>Track project variations and their financial impact</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Change Orders</h3>
            <p className="text-muted-foreground">Change orders will appear here when created</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Financial Impact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{order.title}</TableCell>
                  <TableCell className={order.financial_impact >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${Math.abs(order.financial_impact).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'approved' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}