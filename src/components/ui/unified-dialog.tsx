import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Save, X } from 'lucide-react';
import { ViewEditMode } from '@/hooks/useViewEditMode';

interface UnifiedDialogProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ViewEditMode;
  onModeChange: (mode: ViewEditMode) => void;
  canEdit?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  tabs?: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
  }>;
  badges?: Array<{
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
  }>;
  actions?: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const UnifiedDialog: React.FC<UnifiedDialogProps> = ({
  title,
  description,
  open,
  onOpenChange,
  mode,
  onModeChange,
  canEdit = true,
  loading = false,
  children,
  tabs,
  badges,
  actions,
  onSave,
  onCancel,
  maxWidth = '2xl'
}) => {
  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl'
  };

  const handleModeToggle = () => {
    if (mode === 'view' && canEdit) {
      onModeChange('edit');
    } else if (mode === 'edit') {
      onCancel?.();
      onModeChange('view');
    }
  };

  const handleSave = () => {
    onSave?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {mode === 'edit' ? `Edit ${title}` : title}
              </DialogTitle>
              {description && (
                <DialogDescription>
                  {mode === 'edit' ? `Update ${description}` : description}
                </DialogDescription>
              )}
              
              {badges && badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {badges.map((badge, index) => (
                    <Badge
                      key={index}
                      variant={badge.variant}
                      className={badge.className}
                    >
                      {badge.text}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {actions}
              
              {mode === 'view' && canEdit && (
                <Button variant="outline" size="sm" onClick={handleModeToggle}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              
              {mode === 'edit' && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleModeToggle}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          {tabs && tabs.length > 0 ? (
            <Tabs defaultValue={tabs[0].id} className="w-full">
              <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-6">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            children
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};