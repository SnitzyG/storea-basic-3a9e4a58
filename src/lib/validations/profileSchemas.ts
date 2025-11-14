import { z } from 'zod';

// Base schema for all users
const basePersonalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  phone: z.string().regex(/^[0-9]{10,}$/, "Phone must be at least 10 digits").min(10, "Phone number must be at least 10 digits"),
  bio: z.string().max(200, "Bio must be less than 200 characters").optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

// Homeowner schema
export const homeownerSchema = basePersonalSchema.extend({
  role: z.literal('homeowner'),
  property_address: z.string().min(5, "Please enter a valid property address"),
  project_type: z.string().min(1, "Please select a project type"),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
});

// Architect schema
export const architectSchema = basePersonalSchema.extend({
  role: z.literal('architect'),
  company: z.string().min(2, "Company name is required").max(100),
  company_position: z.string().min(1, "Please select your position"),
  professional_license_number: z.string().min(1, "Professional license number is required"),
  years_experience: z.number().min(0, "Must be 0 or greater").max(70, "Must be 70 or less"),
  specialization: z.array(z.string()).min(1, "Select at least one specialization"),
  company_website: z.string().url("Invalid URL").optional().or(z.literal('')),
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_logo_url: z.string().url().optional().or(z.literal('')),
  number_of_employees: z.number().optional(),
});

// Builder schema
export const builderSchema = basePersonalSchema.extend({
  role: z.literal('builder'),
  company: z.string().min(2, "Company name is required").max(100),
  business_registration_number: z.string().min(1, "Business registration number/ABN is required"),
  abn: z.string().optional(),
  company_position: z.string().min(1, "Please select your position"),
  years_experience: z.number().min(0).max(70),
  specialization: z.array(z.string()).min(1, "Select at least one specialization"),
  company_address: z.string().min(5, "Company address is required"),
  company_phone: z.string().regex(/^[0-9]{10,}$/, "Company phone must be at least 10 digits").min(10),
  company_website: z.string().url("Invalid URL").optional().or(z.literal('')),
  professional_license_number: z.string().min(1, "Professional licenses are required"),
  company_logo_url: z.string().url().optional().or(z.literal('')),
  number_of_employees: z.number().optional(),
});

// Contractor schema (can be individual or company)
export const contractorSchema = basePersonalSchema.extend({
  role: z.literal('contractor'),
  company: z.string().optional(), // Optional for individuals
  specialization: z.array(z.string()).min(1, "Select your trade/specialty"),
  professional_license_number: z.string().min(1, "Professional license number is required"),
  years_experience: z.number().min(0).max(70),
  insurance_details: z.string().min(1, "Insurance details are required"),
  business_registration_number: z.string().optional(),
  abn: z.string().optional(),
  company_address: z.string().optional(),
  company_phone: z.string().optional(),
  company_website: z.string().url("Invalid URL").optional().or(z.literal('')),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    date: z.string(),
  })).optional(),
  company_logo_url: z.string().url().optional().or(z.literal('')),
});

export type HomeownerFormData = z.infer<typeof homeownerSchema>;
export type ArchitectFormData = z.infer<typeof architectSchema>;
export type BuilderFormData = z.infer<typeof builderSchema>;
export type ContractorFormData = z.infer<typeof contractorSchema>;

export type ProfileFormData = HomeownerFormData | ArchitectFormData | BuilderFormData | ContractorFormData;

// Validation function
export const validateProfileData = (role: string, data: any) => {
  switch (role) {
    case 'homeowner':
      return homeownerSchema.parse(data);
    case 'architect':
      return architectSchema.parse(data);
    case 'builder':
      return builderSchema.parse(data);
    case 'contractor':
      return contractorSchema.parse(data);
    default:
      throw new Error(`Invalid role: ${role}`);
  }
};
