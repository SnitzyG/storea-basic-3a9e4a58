import { supabase } from '@/integrations/supabase/client';
import { RFI } from '@/hooks/useRFIs';

export interface ParsedEmailRFI {
  subject: string;
  sender_email: string;
  sender_name?: string;
  content: string;
  question: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  project_references?: string[];
  attachments?: EmailAttachment[];
  parsed_fields: {
    drawing_no?: string;
    specification_section?: string;
    contract_clause?: string;
    other_reference?: string;
    proposed_solution?: string;
    required_response_by?: string;
  };
}

export interface EmailAttachment {
  name: string;
  type: string;
  size: number;
  content?: string; // base64 encoded content
  url?: string; // temporary URL for download
}

export const EmailRFIParser = {
  /**
   * Parse incoming email and extract RFI information
   */
  parseEmail: async (emailData: {
    subject: string;
    from: string;
    body: string;
    attachments?: EmailAttachment[];
    received_at: string;
  }): Promise<ParsedEmailRFI> => {
    try {
      const { subject, from, body, attachments = [] } = emailData;
      
      // Extract sender information
      const senderMatch = from.match(/^(.+?)<(.+?)>$/) || from.match(/^(.+)$/);
      const sender_name = senderMatch?.[1]?.trim().replace(/["']/g, '') || '';
      const sender_email = senderMatch?.[2]?.trim() || senderMatch?.[1]?.trim() || from;

      // Determine priority based on keywords
      const priority = determinePriority(subject, body);

      // Extract question from email body
      const question = extractQuestion(body);

      // Parse structured fields
      const parsed_fields = parseStructuredFields(body);

      // Extract project references
      const project_references = extractProjectReferences(subject, body);

      // Determine category
      const category = determineCategory(subject, body);

      return {
        subject: subject.trim(),
        sender_email,
        sender_name,
        content: body,
        question,
        priority,
        category,
        project_references,
        attachments,
        parsed_fields
      };
    } catch (error) {
      console.error('Error parsing email RFI:', error);
      throw error;
    }
  },

  /**
   * Create RFI from parsed email data
   */
  createRFIFromEmail: async (
    parsedEmail: ParsedEmailRFI, 
    projectId: string, 
    userId: string
  ): Promise<string | null> => {
    try {
      // Create the RFI
      const rfiData = {
        project_id: projectId,
        question: parsedEmail.question,
        priority: parsedEmail.priority,
        category: parsedEmail.category,
        subject: parsedEmail.subject,
        sender_name: parsedEmail.sender_name,
        sender_email: parsedEmail.sender_email,
        ...parsedEmail.parsed_fields,
        raised_by: userId
      };

      const { data: rfi, error: rfiError } = await supabase
        .from('rfis')
        .insert(rfiData)
        .select()
        .maybeSingle();

      if (rfiError || !rfi) throw rfiError || new Error('Failed to create RFI');

      // Process attachments if any
      if (parsedEmail.attachments.length > 0) {
        await processEmailAttachments(rfi.id, parsedEmail.attachments);
      }

      // Log activity
      await supabase
        .from('rfi_activities')
        .insert({
          rfi_id: rfi.id,
          user_id: userId,
          action: 'created_from_email',
          details: `RFI created from email: ${parsedEmail.sender_email}`
        });

      return rfi.id;
    } catch (error) {
      console.error('Error creating RFI from email:', error);
      throw error;
    }
  },

  /**
   * Process incoming emails for potential RFI creation
   */
  processIncomingEmail: async (emailData: any): Promise<{
    success: boolean;
    rfi_id?: string;
    message: string;
  }> => {
    try {
      // Parse the email
      const parsedEmail = await EmailRFIParser.parseEmail(emailData);

      // Try to match to existing project
      const project = await findMatchingProject(parsedEmail.project_references, parsedEmail.sender_email);
      
      if (!project) {
        return {
          success: false,
          message: 'No matching project found for this email'
        };
      }

      // Find or create user for sender
      const user = await findOrCreateUserFromEmail(parsedEmail.sender_email, parsedEmail.sender_name);
      
      if (!user) {
        return {
          success: false,
          message: 'Could not process sender information'
        };
      }

      // Create the RFI
      const rfiId = await EmailRFIParser.createRFIFromEmail(parsedEmail, project.id, user.id);

      return {
        success: true,
        rfi_id: rfiId,
        message: 'RFI created successfully from email'
      };
    } catch (error) {
      console.error('Error processing incoming email:', error);
      return {
        success: false,
        message: `Error processing email: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Helper functions
function determinePriority(subject: string, body: string): 'low' | 'medium' | 'high' | 'critical' {
  const text = (subject + ' ' + body).toLowerCase();
  
  if (text.includes('urgent') || text.includes('critical') || text.includes('asap') || text.includes('emergency')) {
    return 'critical';
  } else if (text.includes('high priority') || text.includes('important') || text.includes('priority')) {
    return 'high';
  } else if (text.includes('low priority') || text.includes('when convenient')) {
    return 'low';
  }
  
  return 'medium';
}

function extractQuestion(body: string): string {
  // Clean HTML if present
  const cleanBody = body.replace(/<[^>]*>/g, '').trim();
  
  // Look for question patterns
  const questionPatterns = [
    /(?:question|query|inquiry|rfi):\s*(.+?)(?:\n|$)/i,
    /what\s+.+?\?/i,
    /how\s+.+?\?/i,
    /why\s+.+?\?/i,
    /when\s+.+?\?/i,
    /where\s+.+?\?/i
  ];

  for (const pattern of questionPatterns) {
    const match = cleanBody.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  // If no specific question pattern, take first paragraph or first 200 chars
  const firstParagraph = cleanBody.split('\n')[0];
  return firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + '...' : firstParagraph;
}

function parseStructuredFields(body: string): ParsedEmailRFI['parsed_fields'] {
  const fields: ParsedEmailRFI['parsed_fields'] = {};
  
  const patterns = {
    drawing_no: /(?:drawing|dwg|plan)\s*(?:no|number|#)?\s*:?\s*([A-Z0-9\-\/]+)/i,
    specification_section: /(?:spec|specification)\s*(?:section)?\s*:?\s*([0-9]+\.?[0-9]*)/i,
    contract_clause: /(?:contract|clause)\s*(?:no|number|#)?\s*:?\s*([0-9]+\.?[0-9]*)/i,
    required_response_by: /(?:response|reply)\s*(?:required|needed|by)\s*:?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i
  };

  for (const [field, pattern] of Object.entries(patterns)) {
    const match = body.match(pattern);
    if (match && match[1]) {
      fields[field as keyof ParsedEmailRFI['parsed_fields']] = match[1].trim();
    }
  }

  return fields;
}

function extractProjectReferences(subject: string, body: string): string[] {
  const text = subject + ' ' + body;
  const references: string[] = [];
  
  // Look for project codes, numbers, or names
  const patterns = [
    /project\s*(?:no|number|#)?\s*:?\s*([A-Z0-9\-]+)/gi,
    /job\s*(?:no|number|#)?\s*:?\s*([A-Z0-9\-]+)/gi,
    /\b([A-Z]{2,3}-[0-9]{3,4})\b/g // Pattern like ABC-1234
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !references.includes(match[1])) {
        references.push(match[1]);
      }
    }
  }

  return references;
}

function determineCategory(subject: string, body: string): string {
  const text = (subject + ' ' + body).toLowerCase();
  
  const categories = {
    'Design': ['design', 'architectural', 'structural', 'aesthetic'],
    'Technical': ['technical', 'engineering', 'specification', 'standard'],
    'Material': ['material', 'product', 'supplier', 'vendor'],
    'Schedule': ['schedule', 'timeline', 'deadline', 'completion'],
    'Cost': ['cost', 'budget', 'pricing', 'estimate'],
    'Site': ['site', 'field', 'location', 'access'],
    'Safety': ['safety', 'hazard', 'risk', 'protection'],
    'Quality': ['quality', 'testing', 'inspection', 'compliance']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'General';
}

async function findMatchingProject(references: string[], senderEmail: string) {
  try {
    // First try to find by project references
    if (references.length > 0) {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .or(references.map(ref => `name.ilike.%${ref}%`).join(','));
      
      if (projects && projects.length > 0) {
        return projects[0];
      }
    }

    // Then try to find by sender participation in projects
    const { data: userProjects } = await supabase
      .from('project_users')
      .select('project_id, projects(*)')
      .eq('user_id', await getUserIdFromEmail(senderEmail))
      .limit(1);

    if (userProjects && userProjects.length > 0) {
      return userProjects[0].projects;
    }

    return null;
  } catch (error) {
    console.error('Error finding matching project:', error);
    return null;
  }
}

async function findOrCreateUserFromEmail(email: string, name?: string) {
  try {
    // Try to find existing user
    const userId = await getUserIdFromEmail(email);
    if (!userId) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      return { id: profile.user_id };
    }

    // If not found, this would typically require admin privileges
    // For now, return null and handle externally
    return null;
  } catch (error) {
    console.error('Error finding/creating user:', error);
    return null;
  }
}

async function getUserIdFromEmail(email: string): Promise<string | null> {
  try {
    // This would typically require admin access to auth.users
    // For now, return a placeholder or handle via edge function
    return null;
  } catch (error) {
    return null;
  }
}

async function processEmailAttachments(rfiId: string, attachments: EmailAttachment[]) {
  try {
    for (const attachment of attachments) {
      if (attachment.content) {
        // Store attachment in documents table
        const { error } = await supabase
          .from('documents')
          .insert({
            name: attachment.name,
            file_type: attachment.type,
            file_size: attachment.size,
            project_id: rfiId, // Using RFI ID as project reference
            uploaded_by: rfiId, // This needs proper user ID
            file_path: `rfi-attachments/${rfiId}/${attachment.name}`,
            category: 'rfi_attachment'
          });

        if (error) {
          console.error('Error storing attachment:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error processing email attachments:', error);
  }
}