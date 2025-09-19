import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  DollarSign, 
  Edit, 
  Trash2, 
  Users,
  FileText,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useEnhancedTenders, TenderPackage } from '@/hooks/useEnhancedTenders';
import { formatDistanceToNow } from 'date-fns';

interface TenderPackageManagerProps {
  projectId: string;
  userRole: string;
}

export const TenderPackageManager = ({ projectId, userRole }: TenderPackageManagerProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TenderPackage | null>(null);
  const { packages, tenders, createTenderPackage } = useEnhancedTenders(projectId);

  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    total_budget: '',
    package_type: 'general' as const,
  });

  const handleCreatePackage = async () => {
    if (!packageForm.name.trim()) return;

    const success = await createTenderPackage({
      name: packageForm.name,
      description: packageForm.description || undefined,
      total_budget: packageForm.total_budget ? parseFloat(packageForm.total_budget) : undefined,
      package_type: packageForm.package_type,
    });

    if (success) {
      setPackageForm({
        name: '',
        description: '',
        total_budget: '',
        package_type: 'general',
      });
      setCreateDialogOpen(false);
    }
  };

  const getPackageStats = (packageId: string) => {
    const packageTenders = tenders.filter(t => t.tender_package_id === packageId);
    const totalTenders = packageTenders.length;
    const openTenders = packageTenders.filter(t => t.status === 'open').length;
    const awardedTenders = packageTenders.filter(t => t.status === 'awarded').length;
    const totalBids = packageTenders.reduce((sum, t) => sum + (t.bid_count || 0), 0);
    const totalBudget = packageTenders.reduce((sum, t) => sum + (t.budget || 0), 0);

    return {
      totalTenders,
      openTenders,
      awardedTenders,
      totalBids,
      totalBudget,
    };
  };

  const packageTypeColors = {
    general: 'bg-blue-50 text-blue-700 border-blue-200',
    design: 'bg-purple-50 text-purple-700 border-purple-200',
    construction: 'bg-orange-50 text-orange-700 border-orange-200',
    consulting: 'bg-green-50 text-green-700 border-green-200',
  };

  const packageTypeLabels = {
    general: 'General',
    design: 'Design',
    construction: 'Construction',
    consulting: 'Consulting',
  };

  const canManagePackages = userRole === 'architect';

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tender Packages</h2>
          <p className="text-muted-foreground">
            Group related tenders into packages for better organization and management.
          </p>
        </div>
        
        {canManagePackages && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Package
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tender Package</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="package-name">Package Name *</Label>
                  <Input
                    id="package-name"
                    placeholder="Enter package name..."
                    value={packageForm.name}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="package-description">Description</Label>
                  <Textarea
                    id="package-description"
                    placeholder="Describe the scope and purpose of this package..."
                    value={packageForm.description}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="package-budget">Total Budget</Label>
                    <Input
                      id="package-budget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={packageForm.total_budget}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, total_budget: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="package-type">Package Type</Label>
                    <Select 
                      value={packageForm.package_type} 
                      onValueChange={(value: any) => setPackageForm(prev => ({ ...prev, package_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePackage}
                    disabled={!packageForm.name.trim()}
                  >
                    Create Package
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Packages Grid */}
      {packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => {
            const stats = getPackageStats(pkg.id);
            
            return (
              <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      </div>
                      
                      <Badge className={packageTypeColors[pkg.package_type]}>
                        {packageTypeLabels[pkg.package_type]}
                      </Badge>
                    </div>
                    
                    {canManagePackages && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  {/* Budget Information */}
                  {pkg.total_budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        Budget: ${pkg.total_budget.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Package Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span>{stats.totalTenders} Tenders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span>{stats.totalBids} Bids</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-green-600">
                        {stats.openTenders} Open
                      </div>
                      <div className="text-blue-600">
                        {stats.awardedTenders} Awarded
                      </div>
                    </div>
                  </div>

                  {/* Budget Utilization */}
                  {pkg.total_budget && stats.totalBudget > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Budget Utilization</span>
                        <span>{Math.round((stats.totalBudget / pkg.total_budget) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min((stats.totalBudget / pkg.total_budget) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Package Status */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created {formatDistanceToNow(new Date(pkg.created_at), { addSuffix: true })}</span>
                    <Badge variant="outline" className={
                      pkg.status === 'active' ? 'border-green-500 text-green-700' :
                      pkg.status === 'completed' ? 'border-blue-500 text-blue-700' :
                      'border-gray-500 text-gray-700'
                    }>
                      {pkg.status}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Tenders
                    </Button>
                    {canManagePackages && (
                      <Button size="sm" className="flex-1">
                        Manage
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Packages Created</h3>
            <p className="text-muted-foreground mb-4">
              Create tender packages to organize and group related work items for better management.
            </p>
            {canManagePackages && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Package
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Package Performance Summary */}
      {packages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Package Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {packages.reduce((sum, pkg) => sum + getPackageStats(pkg.id).totalTenders, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total Tenders</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {packages.reduce((sum, pkg) => sum + getPackageStats(pkg.id).totalBids, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total Bids Received</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${packages.reduce((sum, pkg) => sum + (pkg.total_budget || 0), 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};