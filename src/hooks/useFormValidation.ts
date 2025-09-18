import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

interface ValidationRule {
  field: string;
  validator: (value: any) => boolean | string;
  message: string;
  dependencies?: string[];
}

interface UseFormValidationOptions {
  schema?: z.ZodSchema;
  customRules?: ValidationRule[];
  validateOnChange?: boolean;
  debounceMs?: number;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export const useFormValidation = (options: UseFormValidationOptions = {}) => {
  const {
    schema,
    customRules = [],
    validateOnChange = true,
    debounceMs = 300
  } = options;

  const [errors, setErrors] = useState<Record<string, ValidationError>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Debounced validation function
  const validateField = useCallback(
    debounce(async (field: string, value: any, allValues: Record<string, any>) => {
      setIsValidating(true);
      const fieldErrors: ValidationError[] = [];

      // Schema validation
      if (schema) {
        try {
          await schema.parseAsync(allValues);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const fieldError = error.errors.find(e => e.path.includes(field));
            if (fieldError) {
              fieldErrors.push({
                field,
                message: fieldError.message,
                type: 'error'
              });
            }
          }
        }
      }

      // Custom rules validation
      for (const rule of customRules) {
        if (rule.field === field) {
          const result = rule.validator(value);
          if (result !== true) {
            fieldErrors.push({
              field,
              message: typeof result === 'string' ? result : rule.message,
              type: 'error'
            });
          }
        }
      }

      // Update errors state
      setErrors(prev => {
        const newErrors = { ...prev };
        if (fieldErrors.length > 0) {
          newErrors[field] = fieldErrors[0]; // Show first error
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });

      setIsValidating(false);
    }, debounceMs),
    [schema, customRules, debounceMs]
  );

  // Validate entire form
  const validateForm = useCallback(async (values: Record<string, any>) => {
    setIsValidating(true);
    const formErrors: Record<string, ValidationError> = {};

    // Schema validation
    if (schema) {
      try {
        await schema.parseAsync(values);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            const field = err.path.join('.');
            formErrors[field] = {
              field,
              message: err.message,
              type: 'error'
            };
          });
        }
      }
    }

    // Custom rules validation
    for (const rule of customRules) {
      const value = values[rule.field];
      const result = rule.validator(value);
      if (result !== true) {
        formErrors[rule.field] = {
          field: rule.field,
          message: typeof result === 'string' ? result : rule.message,
          type: 'error'
        };
      }
    }

    setErrors(formErrors);
    setIsValid(Object.keys(formErrors).length === 0);
    setIsValidating(false);

    return Object.keys(formErrors).length === 0;
  }, [schema, customRules]);

  // Clear field error
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(true);
  }, []);

  // Add custom warning or info message
  const addFieldMessage = useCallback((field: string, message: string, type: 'warning' | 'info' = 'info') => {
    setErrors(prev => ({
      ...prev,
      [field]: { field, message, type }
    }));
  }, []);

  // Update validation state when errors change
  useEffect(() => {
    const hasErrors = Object.values(errors).some(error => error.type === 'error');
    setIsValid(!hasErrors);
  }, [errors]);

  return {
    errors,
    isValidating,
    isValid,
    validateField,
    validateForm,
    clearFieldError,
    clearErrors,
    addFieldMessage,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError: (field: string) => errors[field],
    hasFieldError: (field: string) => !!errors[field] && errors[field].type === 'error',
    hasFieldWarning: (field: string) => !!errors[field] && errors[field].type === 'warning',
    hasFieldInfo: (field: string) => !!errors[field] && errors[field].type === 'info',
  };
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

// Pre-defined validation rules
export const validationRules = {
  required: (message = 'This field is required') => ({
    validator: (value: any) => value !== undefined && value !== null && value !== '',
    message
  }),

  minLength: (min: number, message?: string) => ({
    validator: (value: string) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string) => ({
    validator: (value: string) => !value || value.length <= max,
    message: message || `Must be no more than ${max} characters`
  }),

  email: (message = 'Invalid email format') => ({
    validator: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  phone: (message = 'Invalid phone number') => ({
    validator: (value: string) => !value || /^\+?[\d\s\-\(\)]+$/.test(value),
    message
  }),

  url: (message = 'Invalid URL format') => ({
    validator: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  futureDate: (message = 'Date must be in the future') => ({
    validator: (value: Date) => !value || value > new Date(),
    message
  }),

  pastDate: (message = 'Date must be in the past') => ({
    validator: (value: Date) => !value || value < new Date(),
    message
  }),

  conditional: (condition: (values: any) => boolean, rule: any, message?: string) => ({
    validator: (value: any, values: any) => {
      if (!condition(values)) return true;
      return rule.validator(value);
    },
    message: message || rule.message
  })
};