import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
}

const DOCUMENT_TEMPLATES: Record<string, { title: string; sections: string[] }> = {
  'Notice to Tenderers': {
    title: 'Notice to Tenderers Template',
    sections: [
      '1. Project Title and Description',
      '2. Employer/Client Details (Name, Address, Contact)',
      '3. Tender Reference Number',
      '4. Scope of Works (Brief overview)',
      '5. Tender Submission Details:',
      '   - Closing Date and Time',
      '   - Submission Address/Method',
      '   - Required Number of Copies',
      '6. Tender Validity Period (typically 60-90 days)',
      '7. Pre-Tender Meeting Details (if applicable)',
      '8. Site Visit Information',
      '9. Tender Documents Available:',
      '   - List of all documents included',
      '   - How to obtain documents',
      '10. Eligibility Criteria',
      '11. Language of Tender',
      '12. Currency Requirements',
      '13. Tender Security/Bond Requirements',
      '14. Contact Person for Queries',
      '15. Evaluation Criteria Overview'
    ]
  },
  'Conditions of Tendering': {
    title: 'Conditions of Tendering Template',
    sections: [
      '1. Interpretation and Definitions',
      '2. Tender Documents:',
      '   - List of documents forming the tender',
      '   - Order of precedence',
      '3. Examination of Documents and Site',
      '4. Tender Pricing:',
      '   - Basis of pricing (lump sum, unit rates, etc.)',
      '   - Currency and payment terms',
      '5. Tender Validity Period',
      '6. Tender Security Requirements:',
      '   - Amount and form',
      '   - Validity period',
      '7. Submission Requirements:',
      '   - Format and number of copies',
      '   - Deadline and method',
      '8. Late Tenders Policy',
      '9. Tender Opening Procedures',
      '10. Clarifications and Amendments',
      '11. Alternative Proposals',
      '12. Evaluation Process',
      '13. Award Criteria',
      '14. Notification of Award',
      '15. Debriefing Rights',
      '16. Contract Formation Process'
    ]
  },
  'General Conditions of Contract': {
    title: 'General Conditions of Contract Template',
    sections: [
      '1. Definitions and Interpretation',
      '2. Contract Documents and Priority',
      '3. Communications and Notices',
      '4. The Employer\'s Obligations',
      '5. The Contractor\'s Obligations',
      '6. Time for Completion:',
      '   - Commencement date',
      '   - Completion dates',
      '   - Extensions of time',
      '7. Quality and Workmanship Standards',
      '8. Contract Price and Payment:',
      '   - Payment schedule',
      '   - Variations',
      '   - Price adjustments',
      '9. Insurance Requirements',
      '10. Performance Security',
      '11. Site Access and Possession',
      '12. Health, Safety and Environment',
      '13. Variations and Change Orders',
      '14. Claims and Disputes Resolution',
      '15. Default and Termination',
      '16. Force Majeure',
      '17. Warranties and Defects Liability',
      '18. Intellectual Property Rights'
    ]
  },
  'Contract Schedules': {
    title: 'Contract Schedules Template',
    sections: [
      '1. Schedule of Works/Scope',
      '2. Programme/Timeline',
      '3. Price Schedule',
      '4. Payment Schedule/Milestones',
      '5. Key Personnel and Subcontractors',
      '6. Materials and Equipment Schedule',
      '7. Insurance Requirements Schedule',
      '8. Performance Bond Details',
      '9. Testing and Commissioning Schedule',
      '10. Quality Assurance Plan',
      '11. Health and Safety Plan',
      '12. Environmental Management Plan',
      '13. Document Submission Schedule',
      '14. As-Built Documentation Requirements',
      '15. Maintenance Manual Requirements'
    ]
  },
  'Tender Form': {
    title: 'Tender Form Template',
    sections: [
      '1. Tender Identification:',
      '   - Tender reference number',
      '   - Project name',
      '2. Tenderer Details:',
      '   - Company name and registration',
      '   - Address and contact details',
      '   - Tax identification number',
      '3. Tender Declaration:',
      '   - Receipt and examination of documents',
      '   - Site inspection confirmation',
      '4. Tender Price:',
      '   - Total tender sum',
      '   - Currency',
      '   - Breakdown if required',
      '5. Programme:',
      '   - Proposed commencement date',
      '   - Completion period',
      '6. Tender Validity Period',
      '7. Compliance Statements:',
      '   - Technical compliance',
      '   - Financial compliance',
      '8. Declarations:',
      '   - No conflicts of interest',
      '   - No collusion',
      '9. Authorized Signatory Details',
      '10. Company Seal/Stamp',
      '11. Date of Submission'
    ]
  },
  'Schedules of Monetary Sums': {
    title: 'Schedules of Monetary Sums Template',
    sections: [
      '1. Preliminaries and General Items:',
      '   - Site establishment costs',
      '   - Management and supervision',
      '   - Temporary works',
      '2. Insurance and Bonds:',
      '   - Insurance premiums',
      '   - Performance bond costs',
      '3. Labour Costs:',
      '   - Skilled labour rates',
      '   - Unskilled labour rates',
      '   - Specialist labour',
      '4. Plant and Equipment:',
      '   - Hire rates',
      '   - Operating costs',
      '5. Materials Schedule:',
      '   - Unit rates for major materials',
      '   - Delivery and handling costs',
      '6. Daywork Rates',
      '7. Contingency Sums',
      '8. Provisional Sums',
      '9. Price Adjustment Formulae',
      '10. Currency Exchange Rates (if applicable)'
    ]
  },
  'Tender Schedules': {
    title: 'Tender Schedules Template',
    sections: [
      '1. Schedule of Quantities:',
      '   - Trade breakdown',
      '   - Item descriptions',
      '   - Quantities',
      '   - Unit rates',
      '2. Schedule of Rates',
      '3. Activity Schedule',
      '4. Resource Schedule:',
      '   - Labour resources',
      '   - Plant and equipment',
      '   - Materials',
      '5. Subcontractor Schedule',
      '6. Variations Schedule',
      '7. Time-Related Costs',
      '8. Daywork Schedule',
      '9. Testing Schedule',
      '10. Defects Correction Period Schedule'
    ]
  },
  'Technical Specifications': {
    title: 'Technical Specifications Template',
    sections: [
      '1. General Requirements:',
      '   - Scope of specifications',
      '   - Referenced standards and codes',
      '2. Materials Specifications:',
      '   - Quality standards',
      '   - Performance requirements',
      '   - Testing requirements',
      '3. Workmanship Standards:',
      '   - Installation methods',
      '   - Quality control procedures',
      '4. Trade-Specific Specifications:',
      '   - Concrete works',
      '   - Masonry',
      '   - Structural steel',
      '   - Finishes',
      '   - MEP systems',
      '5. Performance Criteria',
      '6. Testing and Commissioning:',
      '   - Test procedures',
      '   - Acceptance criteria',
      '7. Environmental Requirements',
      '8. Health and Safety Requirements',
      '9. Quality Assurance/Quality Control',
      '10. Documentation Requirements:',
      '    - Test certificates',
      '    - Material approvals',
      '    - As-built drawings'
    ]
  },
  'Technical Schedules': {
    title: 'Technical Schedules Template',
    sections: [
      '1. Materials Schedule:',
      '   - Approved manufacturers',
      '   - Material specifications',
      '   - Submittal requirements',
      '2. Equipment Schedule:',
      '   - Equipment list',
      '   - Technical data sheets',
      '   - Performance requirements',
      '3. Testing Schedule:',
      '   - Test types and frequency',
      '   - Acceptance criteria',
      '4. Inspection Schedule:',
      '   - Hold points',
      '   - Witness points',
      '5. Submittal Schedule:',
      '   - Shop drawings',
      '   - Method statements',
      '   - Material samples',
      '6. Commissioning Schedule',
      '7. Training Requirements',
      '8. O&M Manual Contents',
      '9. Warranty Schedule',
      '10. Maintenance Schedule'
    ]
  },
  'Drawings': {
    title: 'Drawings Requirements Template',
    sections: [
      '1. Drawing List and Index',
      '2. General Arrangement Drawings',
      '3. Architectural Drawings:',
      '   - Site plans',
      '   - Floor plans',
      '   - Elevations',
      '   - Sections',
      '   - Details',
      '4. Structural Drawings:',
      '   - Foundation plans',
      '   - Framing plans',
      '   - Structural details',
      '5. MEP Drawings:',
      '   - Mechanical systems',
      '   - Electrical systems',
      '   - Plumbing systems',
      '6. Landscape Drawings',
      '7. Drawing Standards:',
      '   - Scale requirements',
      '   - Annotation standards',
      '   - Revision control',
      '8. CAD File Requirements (if applicable)',
      '9. Drawing Submission Schedule'
    ]
  },
  'Bills of Quantities': {
    title: 'Bills of Quantities Template',
    sections: [
      '1. Preliminary Items:',
      '   - Project particulars',
      '   - Site facilities',
      '   - Temporary works',
      '   - Management and supervision',
      '2. Measured Works:',
      '   - Demolition and site clearance',
      '   - Earthworks and excavation',
      '   - Concrete works',
      '   - Masonry',
      '   - Structural steelwork',
      '   - Roofing',
      '   - Doors and windows',
      '   - Finishes',
      '   - MEP installations',
      '3. Format for Each Item:',
      '   - Item number',
      '   - Description',
      '   - Unit of measurement',
      '   - Quantity',
      '   - Rate (to be filled by tenderer)',
      '   - Amount (to be calculated)',
      '4. Provisional Sums',
      '5. Prime Cost Sums',
      '6. Daywork Provisions',
      '7. Summary of Totals:',
      '   - Total for each section',
      '   - Grand total',
      '8. Measurement Rules and Standards'
    ]
  }
};

export function DocumentTemplateDialog({ open, onOpenChange, documentName }: DocumentTemplateDialogProps) {
  const template = DOCUMENT_TEMPLATES[documentName];

  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{template.title}</DialogTitle>
          <DialogDescription>
            This template outlines the typical content and structure for this document
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {template.sections.map((section, index) => (
              <div key={index} className="text-sm">
                {section.startsWith('   ') ? (
                  <p className="ml-6 text-muted-foreground">{section.trim()}</p>
                ) : (
                  <p className="font-medium text-foreground">{section}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
