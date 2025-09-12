import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ViewEditMode } from '@/hooks/useViewEditMode';

interface BaseFieldProps {
  label: string;
  mode: ViewEditMode;
  required?: boolean;
  description?: string;
  className?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'tel' | 'number';
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  step?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

interface BadgeFieldProps extends BaseFieldProps {
  type: 'badge';
  value: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

interface DisplayFieldProps extends BaseFieldProps {
  type: 'display';
  value: React.ReactNode;
  icon?: React.ReactNode;
}

type ViewEditFieldProps = 
  | TextFieldProps 
  | TextareaFieldProps 
  | SelectFieldProps 
  | BadgeFieldProps 
  | DisplayFieldProps;

export const ViewEditField: React.FC<ViewEditFieldProps> = (props) => {
  const { label, mode, required, description, className } = props;
  
  const renderField = () => {
    if (mode === 'view') {
      if (props.type === 'badge') {
        return (
          <Badge variant={props.variant} className={props.className}>
            {props.value}
          </Badge>
        );
      }
      
      if (props.type === 'display') {
        return (
          <div className="flex items-center gap-2">
            {props.icon}
            <span className="font-medium">{props.value}</span>
          </div>
        );
      }
      
      return (
        <div className="bg-muted/50 p-3 rounded-md">
          <span className="text-foreground">
            {props.value || 'Not set'}
          </span>
        </div>
      );
    }
    
    // Edit mode
    if (props.type === 'textarea') {
      return (
        <Textarea
          value={props.value}
          onChange={(e) => props.onChange?.(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows || 3}
          required={required}
        />
      );
    }
    
    if (props.type === 'select') {
      return (
        <Select value={props.value} onValueChange={props.onChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (props.type === 'badge' || props.type === 'display') {
      // These types are view-only
      return (
        <div className="bg-muted/50 p-3 rounded-md">
          <span className="text-muted-foreground">
            This field is read-only
          </span>
        </div>
      );
    }
    
    // Text input types
    return (
      <Input
        type={props.type}
        value={props.value}
        onChange={(e) => props.onChange?.(e.target.value)}
        placeholder={props.placeholder}
        disabled={props.disabled}
        step={props.step}
        required={required}
      />
    );
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};