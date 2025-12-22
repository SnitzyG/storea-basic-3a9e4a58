import { z } from 'zod';

// ========== CONTACT FORM ==========

export const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  message: z.string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ========== PROJECT FORM ==========

export const createProjectSchema = z.object({
  project_reference_number: z.string().max(50).optional(),
  name: z.string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(200, "Project name must be less than 200 characters"),
  project_type: z.string().min(1, "Please select a project type"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  budget: z.string().min(1, "Please select or enter a budget"),
  street_number: z.string().max(20).optional(),
  street_name: z.string().max(200).optional(),
  suburb: z.string().max(100).optional(),
  postcode: z.string().max(10).optional(),
  estimated_start_date: z.date({ required_error: "Start date is required" }),
  estimated_finish_date: z.date({ required_error: "Finish date is required" }),
  homeowner_name: z.string()
    .trim()
    .min(2, "Homeowner name must be at least 2 characters")
    .max(100, "Homeowner name must be less than 100 characters"),
  homeowner_phone: z.string()
    .regex(/^[\+]?[0-9\s\-]{10,20}$/, "Please enter a valid phone number"),
  homeowner_email: z.string()
    .trim()
    .email("Please enter a valid email address"),
}).refine((data) => data.estimated_finish_date > data.estimated_start_date, {
  message: "Finish date must be after start date",
  path: ["estimated_finish_date"],
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

// ========== TENDER FORM ==========

export const createTenderSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  budget: z.string().optional(),
  beginDate: z.string().optional(),
  submissionDeadline: z.string().min(1, "Submission deadline is required"),
  requirements: z.string().max(5000, "Requirements must be less than 5000 characters").optional(),
});

export type CreateTenderFormData = z.infer<typeof createTenderSchema>;

// ========== RFI FORM ==========

export const createRFISchema = z.object({
  project_name: z.string().max(200).optional(),
  project_number: z.string().max(100).optional(),
  date: z.date(),
  recipient_name: z.string().max(100).optional(),
  recipient_email: z.string().email().optional().or(z.literal('')),
  sender_name: z.string().max(100).optional(),
  sender_email: z.string().email().optional().or(z.literal('')),
  subject: z.string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be less than 200 characters"),
  drawing_no: z.string().max(100).optional(),
  specification_section: z.string().max(100).optional(),
  contract_clause: z.string().max(100).optional(),
  other_reference: z.string().max(500).optional(),
  question: z.string()
    .trim()
    .min(10, "Question must be at least 10 characters")
    .max(5000, "Question must be less than 5000 characters"),
  proposed_solution: z.string().max(5000).optional(),
  required_response_by: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().max(100).optional(),
  assigned_to: z.string().optional(),
  rfi_type: z.enum(['general_correspondence', 'request_for_information', 'general_advice']),
});

export type CreateRFIFormData = z.infer<typeof createRFISchema>;

// ========== MESSAGE THREAD FORM ==========

export const createMessageThreadSchema = z.object({
  title: z.string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be less than 200 characters"),
  participants: z.array(z.string()).min(1, "Please select at least one participant"),
  initialMessage: z.string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(10000, "Message must be less than 10000 characters"),
});

export type CreateMessageThreadFormData = z.infer<typeof createMessageThreadSchema>;

// ========== CALENDAR EVENT FORM ==========

export const createCalendarEventSchema = z.object({
  title: z.string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().max(2000).optional(),
  start_datetime: z.date({ required_error: "Start date/time is required" }),
  end_datetime: z.date().optional(),
  location: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  is_meeting: z.boolean().optional(),
  meeting_link: z.string().url().optional().or(z.literal('')),
});

export type CreateCalendarEventFormData = z.infer<typeof createCalendarEventSchema>;

// ========== TODO/TASK FORM ==========

export const createTodoSchema = z.object({
  title: z.string()
    .trim()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title must be less than 200 characters"),
  description: z.string().max(2000).optional(),
  due_date: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  project_id: z.string().optional(),
});

export type CreateTodoFormData = z.infer<typeof createTodoSchema>;

// ========== HELPER VALIDATION FUNCTIONS ==========

export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _form: 'Validation failed' } };
  }
}
