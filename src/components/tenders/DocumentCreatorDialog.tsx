import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';

interface DocumentCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  tenderId: string;
  projectData?: any;
  tenderData?: any;
  existingDocumentId?: string;
  onDocumentSaved: (docData: any) => void;
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
}

const getTemplateWithData = (docName: string, projectData: any, tenderData: any): DocumentSection[] => {
  const formatDate = (date: string) => {
    if (!date) return '[DATE]';
    return new Date(date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const templates: Record<string, DocumentSection[]> = {
    'Notice to Tenderers': [
      { id: '1', title: 'Project Title', content: tenderData?.title || projectData?.name || '[Project Title]' },
      { id: '2', title: 'Project Description', content: tenderData?.description || projectData?.description || '[Brief project description]' },
      { id: '3', title: 'Employer/Client Details', content: 'Name: [Client Name]\nAddress: [Client Address]\nContact: [Contact Number]' },
      { id: '4', title: 'Tender Reference Number', content: tenderData?.tender_reference_no || tenderData?.tender_id || '[Reference Number]' },
      { id: '5', title: 'Scope of Works', content: '[Provide brief overview of works to be undertaken]' },
      { id: '6', title: 'Tender Submission Details', content: 'Closing Date: [DATE]\nClosing Time: [Time]\nSubmission Method: [Email/Physical/Portal]\nNumber of Copies: 1 original + 1 copy' },
      { id: '7', title: 'Tender Validity Period', content: '90 days from closing date' },
      { id: '8', title: 'Pre-Tender Meeting', content: 'Date: [To be advised]\nTime: [To be advised]\nLocation: ' + (tenderData?.project_address || projectData?.address || '[Site Address]') },
      { id: '9', title: 'Site Visit Information', content: 'Site visits can be arranged by appointment.\nContact: [Contact Person]\nPhone: [Phone Number]' },
      { id: '10', title: 'Tender Documents', content: 'The following documents form part of this tender:\n- Notice to Tenderers\n- Conditions of Tendering\n- General Conditions of Contract\n- Contract Schedules\n- Tender Form\n- Technical Specifications\n- Drawings' },
      { id: '11', title: 'Eligibility Criteria', content: '[Specify any licensing, insurance, or experience requirements]' },
      { id: '12', title: 'Language and Currency', content: 'Language: English\nCurrency: Australian Dollars (AUD)' },
      { id: '13', title: 'Tender Security', content: 'Amount: [Specify amount or percentage]\nForm: Bank guarantee or insurance bond\nValidity: Until contract signing + 28 days' },
      { id: '14', title: 'Contact for Queries', content: '[Contact Person Name]\n[Title]\nEmail: [Email]\nPhone: [Phone]' },
      { id: '15', title: 'Evaluation Criteria', content: 'Tenders will be evaluated based on:\n- Price (40%)\n- Experience and capability (30%)\n- Methodology and programme (20%)\n- Resources (10%)' }
    ],
    'Conditions of Tendering': [
      { id: '1', title: 'Definitions and Interpretation', content: 'In these Conditions:\n"Employer" means ' + (tenderData?.client_name || '[Client Name]') + '\n"Project" means ' + (tenderData?.title || '[Project Name]') + '\n"Site" means ' + (tenderData?.project_address || '[Site Address]') },
      { id: '2', title: 'Tender Documents', content: 'The tender documents comprise:\n[List all documents]\n\nOrder of precedence:\n1. Tender Form\n2. Conditions of Tendering\n3. General Conditions\n4. Specifications\n5. Drawings' },
      { id: '3', title: 'Examination of Documents and Site', content: 'Tenderers must:\n- Examine all tender documents\n- Visit and inspect the site\n- Obtain all necessary information\n\nThe Employer assumes no responsibility for errors or omissions by tenderers.' },
      { id: '4', title: 'Tender Pricing', content: 'Basis: Lump sum\nCurrency: Australian Dollars (AUD)\nIncludes: All labour, materials, plant, overheads, and profit\nGST: To be shown separately' },
      { id: '5', title: 'Tender Validity', content: 'Tenders remain valid for 90 days from [DATE]' },
      { id: '6', title: 'Tender Security', content: '[Specify amount, form, and validity period of tender bond/guarantee]' },
      { id: '7', title: 'Submission Requirements', content: 'Format: [Electronic/Hard copy/Both]\nCopies: 1 original + 1 copy\nDeadline: [DATE] at [Time]\nAddress: [Submission address]' },
      { id: '8', title: 'Late Tenders', content: 'Tenders received after the closing time will not be accepted.' },
      { id: '9', title: 'Clarifications and Amendments', content: 'All queries must be submitted in writing by [date].\nAny amendments will be issued as formal addenda.' },
      { id: '10', title: 'Evaluation and Award', content: 'The Employer:\n- Is not bound to accept the lowest or any tender\n- May negotiate with any tenderer\n- May split the work among tenderers\n- Will notify all tenderers of the outcome' }
    ],
    'Tender Form': [
      { id: '1', title: 'Tender Identification', content: 'Tender Reference: [Reference]\nProject: [Project Name]' },
      { id: '2', title: 'Tenderer Details', content: 'Company Name: [Insert name]\nABN: [Insert ABN]\nAddress: [Insert address]\nContact Person: [Insert name]\nPhone: [Insert phone]\nEmail: [Insert email]' },
      { id: '3', title: 'Declaration', content: 'I/We hereby tender to execute and complete the works described as:\n[Project Name]\nlocated at [Site Address]\n\nI/We have:\n✓ Received and examined all tender documents\n✓ Visited and inspected the site\n✓ Made all necessary investigations' },
      { id: '4', title: 'Tender Sum', content: 'Total Tender Price (excluding GST): $[Insert amount]\nGST: $[Insert GST]\nTotal (including GST): $[Insert total]\n\nBudget Range: [Budget]' },
      { id: '5', title: 'Programme', content: 'Proposed Commencement: [DATE]\nCompletion Period: [weeks] weeks\nProposed Completion: [Date]' },
      { id: '6', title: 'Tender Validity', content: 'This tender remains open for acceptance for 90 days from [DATE]' },
      { id: '7', title: 'Compliance Statements', content: 'I/We confirm:\n✓ Technical compliance with all requirements\n✓ Financial capacity to complete the works\n✓ Appropriate licenses and insurances' },
      { id: '8', title: 'Declarations', content: 'I/We declare:\n✓ No conflicts of interest\n✓ No collusion with other tenderers\n✓ All information provided is true and correct' },
      { id: '9', title: 'Signature', content: 'Authorized Signatory: ________________\nName: ________________\nPosition: ________________\nDate: ________________\nCompany Seal/Stamp:' }
    ],
    'General Conditions of Contract': [
      { id: '1', title: 'Definitions and Interpretation', content: 'In this Contract:\n"Employer" means [Employer Name]\n"Contractor" means [Contractor Name]\n"Project" means [Project Name]\n"Site" means [Site Address]\n"Contract Price" means [Contract Sum]\n"Completion Date" means [Completion Date]' },
      { id: '2', title: 'Contract Documents', content: 'The following documents form the Contract and shall be read together:\n1. Contract Agreement\n2. General Conditions of Contract\n3. Special Conditions (if any)\n4. Specifications\n5. Drawings\n6. Bills of Quantities\n7. Tender Schedules\n\nIn case of discrepancy, the order of precedence shall be as listed above.' },
      { id: '3', title: 'Obligations of the Employer', content: 'The Employer shall:\n- Provide the Contractor with possession of the Site\n- Make payments in accordance with the Contract\n- Provide necessary design information and approvals\n- Appoint a Contract Administrator (if applicable)\n- Obtain all necessary statutory approvals\n- Provide access to utilities and services' },
      { id: '4', title: 'Obligations of the Contractor', content: 'The Contractor shall:\n- Execute and complete the Works in accordance with the Contract\n- Provide all labour, materials, plant, and equipment\n- Comply with all laws, regulations, and building codes\n- Complete the Works by [Completion Date]\n- Maintain the Site in a safe and orderly condition\n- Provide all required insurances\n- Engage competent subcontractors and tradespeople' },
      { id: '5', title: 'Time for Completion', content: 'Commencement Date: [DATE]\nCompletion Period: [X] weeks\nCompletion Date: [Date]\n\nTime shall be of the essence. The Contractor shall proceed with due diligence and expedition.\n\nExtensions of Time:\n- The Contractor may claim extension for delays caused by:\n  • Variations ordered by the Employer\n  • Adverse weather conditions\n  • Industrial disputes\n  • Force majeure events\n  • Late information or approvals from Employer' },
      { id: '6', title: 'Quality of Work and Materials', content: 'All work shall be:\n- Executed in a proper and workmanlike manner\n- In accordance with the specifications and drawings\n- Using materials of the quality and standards specified\n- Subject to inspection and testing by the Employer\n\nThe Contractor shall:\n- Provide samples for approval before procurement\n- Allow access for inspection at all reasonable times\n- Rectify defective work immediately\n- Maintain quality control procedures' },
      { id: '7', title: 'Contract Price and Payment', content: 'Contract Price: [Insert amount] (excluding GST)\nGST: [Insert GST amount]\nTotal (including GST): [Insert total]\n\nPayment Terms:\n- Progress claims submitted monthly\n- Payment within [30] days of receipt of claim\n- Retention: [5%] up to maximum of [10%]\n- Final payment upon Practical Completion\n- Release of retention at end of Defects Liability Period\n\nProgress Claims shall include:\n- Value of work completed\n- Materials on site\n- Variations (approved)\n- Less: Previous payments and retention' },
      { id: '8', title: 'Variations', content: 'The Employer may order variations to the Works.\n\nThe Contractor shall not proceed with any variation without written instruction.\n\nValuation of Variations:\n- Using rates in the Bills of Quantities (if applicable)\n- Using daywork rates (if no applicable rate)\n- By agreement between parties\n- As determined by the Contract Administrator\n\nThe Contractor shall:\n- Price variations within [7] days of instruction\n- Keep daywork records for verification\n- Claim extension of time if applicable' },
      { id: '9', title: 'Insurance', content: 'The Contractor shall effect and maintain:\n\n1. Contract Works Insurance:\n   - Full reinstatement value\n   - Covers fire, storm, theft, malicious damage\n   - Joint names policy\n\n2. Public Liability Insurance:\n   - Minimum $20,000,000 per occurrence\n   - Covers injury to persons and property damage\n\n3. Workers Compensation Insurance:\n   - As required by law\n\n4. Professional Indemnity (if design involved):\n   - Minimum as specified\n\nProof of insurance to be provided before commencement.' },
      { id: '10', title: 'Performance Security', content: 'The Contractor shall provide:\n- Performance Bond/Bank Guarantee\n- Amount: [X] (5% of Contract Price)\n- Form: Unconditional bank guarantee or insurance bond\n- Validity: Until [6] months after Practical Completion\n\nPurpose:\n- Security for due performance of the Contract\n- May be called upon for breach or default\n- Released upon satisfactory completion' },
      { id: '11', title: 'Site Access and Possession', content: 'The Employer shall give the Contractor possession of the Site on [DATE].\n\nThe Contractor shall:\n- Confine operations to the Site boundaries\n- Not interfere with adjoining properties\n- Provide and maintain site access and security\n- Obtain permits for road closures or footpath occupation\n- Restore Site boundaries upon completion\n\nWorking Hours:\n- [Specify permitted hours]\n- Noise restrictions apply outside these hours' },
      { id: '12', title: 'Health, Safety and Environment', content: 'The Contractor shall:\n- Comply with all OH&S legislation and regulations\n- Prepare and implement a Safety Management Plan\n- Conduct safety inductions for all site personnel\n- Provide necessary PPE and safety equipment\n- Report all incidents and near misses\n- Maintain site cleanliness and order\n- Implement environmental protection measures\n- Manage waste disposal and recycling\n- Control dust, noise, and pollution\n- Protect existing vegetation and services' },
      { id: '13', title: 'Claims and Disputes', content: 'Claims Process:\n- All claims must be submitted in writing within [28] days of the event\n- Include full particulars and supporting documentation\n- State basis of claim and amount claimed\n\nDispute Resolution:\n1. Negotiation between parties\n2. Mediation (if negotiation fails)\n3. Expert determination or arbitration\n4. Litigation (as last resort)\n\nEither party may initiate dispute resolution.\nWork shall continue during dispute resolution.' },
      { id: '14', title: 'Default and Termination', content: 'Employer may terminate if Contractor:\n- Abandons the Works\n- Fails to proceed with due diligence\n- Becomes insolvent\n- Breaches a material term\n\nContractor may terminate if Employer:\n- Fails to make payment\n- Suspends the Works without cause\n- Becomes insolvent\n\nNotice Period:\n- [14] days written notice specifying default\n- Opportunity to remedy default\n- Immediate termination for insolvency\n\nConsequences:\n- Payment for work completed\n- Return of unfixed materials\n- Completion by others at Contractor\'s cost (if Contractor default)' },
      { id: '15', title: 'Force Majeure', content: 'Neither party shall be liable for failure to perform due to events beyond reasonable control:\n- Acts of God (earthquakes, floods, storms)\n- War, terrorism, civil unrest\n- Strikes and industrial disputes (not involving the party)\n- Government restrictions or prohibitions\n- Pandemics or epidemics\n\nRelief:\n- Extension of time granted\n- No damages payable\n- Notice required within [7] days\n- Duty to mitigate effects' },
      { id: '16', title: 'Defects Liability', content: `Defects Liability Period: [12] months from Practical Completion\n\nThe Contractor shall:\n- Rectify all defects notified during this period\n- Attend to defects within [7] days of notice\n- Complete rectification within reasonable time\n- Bear all costs of rectification\n\nPractical Completion:\n- Issued when Works substantially complete\n- Minor defects listed for rectification\n- Final Completion after all defects remedied\n\nWarranty:\n- Works will be free from defects\n- Materials and workmanship of specified quality\n- Compliance with performance requirements` },
      { id: '17', title: 'Intellectual Property', content: 'Drawings and Specifications:\n- Remain property of the designer\n- Licensed to Contractor for this Project only\n- May not be used for other purposes\n- To be returned upon completion\n\nAs-Built Documentation:\n- Contractor to provide as-built drawings\n- Ownership transfers to Employer\n\nPatents and Proprietary Rights:\n- Contractor indemnifies Employer against claims\n- For infringement of patents or proprietary rights' },
      { id: '18', title: 'Governing Law', content: 'This Contract shall be governed by the laws of [State/Territory].\n\nThe parties submit to the jurisdiction of the courts of [State/Territory].' }
    ],
    'Contract Schedules': [
      { id: '1', title: 'Schedule of Work Stages', content: 'Stage 1: Site Establishment and Preliminaries\nDuration: [2] weeks\nCompletion: [Date]\n\nStage 2: Substructure and Foundations\nDuration: [4] weeks\nCompletion: [Date]\n\nStage 3: Superstructure and Frame\nDuration: [8] weeks\nCompletion: [Date]\n\nStage 4: External Envelope\nDuration: [6] weeks\nCompletion: [Date]\n\nStage 5: Internal Fit-out and Services\nDuration: [X] weeks\nCompletion: [Date]\n\nStage 6: Finishes and Completion\nDuration: [4] weeks\nCompletion: [DATE]' },
      { id: '2', title: 'Payment Schedule and Milestones', content: 'Total Contract Value: [Amount]\n\nPayment Milestones:\n\nDeposit (10%): [Amount]\nDue: Upon signing contract\n\nCompletion of Foundations (15%): [Amount]\nDue: Upon completion and inspection\n\nFrame Stage (20%): [Amount]\nDue: Upon lockup stage\n\nServices Rough-in (15%): [Amount]\nDue: Upon completion of services installation\n\nFit-out Stage (20%): [Amount]\nDue: Upon substantial internal completion\n\nPractical Completion (15%): [Amount]\nDue: Upon issue of Practical Completion Certificate\n\nFinal Payment (5%): [Amount]\nDue: End of defects liability period\n\nRetention: 5% held until defects liability period expires' },
      { id: '3', title: 'Key Personnel and Responsibilities', content: 'Project Manager:\nName: [Insert name]\nQualifications: [Insert qualifications]\nResponsibilities: Overall project delivery, coordination, client liaison\n\nSite Supervisor/Foreman:\nName: [Insert name]\nQualifications: [Insert qualifications]\nResponsibilities: Day-to-day site management, safety compliance, quality control\n\nSafety Officer:\nName: [Insert name]\nQualifications: [Insert qualifications]\nResponsibilities: OH&S compliance, safety inspections, incident management\n\nQuality Manager:\nName: [Insert name]\nQualifications: [Insert qualifications]\nResponsibilities: Quality assurance, testing, inspections\n\nThe Contractor shall not change key personnel without prior written approval from the Employer.' },
      { id: '4', title: 'Materials and Equipment Schedule', content: 'Major Materials:\n\nConcrete:\n- Supplier: [Name]\n- Grade: N20/N25/N32 as specified\n- Compliance: AS 1379\n\nStructural Steel:\n- Supplier: [Name]\n- Grade: AS/NZS 3679.1 Grade 300\n- Fabricator: [Name]\n\nBrickwork:\n- Supplier: [Name]\n- Type: [Clay/Concrete]\n- Colour: [Specify]\n\nTimber:\n- Supplier: [Name]\n- Species: [Specify]\n- Treatment: H3/H4 as required\n\nRoofing:\n- Supplier: [Name]\n- Type: [Material]\n- Colour: [Specify]\n\nWindows and Doors:\n- Supplier: [Name]\n- Specification: [Details]\n\nPlumbing Fixtures:\n- Supplier: [Name]\n- Brand: [Specify]\n\nElectrical Fixtures:\n- Supplier: [Name]\n- Brand: [Specify]\n\nAll materials subject to approval before ordering.' },
      { id: '5', title: 'Insurance Schedule', content: 'Contract Works Insurance:\nInsurer: [Name]\nPolicy Number: [Number]\nSum Insured: [Amount] (120% of contract value)\nExcess: $[Amount]\nPeriod: From commencement to practical completion + [6] months\n\nPublic Liability Insurance:\nInsurer: [Name]\nPolicy Number: [Number]\nCover: $20,000,000 per occurrence\nExcess: $[Amount]\nPeriod: Duration of contract\n\nWorkers Compensation:\nInsurer: [Name]\nPolicy Number: [Number]\nCover: As per statutory requirements\nPeriod: Duration of contract\n\nProfessional Indemnity (if applicable):\nInsurer: [Name]\nPolicy Number: [Number]\nCover: $[Amount]\nPeriod: [X] years from completion\n\nCertificates of Currency to be provided before commencement and upon renewal.' },
      { id: '6', title: 'Performance Bond Details', content: 'Bond Type: Unconditional Bank Guarantee\nIssuing Bank: [Bank Name]\nBond Number: [Number]\nAmount: [Amount] (5% of Contract Price)\nBeneficiary: [Employer Name]\nExpiry Date: [6 months after Practical Completion]\n\nConditions:\n- Unconditional on demand\n- No requirement to first pursue Contractor\n- Extended if contract extended\n- Reduced progressively with satisfactory performance\n- Released upon Final Completion Certificate\n\nClaims:\n- May be called for breach of contract\n- For rectification of defects\n- For delay damages' },
      { id: '7', title: 'Testing and Commissioning Schedule', content: 'Pre-Commissioning Tests:\n- Concrete strength tests (7-day and 28-day)\n- Structural inspections at key stages\n- Waterproofing tests\n- Services pressure tests\n\nCommissioning:\n- HVAC system balancing and commissioning\n- Electrical testing and certification\n- Hydraulic pressure testing\n- Fire services testing\n- Building automation commissioning\n\nPractical Completion Requirements:\n- All systems operational\n- All tests passed\n- Defects list agreed\n- As-built documentation provided\n- Operations and maintenance manuals submitted\n- Training completed\n\nOccupancy Certificate:\n- Final inspections by certifier\n- Compliance with Building Code\n- All outstanding items completed' },
      { id: '8', title: 'Quality Assurance Plan', content: 'Quality Management System:\n- ISO 9001 certification (or equivalent)\n- Quality Policy and Objectives\n- Documented procedures\n\nInspection and Test Plan:\n- Hold Points for critical works\n- Witness Points for key inspections\n- Material testing requirements\n- Workmanship standards\n\nDocumentation:\n- Test certificates\n- Material compliance certificates\n- Inspection records\n- Non-conformance reports\n- Corrective action records\n\nQuality Control:\n- Daily site inspections\n- Weekly toolbox meetings\n- Monthly quality reviews\n- Independent testing\n\nSupplier Management:\n- Approved supplier lists\n- Material approval procedures\n- Supplier quality requirements' },
      { id: '9', title: 'Health and Safety Plan', content: 'Project: [Project Name]\nLocation: [Site Address]\n\nSafety Management System:\n- Company safety policy\n- Site-specific safe work method statements\n- Risk assessments for all high-risk activities\n\nSite Induction:\n- Mandatory for all site personnel and visitors\n- Covers site rules, emergency procedures, hazards\n\nPPE Requirements:\n- Hard hats, safety boots, high-vis vests (minimum)\n- Additional PPE as required by task\n\nSafety Inspections:\n- Daily pre-start safety checks\n- Weekly formal inspections\n- Immediate rectification of hazards\n\nIncident Management:\n- All incidents and near-misses to be reported\n- Investigation and corrective actions\n- Reporting to authorities as required\n\nEmergency Procedures:\n- Assembly point: [Location]\n- First aid: [Location and contact]\n- Emergency contacts: [Numbers]' },
      { id: '10', title: 'Environmental Management Plan', content: 'Environmental Policy:\n- Minimize environmental impact\n- Comply with all environmental legislation\n- Prevent pollution\n\nWaste Management:\n- Reduce, reuse, recycle principle\n- Segregate waste on site\n- Licensed waste removal contractors\n- Waste tracking and reporting\n\nErosion and Sediment Control:\n- Sediment fences and barriers\n- Stormwater management\n- Regular inspection and maintenance\n\nDust and Noise Control:\n- Water spraying for dust suppression\n- Noise restrictions outside permitted hours\n- Complaints management procedure\n\nHazardous Materials:\n- Asbestos management (if present)\n- Contaminated soil management\n- Proper storage and handling\n\nFlora and Fauna Protection:\n- Tree protection zones\n- Vegetation management\n- Wildlife protection measures' },
      { id: '11', title: 'Document Submission Schedule', content: 'Before Commencement:\n- Insurance certificates\n- Performance bond\n- Construction programme\n- Safety management plan\n- Quality management plan\n- Environmental management plan\n\nDuring Construction (as applicable):\n- Shop drawings\n- Material samples and specifications\n- Method statements\n- Test results and certificates\n- Progress reports (monthly)\n- Variation proposals\n\nAt Practical Completion:\n- As-built drawings\n- Operations and maintenance manuals\n- Warranty documents\n- Test certificates\n- Commissioning reports\n\nAt Final Completion:\n- Final claim\n- Defects rectification records\n- Statutory compliance certificates\n- Handover documentation' },
      { id: '12', title: 'As-Built Documentation Requirements', content: 'Drawings:\n- Updated to show all changes from original design\n- Mark-up or CAD format\n- Coordinated with all trades\n- Include all services locations\n\nOperations and Maintenance Manuals:\n- Equipment specifications\n- Operating instructions\n- Maintenance schedules\n- Spare parts lists\n- Warranty information\n- Emergency procedures\n\nCompliance Documentation:\n- Building certificates\n- Electrical compliance\n- Plumbing compliance\n- Fire services certification\n- Energy efficiency compliance\n\nFormat:\n- [3] hard copies\n- [2] electronic copies (PDF)\n- Submitted [14] days before Practical Completion' },
      { id: '13', title: 'Warranty Schedule', content: 'Defects Liability Period: 12 months\nCommencing: Date of Practical Completion\n\nStandard Warranties:\n- Workmanship: 12 months\n- Structural elements: [7] years\n- Waterproofing: [7] years\n- Major equipment: As per manufacturer\n\nExtended Warranties (if applicable):\n- Roofing system: [10-15] years\n- Windows and doors: [5-10] years\n- HVAC equipment: [5] years\n- Lifts/elevators: [12] months\n\nManufacturer Warranties:\n- To be assigned to Employer\n- Original warranty documents provided\n\nWarranty Claims:\n- Notified in writing\n- Response within [7] days\n- Rectification within reasonable time\n- All costs borne by Contractor' },
      { id: '14', title: 'Maintenance Schedule', content: 'Regular Maintenance Requirements:\n\nDaily:\n- Site cleaning\n- Waste removal\n- Safety checks\n\nWeekly:\n- Equipment servicing\n- Temporary works inspection\n- Housekeeping review\n\nMonthly:\n- Safety equipment testing\n- Scaffolding inspections\n- Temporary services check\n\nPost-Completion:\n- Provide maintenance schedule for completed works\n- Include all systems and equipment\n- Specify intervals and procedures\n- Identify service providers\n\nDefects Liability Period:\n- Regular inspections by Contractor\n- Preventive maintenance\n- Respond to defects notifications\n- Keep records of all maintenance' }
    ],
    'Schedules of Monetary Sums': [
      { id: '1', title: 'Preliminaries and General Items', content: `Site Establishment:\nSite office and facilities: $[Amount]\nTemporary fencing and hoarding: $[Amount]\nSite signage: $[Amount]\nTemporary services (power, water): $[Amount]\nSite access and hardstand: $[Amount]\nWaste management facilities: $[Amount]\nSubtotal: $[Total]\n\nProject Management:\nProject manager (${tenderData?.completion_weeks || 'X'} weeks @ $[Rate]/week): $[Amount]\nSite supervisor (${tenderData?.completion_weeks || 'X'} weeks @ $[Rate]/week): $[Amount]\nSafety officer: $[Amount]\nQuality manager: $[Amount]\nAdmin support: $[Amount]\nSubtotal: $[Total]\n\nTemporary Works:\nScaffolding: $[Amount]\nPropping and shoring: $[Amount]\nTemporary protection: $[Amount]\nWeather protection: $[Amount]\nSubtotal: $[Total]\n\nSite Operations:\nSite cleaning: $[Amount]\nSecurity: $[Amount]\nTraffic management: $[Amount]\nDust and noise control: $[Amount]\nSubtotal: $[Total]\n\nTOTAL PRELIMINARIES: $[Grand Total]` },
      { id: '2', title: 'Insurance and Bonds', content: `Contract Works Insurance:\nPremium (${tenderData?.budget ? Number(tenderData.budget) * 1.2 : '[Amount]'} @ [0.5]%): $[Amount]\nExcess: $[Amount]\n\nPublic Liability Insurance:\nAnnual premium: $[Amount]\nProject allocation: $[Amount]\n\nWorkers Compensation:\nEstimated premium: $[Amount]\nProject allocation: $[Amount]\n\nPerformance Bond:\nBond cost (${tenderData?.budget ? (Number(tenderData.budget) * 0.05) : '[Amount]'} @ [1-2]%): $[Amount]\n\nProfessional Indemnity (if applicable):\nPremium allocation: $[Amount]\n\nTOTAL INSURANCE & BONDS: $[Total]` },
      { id: '3', title: 'Labour Rates', content: 'Skilled Labour:\nCarpenter: $[Rate]/hour\nBricklayer: $[Rate]/hour\nPlumber: $[Rate]/hour\nElectrician: $[Rate]/hour\nPainter: $[Rate]/hour\nTiler: $[Rate]/hour\nPlasterer: $[Rate]/hour\nSteel fixer: $[Rate]/hour\nWelder: $[Rate]/hour\n\nSemi-Skilled Labour:\nCarpenter assistant: $[Rate]/hour\nGeneral tradesperson: $[Rate]/hour\n\nUnskilled Labour:\nLabourer: $[Rate]/hour\n\nSpecialist Labour:\nCrane operator: $[Rate]/hour\nPlant operator: $[Rate]/hour\nSurveyor: $[Rate]/hour\n\nRates include:\n- Base wage\n- Superannuation\n- Workers compensation\n- Annual leave and sick leave\n- Public holidays\n- Allowances\n- Contractor margin ([X]%)' },
      { id: '4', title: 'Plant and Equipment Hire', content: 'Earthmoving:\nExcavator (20T): $[Rate]/day\nBobcat/Skid steer: $[Rate]/day\nTipper truck: $[Rate]/day\nRoller/Compactor: $[Rate]/day\n\nLifting Equipment:\nMobile crane: $[Rate]/hour (minimum [4] hours)\nTower crane: $[Rate]/week\nScissor lift: $[Rate]/day\nBoom lift: $[Rate]/day\nFork lift: $[Rate]/day\n\nConcrete Equipment:\nConcrete pump: $[Rate]/hour\nConcrete vibrator: $[Rate]/day\nPower screed: $[Rate]/day\n\nTools and Equipment:\nPower tools: $[Rate]/day\nCompressor: $[Rate]/day\nGenerator: $[Rate]/day\nWelding equipment: $[Rate]/day\n\nRates include:\n- Equipment hire\n- Operator (where applicable)\n- Fuel\n- Maintenance\n- Insurance\n- Delivery and pickup' },
      { id: '5', title: 'Materials Schedule - Major Items', content: 'Concrete:\nN20 (footings): $[Rate]/m³\nN25 (slabs): $[Rate]/m³\nN32 (structural): $[Rate]/m³\nPump hire additional: $[Rate]/m³\n\nReinforcement:\nSteel mesh (SL82): $[Rate]/m²\nReinforcing bar: $[Rate]/tonne\nFabrication and fix: $[Rate]/tonne\n\nBrickwork:\nFace bricks: $[Rate]/1000\nCommon bricks: $[Rate]/1000\nMortar: $[Rate]/m³\nWall ties and accessories: $[Rate]/m²\n\nTimber:\nFraming timber (90x45 MGP10): $[Rate]/LM\nTreated pine (H3): $[Rate]/LM\nStructural LVL: $[Rate]/LM\nPlywood (17mm structural): $[Rate]/sheet\n\nSteel:\nStructural sections: $[Rate]/tonne\nMesh decking: $[Rate]/m²\nPurlins and girts: $[Rate]/LM\n\nRates include:\n- Materials ex-supplier\n- Delivery to site\n- Unloading and handling\n- Normal wastage ([5-10]%)' },
      { id: '6', title: 'Daywork Rates', content: 'Labour Daywork (where applicable):\nSkilled tradesperson: $[Rate]/hour\nSemi-skilled: $[Rate]/hour\nLabourer: $[Rate]/hour\n\nPlant Daywork:\nExcavator: $[Rate]/hour\nBobcat: $[Rate]/hour\nCrane: $[Rate]/hour\nLifting equipment: $[Rate]/hour\n\nMaterials:\nSupplied at cost plus [X]% markup\n\nConditions:\n- Daywork only for unforeseen work\n- Must be authorized in writing\n- Records kept and signed daily\n- Submitted with next progress claim\n\nRates exclude:\n- GST (added separately)\n- Contractor overhead and profit on materials\n\nRates include:\n- All wage components\n- Insurance and statutory costs\n- Plant operating costs\n- Contractor overheads and margin' },
      { id: '7', title: 'Provisional Sums', content: `Provisional Sum for Contingencies: ${tenderData?.budget ? '$' + (Number(tenderData.budget) * 0.05).toLocaleString() : '$[Amount]'} (5% of contract value)\nPurpose: Unforeseen works, variations, site conditions\n\nProvisional Sum for Services Connections: $[Amount]\nPurpose: Water, sewer, power, gas connections\nActual costs to be verified\n\nProvisional Sum for Authority Fees: $[Amount]\nPurpose:\n- Building permit fees\n- Development approval fees\n- Compliance certificates\n- Other statutory fees\n\nProvisional Sum for Testing: $[Amount]\nPurpose:\n- Soil tests\n- Concrete tests\n- Structural inspections\n- Services commissioning\n\nProvisional Sum for Landscaping: $[Amount]\nPurpose: Site rehabilitation and landscaping\n\nConditions:\n- Actual costs substituted when known\n- Contractor entitled to margin on provisional sums: [X]%\n- Unused amounts omitted from final account' },
      { id: '8', title: 'Prime Cost Sums', content: 'PC Sum for Kitchen: $[Amount]\nIncludes: Cabinets, benchtops, appliances, installation\nContractor margin: [X]%\n\nPC Sum for Bathrooms: $[Amount]\nIncludes: Vanities, fixtures, accessories, installation\nContractor margin: [X]%\n\nPC Sum for Floor Coverings: $[Amount]\nIncludes: Carpet, tiles, timber flooring, installation\nContractor margin: [X]%\n\nPC Sum for Lighting: $[Amount]\nIncludes: Internal and external light fittings, installation\nContractor margin: [X]%\n\nPC Sum for Air Conditioning: $[Amount]\nIncludes: Equipment, ductwork, installation, commissioning\nContractor margin: [X]%\n\nConditions:\n- Client to select items\n- Contractor to advise on compatibility\n- Adjustment if selection varies from PC\n- Contractor entitled to stated margin\n- Includes installation and connection' },
      { id: '9', title: 'Nominated Subcontractors', content: 'Hydraulics:\nSubcontractor: [Name/To be nominated]\nScope: All plumbing and drainage works\nEstimated value: $[Amount]\n\nElectrical:\nSubcontractor: [Name/To be nominated]\nScope: All electrical works and communications\nEstimated value: $[Amount]\n\nMechanical Services:\nSubcontractor: [Name/To be nominated]\nScope: HVAC installation and commissioning\nEstimated value: $[Amount]\n\nFire Services:\nSubcontractor: [Name/To be nominated]\nScope: Fire detection and suppression systems\nEstimated value: $[Amount]\n\nLifts (if applicable):\nSubcontractor: [Name/To be nominated]\nScope: Lift supply, installation, commissioning\nEstimated value: $[Amount]\n\nConditions:\n- Contractor to coordinate and supervise\n- Payment through main contractor\n- Contractor margin: [X]%\n- All warranties assigned to Employer' },
      { id: '10', title: 'Price Adjustment Formulae', content: 'Rise and Fall Provisions (if applicable):\n\nBase Date: [Date of tender]\nAdjustment Date: [Monthly/Quarterly]\n\nIndices Used:\n- Labour: [Relevant wage index]\n- Materials: [Relevant materials index]\n- Plant: [Relevant plant index]\n\nFormula:\nP = P₀ × (0.15 + 0.50 × (L/L₀) + 0.25 × (M/M₀) + 0.10 × (E/E₀))\n\nWhere:\nP = Adjusted price\nP₀ = Base price\nL = Current labour index\nL₀ = Base labour index\nM = Current materials index\nM₀ = Base materials index\nE = Current plant index\nE₀ = Base plant index\n\nConditions:\n- Applied to work completed in period\n- Minimum threshold: [X]% variation\n- Both increases and decreases applied\n- Excludes provisional and PC sums' },
      { id: '11', title: 'Currency and GST', content: 'All amounts are in Australian Dollars (AUD)\n\nGST Treatment:\n- All prices exclude GST unless stated\n- GST added to all taxable supplies\n- Tax invoices issued with progress claims\n\nContract Price (excluding GST): $[Amount]\nGST (10%): $[Amount]\nTotal (including GST): $[Amount]\n\nPayment Terms:\n- Progress claims submitted monthly\n- Payment due within [30] days\n- Interest on late payment: [X]% p.a.\n\nRetention:\n- [5]% retention on each progress payment\n- Maximum retention: $[Amount] (10% of contract)\n- Half released at Practical Completion\n- Remainder at end of defects period' }
    ],
    'Tender Schedules': [
      { id: '1', title: 'Schedule of Quantities - Summary', content: 'Project: [Project Name]\nLocation: [Site Address]\nTotal Budget: $[Amount]\n\nTrade Breakdown:\n\n1. Preliminaries and General: $[Amount] ([%])\n2. Demolition and Site Clearance: $[Amount] ([%])\n3. Excavation and Earthworks: $[Amount] ([%])\n4. Concrete Works: $[Amount] ([%])\n5. Masonry: $[Amount] ([%])\n6. Structural Steel: $[Amount] ([%])\n7. Carpentry and Joinery: $[Amount] ([%])\n8. Roofing and Cladding: $[Amount] ([%])\n9. Windows and Doors: $[Amount] ([%])\n10. Plasterboard and Ceilings: $[Amount] ([%])\n11. Finishes (Painting, Tiling): $[Amount] ([%])\n12. Hydraulics: $[Amount] ([%])\n13. Electrical: $[Amount] ([%])\n14. Mechanical Services: $[Amount] ([%])\n15. External Works: $[Amount] ([%])\n\nSubtotal: $[Total]\nProvisional Sums: $[Amount]\nContingency: $[Amount]\n\nTOTAL (Excl GST): $[Amount]\nGST: $[Amount]\nTOTAL (Incl GST): $[Amount]' },
      { id: '2', title: 'Activity Schedule', content: 'Item | Description | Start Week | Duration | Completion | Value\n\n1 | Site Establishment | Week 1 | 1 week | [Date] | $[Amount]\n2 | Demolition | Week 1 | 2 weeks | [Date] | $[Amount]\n3 | Excavation | Week 2 | 2 weeks | [Date] | $[Amount]\n4 | Footings | Week 3 | 2 weeks | [Date] | $[Amount]\n5 | Slab | Week 5 | 1 week | [Date] | $[Amount]\n6 | Frame | Week 6 | 4 weeks | [Date] | $[Amount]\n7 | Roof | Week 10 | 2 weeks | [Date] | $[Amount]\n8 | External Cladding | Week 11 | 3 weeks | [Date] | $[Amount]\n9 | Windows/Doors | Week 12 | 2 weeks | [Date] | $[Amount]\n10 | Services Rough-in | Week 14 | 4 weeks | [Date] | $[Amount]\n11 | Plasterboard | Week 18 | 3 weeks | [Date] | $[Amount]\n12 | Internal Fit-out | Week 21 | 6 weeks | [Date] | $[Amount]\n13 | Finishes | Week 27 | 6 weeks | [Date] | $[Amount]\n14 | External Works | Week 30 | 4 weeks | [Date] | $[Amount]\n15 | Final Clean & Handover | Week [X] | 1 week | [Date] | $[Amount]\n\nTotal Contract Duration: [X] weeks\nTotal Value: $[Amount]' },
      { id: '3', title: 'Resource Schedule', content: 'Labour Resources:\n\nPeak Labour: [Number] personnel\nAverage Labour: [Number] personnel\n\nWeek 1-4 (Site Establishment & Demolition):\n- Project Manager: 1\n- Site Supervisor: 1\n- Labourers: 4-6\n- Excavator operator: 1\n\nWeek 5-10 (Concrete & Structure):\n- Concreters: 4-6\n- Steel fixers: 2-3\n- Carpenters: 6-8\n- Labourers: 4-6\n\nWeek 11-18 (Envelope & Services):\n- Bricklayers: 3-4\n- Carpenters: 4-6\n- Roofers: 2-3\n- Plumbers: 2-3\n- Electricians: 2-3\n\nWeek 19-30 (Fit-out & Finishes):\n- Carpenters: 4-6\n- Plasterers: 3-4\n- Painters: 3-4\n- Tilers: 2-3\n- Cabinet makers: 2\n- Plumbers: 2\n- Electricians: 2\n\nWeek 31+ (Final Completion):\n- All trades as required\n- Cleaning crew: 2-3' },
      { id: '4', title: 'Plant and Equipment Schedule', content: 'Major Plant Items:\n\nEarthworks Phase:\n- 20T Excavator: [X] weeks\n- Bobcat: [X] weeks\n- Tipper trucks: [X] trips\n- Roller/Compactor: [X] days\n\nStructural Phase:\n- Mobile crane (50T): [X] days\n- Concrete pump: [X] pours\n- Scaffolding: [X] m² for [X] weeks\n\nFit-out Phase:\n- Scissor lifts: [X] units for [X] weeks\n- Air compressor: Continuous\n- Generators: As required\n\nContinuous:\n- Site amenities\n- Safety barriers and fencing\n- Temporary power and water\n\nDelivery Coordination:\n- All major equipment bookings confirmed\n- Delivery schedule coordinated with programme\n- Access routes and storage areas identified' },
      { id: '5', title: 'Subcontractor Schedule', content: 'Nominated/Proposed Subcontractors:\n\nHydraulics:\nCompany: [Name]\nContact: [Details]\nValue: $[Amount]\nProgramme: Weeks [X-Y]\n\nElectrical:\nCompany: [Name]\nContact: [Details]\nValue: $[Amount]\nProgramme: Weeks [X-Y]\n\nMechanical:\nCompany: [Name]\nContact: [Details]\nValue: $[Amount]\nProgramme: Weeks [X-Y]\n\nFire Services:\nCompany: [Name]\nContact: [Details]\nValue: $[Amount]\nProgramme: Weeks [X-Y]\n\nSteel Fabrication:\nCompany: [Name]\nContact: [Details]\nValue: $[Amount]\nProgramme: Weeks [X-Y]\n\nKitchen:\nCompany: [Name]\nContact: [Details]\nValue: $[Amount]\nProgramme: Weeks [X-Y]\n\nAll subcontractors:\n- Hold appropriate licenses\n- Carry required insurance\n- Meet safety requirements\n- Accept contract conditions' },
      { id: '6', title: 'Variations Schedule', content: 'Variation Procedures:\n\n1. Client requests variation\n2. Contractor prepares quote within [7] days\n3. Quote includes:\n   - Description of work\n   - Price (using rates where applicable)\n   - Programme impact\n   - Required approvals\n4. Client approval required before proceeding\n5. Variation order issued\n6. Work proceeds\n7. Claim with next progress payment\n\nPricing Basis:\n- Bills of Quantities rates (where applicable)\n- Daywork rates (for minor works)\n- Quotation (for substantial changes)\n- Cost plus [X]% (if agreed)\n\nRate Schedule (from Bills of Quantities):\n[Extract relevant rates]\n\nVariation Log:\nVariation No. | Description | Date | Value | Status\n[To be completed during contract]' },
      { id: '7', title: 'Time-Related Costs', content: 'Site Preliminaries Per Week:\nSite establishment and maintenance: $[Amount]/week\nSite office rental: $[Amount]/week\nTemporary services: $[Amount]/week\nSite security: $[Amount]/week\nSite cleaning: $[Amount]/week\n\nManagement Costs Per Week:\nProject manager: $[Amount]/week\nSite supervisor: $[Amount]/week\nSafety officer: $[Amount]/week (part-time)\nAdmin support: $[Amount]/week\n\nTotal Weekly Running Costs: $[Amount]\n\nProgrammed Duration: [X] weeks\nTotal Time-Related Costs: $[Amount]\n\nExtension of Time Costs:\n- Liquidated damages: $[Amount]/week (if specified)\n- Additional preliminaries: $[Amount]/week\n- Extended overheads: $[Amount]/week\n\nEarly Completion Bonus (if applicable):\n- Bonus for completion ahead of programme\n- Rate: $[Amount]/week saved\n- Maximum bonus: $[Amount]' },
      { id: '8', title: 'Daywork Schedule', content: 'Labour Daywork Rates:\n\nSkilled Trades:\nCarpenter: $[Rate]/hour\nBricklayer: $[Rate]/hour\nPlumber: $[Rate]/hour\nElectrician: $[Rate]/hour\nPainter: $[Rate]/hour\nPlasterer: $[Rate]/hour\nTiler: $[Rate]/hour\n\nSemi-Skilled:\nTradesperson assistant: $[Rate]/hour\nGeneral tradesperson: $[Rate]/hour\n\nUnskilled:\nLabourer: $[Rate]/hour\n\nPlant Daywork Rates:\nExcavator (20T): $[Rate]/hour\nBobcat: $[Rate]/hour\nCrane (mobile): $[Rate]/hour (min 4 hours)\nScissor lift: $[Rate]/day\nBoom lift: $[Rate]/day\nConcrete pump: $[Rate]/hour\nCompressor: $[Rate]/day\nGenerator: $[Rate]/day\n\nMaterials:\nSupplied at cost plus [15]% markup\n\nConditions:\n- Rates include all statutory costs\n- Plant rates include operator and fuel\n- Records signed daily\n- Submitted with next progress claim' },
      { id: '9', title: 'Testing and Inspection Schedule', content: 'Mandatory Testing:\n\nConcrete:\n- Slump tests: Each pour\n- Compressive strength: [X] samples per 50m³\n- Testing at 7 and 28 days\nEstimated cost: $[Amount]\n\nStructural:\n- Footing inspections: Before concrete\n- Frame inspections: At key stages\n- Structural engineer reviews: [X] visits\nEstimated cost: $[Amount]\n\nServices:\n- Hydraulic pressure testing: All systems\n- Electrical testing and tagging: All circuits\n- HVAC commissioning: Complete system\n- Fire services testing: As per AS standards\nEstimated cost: $[Amount]\n\nCompliance:\n- Building surveyor inspections: [X] visits\n- Certifier final inspection: At completion\n- Occupancy certificate: Upon completion\nEstimated cost: $[Amount]\n\nTotal Testing Budget: $[Amount]\n\nSchedule:\n- Tests coordinated with programme\n- Results provided within [3] days\n- Defects rectified immediately' },
      { id: '10', title: 'Defects Correction Period Schedule', content: 'Defects Liability Period: 12 months\nCommencing: Date of Practical Completion\nExpiring: [12 months from PC]\n\nContractor Obligations:\n- Regular site inspections: Quarterly\n- Respond to defect notices: Within [7] days\n- Rectify defects: Within reasonable time\n- Final inspection: Before end of period\n\nDefect Categories:\n\nCritical (24-hour response):\n- Structural issues\n- Water leaks\n- Safety hazards\n- Essential services failure\n\nMajor (7-day response):\n- Building envelope defects\n- Significant finish defects\n- Non-essential services issues\n\nMinor (14-day response):\n- Cosmetic defects\n- Minor adjustments\n- Touch-up works\n\nWarranties:\n- Structural: [7] years\n- Waterproofing: [7] years\n- General workmanship: 12 months\n- Manufacturer warranties: As applicable\n\nRetention Release:\n- 50% at Practical Completion: $[Amount]\n- 50% at end of defects period: $[Amount]' }
    ],
    'Technical Specifications': [
      { id: '1', title: 'General Requirements', content: 'Scope:\nThese specifications cover all materials, workmanship, and standards required for [Project Name] located at [Site Address].\n\nApplicable Standards:\nAll work shall comply with:\n- National Construction Code (NCC)\n- Australian Standards (AS) and AS/NZS where referenced\n- Manufacturers specifications and recommendations\n- Local authority requirements\n- Environmental protection regulations\n\nQuality Standards:\n- All materials to be new, first quality, and fit for purpose\n- Workmanship to trade standards\n- Installation as per manufacturer recommendations\n- Compliance with Building Code of Australia\n\nSubmittals:\n- Material samples for approval before ordering\n- Product data sheets and specifications\n- Installation method statements\n- Test certificates and warranties\n\nSubstitutions:\n- Submit written request with equivalent specifications\n- Approval required before procurement\n- No cost or time implications to Employer' },
      { id: '2', title: 'Site Works and Earthworks', content: 'Site Clearance:\n- Remove all vegetation as marked on drawings\n- Protect trees to be retained\n- Remove topsoil and stockpile for reuse\n- Remove debris and rubbish from site\n\nExcavation:\n- Excavate to levels shown on drawings\n- Allow for temporary works and shoring\n- Dispose of unsuitable material\n- Import and compact approved fill material\n- Comply with AS 3798\n\nFill and Compaction:\n- Use approved fill material\n- Place in layers not exceeding 200mm\n- Compact to 95% maximum dry density (AS 1289)\n- Test compaction at 100m² intervals\n\nDrainage:\n- Install subsoil drainage as detailed\n- AG pipe in 20mm drainage aggregate\n- Connect to stormwater system\n- Test flow before backfilling\n\nRetaining Walls:\n- Construct as per structural drawings\n- Provide weep holes at 2m centers\n- Waterproof below ground\n- Drainage behind walls' },
      { id: '3', title: 'Concrete Works', content: 'General:\n- Comply with AS 1379 and AS 3600\n- Concrete supply from approved batch plant\n- Maximum aggregate size: 20mm (slabs), 14mm (columns)\n\nConcrete Grades:\n- Footings: N20\n- Slabs: N25\n- Structural columns/beams: N32\n- Exposed concrete: N32 with specific finish\n\nReinforcement:\n- Deformed bars to AS/NZS 4671\n- Mesh to AS/NZS 4671\n- Cover: 50mm footings, 20mm slabs, 40mm external\n- Tie all intersections\n- Support on bar chairs\n\nFormwork:\n- Rigid, true to line and level\n- Class 1, 2, 3, or 4 finish as specified\n- Oil release agent (not diesel)\n- Remove carefully to prevent damage\n\nPlacement:\n- Maximum slump: 120mm (or as specified)\n- Vibrate thoroughly\n- Do not pour in rain\n- Protect from direct sun and wind\n\nCuring:\n- Keep moist for minimum 7 days\n- Curing compound or wet hessian\n- No traffic until design strength achieved\n\nTesting:\n- Slump test: Each pour\n- Strength test: 1 per 50m³ or daily\n- Test at 7 and 28 days' },
      { id: '4', title: 'Masonry', content: 'Brickwork:\n- Clay bricks to AS 3700\n- Extruded, wire cut, unglazed\n- Face bricks: [Specify brand, type, color]\n- Common bricks: Standard quality\n\nMortar:\n- M3 mix (1:1:6) for general brickwork\n- M2 mix (1:0.5:4.5) for retaining walls\n- Comply with AS 3700\n- Consistent color and texture\n\nWorkmanship:\n- Flush mortar joints (or as specified)\n- Perpends aligned vertically\n- Bond as per drawings (stretcher/Flemish)\n- Control joints at 6m centers\n- Weep holes at 1200mm centers\n- Lintels as detailed\n\nCleaning:\n- Clean down with water and brush\n- No acid cleaning unless approved\n- Protect surrounding work\n\nBlockwork:\n- Concrete blocks to AS 2758.1\n- Standard blocks 390x190x190mm\n- Reinforced as per engineer details\n- Mortar to match brickwork\n- Fill cores with concrete where required' },
      { id: '5', title: 'Structural Steel', content: 'Materials:\n- Structural steel to AS/NZS 3679.1\n- Grade 300 unless otherwise specified\n- Bolts to AS/NZS 1252\n- Welding consumables to AS/NZS 1553\n\nFabrication:\n- In accordance with AS 4100\n- Shop drawings for approval\n- All connections detailed\n- Factory applied primer coat\n\nWelding:\n- Qualified welders to AS/NZS 1554.1\n- Full penetration butt welds\n- Fillet welds as specified\n- Grind smooth and paint\n- NDT testing as specified\n\nBolting:\n- High strength structural bolts\n- Fully tightened per AS 4100\n- Washers under nuts and bolt heads\n- Check bolt tension\n\nCorrosion Protection:\n- Clean and degrease\n- Prime coat: 2-pack epoxy primer\n- Finish coat: As specified\n- Galvanizing where specified\n- Paint after erection if required\n\nErection:\n- In accordance with AS 4100\n- Temporary bracing during construction\n- Check alignment and levels\n- Tighten all bolts progressively' },
      { id: '6', title: 'Carpentry and Joinery', content: 'Timber:\n- Seasoned hardwood or softwood as specified\n- Treated pine (H3) for external exposed\n- LVL/Engineered timber to manufacturer specs\n- Moisture content: Maximum 18%\n\nFraming:\n- Stud framing: 90x45mm @ 450-600mm centers\n- Top and bottom plates: 90x35mm\n- Noggings at mid-height\n- Lintels as per engineer details\n- Fixing to AS 1684\n\nFlooring:\n- Particleboard flooring: 19mm moisture resistant\n- Tongue and groove joints\n- Glue and screw at 200mm centers\n- Support on 90x45mm joists @ 450mm centers\n\nRoof:\n- Rafters/trusses as per engineer details\n- Battens: 50x50mm treated pine\n- Sarking or anticon blanket\n- Fascia and barge boards: Treated pine\n\nJoinery:\n- Hardwood or MDF as specified\n- Factory finished where possible\n- Mortise and tenon joints\n- Brass or stainless steel hardware\n- Prime and paint (3 coats)\n\nExternal Cladding:\n- Weatherboards: 150x19mm treated pine\n- Fix with stainless steel nails\n- Overlap minimum 25mm\n- Prime all surfaces before fixing\n- Caulk joints with flexible sealant' },
      { id: '7', title: 'Roofing and Cladding', content: 'Roof Covering:\n- Material: [Colorbond/Tile/Specify]\n- Color: [Specify]\n- Pitch: [Specify degrees]\n- Comply with AS 1562 (metal) or AS 2050 (tiles)\n\nMetal Roofing:\n- 0.42mm Colorbond or Zincalume\n- Concealed fixed system\n- Lap minimum 150mm\n- Seal laps with sealant\n- Fix to manufacturer recommendations\n- Flashings: Same material and color\n\nRoof Tiles:\n- Concrete or terracotta as specified\n- Fix every tile in accordance with AS 2050\n- Hip and ridge capping\n- Valley tiles or metal valley\n- Underlay and sarking\n\nGutters and Downpipes:\n- Material and color to match roof\n- Box gutters: 0.55mm\n- Eaves gutters: Quad or half-round\n- Downpipes: 90mm minimum\n- Falls minimum 1:200\n- Sumps and outlets as per plumber\n\nWall Cladding:\n- Material: [Specify - fibre cement, metal, etc.]\n- Fix to manufacturer recommendations\n- Weather seals at all penetrations\n- Expansion joints as required\n- Prime before fixing\n- Finish coat after installation' },
      { id: '8', title: 'Windows, Doors and Hardware', content: 'Windows:\n- Aluminum frames: [Specify brand/series]\n- Glazing: [6mm clear/4mm toughened/specify]\n- Color: [Powdercoat finish]\n- Hardware: Stainless steel\n- Comply with AS 2047\n- Thermally broken frames (if required)\n- Weatherseals to all openable windows\n\nExternal Doors:\n- Solid core construction\n- Hardwood or engineered timber\n- Weather seals and threshold\n- Lockset: [Specify brand and type]\n- Hinges: Stainless steel, 3 per door\n- Door closer where required\n\nInternal Doors:\n- Hollow core flush doors\n- 40mm thickness\n- Hardwood or paint grade\n- Locksets: Privacy or passage sets\n- Hinges: Brass or stainless steel\n\nDoor Frames:\n- Hardwood or pine\n- Rebated for door thickness\n- Architraves: [Specify profile]\n- Prime before installation\n\nHardware:\n- Locksets: [Specify brand]\n- Hinges: [Specify type and finish]\n- Door closers: [Specify where required]\n- Panic hardware: [Fire exits]\n- Handles and pulls: [Specify]\n- All hardware fixed with matching screws\n\nGlazing:\n- Comply with AS 1288\n- Toughened glass where required\n- Laminated glass where required\n- Low-E coating if specified\n- Gasket and seal all glazing' },
      { id: '9', title: 'Plasterboard and Ceilings', content: 'Plasterboard:\n- Standard sheets: 10mm or 13mm\n- Moisture resistant: Wet areas\n- Fire rated: As per fire engineer\n- Fix to AS/NZS 2588\n\nInstallation:\n- Sheets oriented vertically (walls)\n- Stagger joins\n- Fix with screws at 300mm centers\n- Set screws just below surface\n- Insulation behind walls and ceilings\n\nJointing:\n- Tape and compound all joints\n- 3-coat system minimum\n- Paper tape for first coat\n- Base coat and topping compound\n- Sand smooth between coats\n- Stop beads at external corners\n\nCeilings:\n- Sheets oriented across joists/battens\n- Additional noggings for support\n- Cornice: [Specify size and profile]\n- Flush ceiling or corniced\n- Set-down ceiling where shown\n\nSuspended Ceilings:\n- Grid system: [Specify brand]\n- Tiles: [Specify type and size]\n- Concealed or exposed grid\n- Access panels where required\n- Integration with services\n\nAccess:\n- Manhole: 450x450mm minimum\n- Frame and cover to match ceiling\n- Location as shown on drawings' },
      { id: '10', title: 'Painting and Decorating', content: 'General:\n- All surfaces clean, dry, and properly prepared\n- Prime all surfaces before top coats\n- Sand between coats\n- Minimum 3-coat system\n\nInterior Painting:\n- Walls and ceilings: Low sheen acrylic\n- Woodwork: Semi-gloss enamel\n- Color: [Specify or from schedule]\n- Brand: [Specify approved brands]\n\nExterior Painting:\n- Walls: 100% acrylic low sheen\n- Woodwork: Exterior enamel\n- Metal: Metal primer + enamel\n- All exposed timber: 3 coats\n\nSurface Preparation:\n- Fill all holes and cracks\n- Sand smooth\n- Clean dust free\n- Spot prime repairs\n- Undercoat entire surface\n\nApplication:\n- Brush, roller, or spray\n- Two finish coats minimum\n- Even coverage, no runs or sags\n- Protect floors and fixtures\n- Ventilate during application\n\nTimber Staining:\n- Sand to smooth finish\n- Seal knots and resin\n- Apply stain evenly\n- Clear coating: 2-3 coats\n- Polyurethane or lacquer\n\nWallpaper:\n- Prime walls before hanging\n- Match patterns\n- Trim accurately\n- Smooth out air bubbles\n- Clean immediately' },
      { id: '11', title: 'Floor Finishes', content: 'Tiling:\n- Tiles: [Specify size, type, color]\n- Adhesive: Flexible, waterproof (wet areas)\n- Grout: Epoxy or cementitious\n- Falls: Minimum 1:100 to waste\n- Waterproofing under tiles in wet areas\n\nTile Laying:\n- Set out from center\n- Cuts at edges\n- Joints straight and even (3mm)\n- Clean off excess adhesive\n- Grout after 24 hours\n- Clean and seal\n\nTimber Flooring:\n- Hardwood or engineered as specified\n- Moisture content: 10-14%\n- Acclimatize on site for [7] days\n- Install over appropriate underlay\n- Expansion gaps at perimeter\n- Sand and finish (3 coats poly)\n\nCarpet:\n- Quality: [Specify]\n- Underlay: [Specify thickness and type]\n- Install with gripper strips\n- Power stretch and secure\n- Seams to be invisible\n- Vacuum and clean\n\nVinyl/Sheet Flooring:\n- Quality commercial grade\n- Welded seams\n- Flash cove skirting in commercial areas\n- Adhesive to manufacturer specs\n- Roll flat, no bubbles\n\nPolished Concrete:\n- Grind and polish to specified grit\n- Seal with penetrating sealer\n- Anti-slip where required\n- Minimum 2 coats sealer' },
      { id: '12', title: 'Hydraulic Services', content: 'General:\n- Comply with AS/NZS 3500 (all parts)\n- Licensed plumber to install\n- Coordinate with other trades\n- Submit shop drawings for approval\n\nCold Water:\n- Copper pipes to AS 1432\n- UPVC where permitted\n- Minimum 20mm to fixtures\n- Isolating valves at each fixture\n- Insulate exposed pipes\n- Test to 1.5x working pressure\n\nHot Water:\n- Copper pipes (Type B)\n- Insulate all hot water pipes\n- Install tempering valves (50°C)\n- System: [Electric/Gas/Solar]\n- Size: [Capacity in liters]\n- Pressure relief valve to drain\n\nDrainage:\n- UPVC pipes to AS/NZS 1260\n- Falls: 1:60 minimum (branch), 1:100 (main)\n- Floor wastes in wet areas\n- Inspection openings (IO) at changes\n- Vent stacks to roof\n- Test all drains (water or air)\n\nStormwater:\n- UPVC to AS/NZS 1260\n- Size as per hydraulic design\n- Connect to approved disposal point\n- Overflow relief gullies\n- Charged lines tested\n\nFixtures:\n- [Specify brands and models]\n- Water efficient (WELS rated)\n- Tapware: Chrome or brushed nickel\n- Install to manufacturer specs\n- All fixtures accessible for maintenance' },
      { id: '13', title: 'Electrical Services', content: 'General:\n- Comply with AS/NZS 3000\n- Licensed electrician to install\n- Coordinate cable routes with other services\n- Certificate of Compliance required\n\nCables and Wiring:\n- Copper conductors to AS/NZS 3000\n- TPS cable for general wiring\n- Conduit in concrete slabs\n- Cable tray where exposed\n- Color code all circuits\n- Label at distribution boards\n\nSwitchboards:\n- Main switchboard: [Specify size]\n- Circuit breakers to AS/NZS 60898\n- RCD protection to AS/NZS 3000\n- Surge protection\n- Clearly labeled circuits\n- Directory of circuits provided\n\nLighting:\n- LED downlights: [Specify]\n- External floods: [Specify]\n- Emergency lighting: [Locations]\n- Exit signs: [Locations]\n- Switching as per drawings\n- Dimmers where specified\n\nPower Points:\n- GPOs: 10A/15A/20A as specified\n- Double GPOs minimum\n- Height: 300mm above floor (standard)\n- Dedicated circuits for:\n  * Kitchen appliances\n  * Air conditioning\n  * Hot water\n\nData and Communications:\n- Cat 6 cabling throughout\n- Terminate in wall plates\n- Patch panel in comms cabinet\n- Test all data points\n- Label all cables\n\nEarthing:\n- Earth stake to AS/NZS 3000\n- Bond all metalwork\n- Test earth resistance\n- Provide test certificate' },
      { id: '14', title: 'Mechanical Services', content: 'HVAC System:\n- Type: [Specify - split, ducted, VRV]\n- Capacity: [kW heating/cooling]\n- Energy rating: Minimum [X] stars\n- Comply with AS/NZS 3666\n\nDucted Systems:\n- Ductwork: Galvanized sheet metal\n- Insulated with 25mm minimum\n- Seal all joints\n- Install fire dampers where required\n- Diffusers and grilles as scheduled\n- Balance system upon completion\n\nSplit Systems:\n- Indoor and outdoor units as specified\n- Copper refrigerant lines\n- Insulate refrigerant lines\n- Condensate drainage to approved point\n- Electrical connection by electrician\n\nVentilation:\n- Exhaust fans in bathrooms and kitchen\n- Ducted to external\n- Weatherproof terminals\n- Backdraft dampers\n- Switched or humidity controlled\n\nTesting and Commissioning:\n- System fully tested\n- Balanced for even distribution\n- Controls programmed\n- Training provided to client\n- Operations manual supplied\n- Warranty documentation' },
      { id: '15', title: 'Fire Services', content: 'Fire Detection:\n- Smoke detectors to AS 3786\n- Heat detectors in specific areas\n- Interconnected system\n- Battery backup\n- Test regularly\n\nFire Suppression:\n- Fire extinguishers: [Type and locations]\n- Fire blanket in kitchen\n- Sprinklers: [If required by code]\n- Hydrant system: [If required]\n\nFire Rating:\n- Fire-rated walls: [Specify FRL]\n- Fire-rated doors: [Specify FRL]\n- Penetration seals: Fire-rated\n- Cavity barriers in walls\n\nExit and Emergency:\n- Exit signs: Illuminated, AS 2293\n- Emergency lighting: AS 2293\n- Fire doors: Self-closing\n- Exit paths: Clear and marked\n\nCompliance:\n- Certification by fire safety engineer\n- Annual testing and maintenance\n- Essential Safety Measures schedule\n- Building Certificate of Occupancy' },
      { id: '16', title: 'External Works and Landscaping', content: 'Site Works:\n- Remove all construction materials\n- Restore disturbed areas\n- Compact and level surfaces\n- Topsoil: [Depth] mm minimum\n\nPaving:\n- Concrete: [Specify thickness and finish]\n- Pavers: [Specify type, size, color]\n- Base: [Specify - crusher dust, road base]\n- Compaction: 95% MDD\n- Falls to drainage\n- Expansion joints at 3m centers\n\nDriveways:\n- Concrete: N25, 100mm thick\n- Mesh: SL82\n- Trowel finish\n- Control joints\n- Drainage to street or approved point\n\nRetaining Walls:\n- As per structural engineer details\n- Drainage behind wall\n- Waterproofing below ground\n- Capping as specified\n- Backfill with free-draining material\n\nFencing:\n- Type: [Specify - timber, Colorbond, etc.]\n- Height: [Specify]\n- Posts: [Material and spacing]\n- Gates: [Specify locations and type]\n- Comply with boundary requirements\n\nLandscaping:\n- Turf: [Specify type]\n- Planting: [As per landscape plan]\n- Mulch: [Specify type and depth]\n- Irrigation: [If specified]\n- Maintenance period: [X] weeks\n\nDrainage:\n- Surface drainage falls away from building\n- Agricultural drains where required\n- Connection to stormwater system\n- Erosion control measures' }
    ],
    'Technical Schedules': [
  };

  return templates[docName] || [
    { id: '1', title: 'Section 1', content: 'Enter content here...' }
  ];
};

export function DocumentCreatorDialog({
  open,
  onOpenChange,
  documentName,
  tenderId,
  projectData,
  tenderData,
  existingDocumentId,
  onDocumentSaved
}: DocumentCreatorDialogProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (existingDocumentId) {
        loadExistingDocument();
      } else {
        // Initialize with template populated with project/tender data
        setSections(getTemplateWithData(documentName, projectData, tenderData));
        setDocumentTitle(documentName);
      }
    }
  }, [open, existingDocumentId, documentName, projectData, tenderData]);

  const loadExistingDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('tender_package_documents')
        .select('*')
        .eq('id', existingDocumentId)
        .single();

      if (error) throw error;

      if (data.document_content) {
        setSections(JSON.parse(data.document_content));
      }
      setDocumentTitle(data.document_name);
    } catch (error: any) {
      console.error('Error loading document:', error);
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive"
      });
    }
  };

  const handleAddSection = () => {
    const newSection: DocumentSection = {
      id: Date.now().toString(),
      title: 'New Section',
      content: ''
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (id: string, field: 'title' | 'content', value: string) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const handleSave = async () => {
    if (!tenderId) {
      toast({
        title: "Error",
        description: "Please save the tender first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const documentContent = JSON.stringify(sections);
      
      if (existingDocumentId) {
        // Update existing document
        const { error } = await supabase
          .from('tender_package_documents')
          .update({
            document_name: documentTitle,
            document_content: documentContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDocumentId);

        if (error) throw error;
      } else {
        // Create new document
        const { data, error } = await supabase
          .from('tender_package_documents')
          .insert({
            tender_id: tenderId,
            document_type: documentName,
            document_name: documentTitle,
            document_content: documentContent,
            file_path: '', // Will be generated when exported
            uploaded_by: profile?.user_id
          })
          .select()
          .single();

        if (error) throw error;
        onDocumentSaved(data);
      }

      toast({
        title: "Document saved",
        description: "Your document has been saved successfully"
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit {documentName}</DialogTitle>
          <DialogDescription>
            Customize the sections below and save when ready
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-4">
          <div>
            <Label htmlFor="docTitle">Document Title</Label>
            <Input
              id="docTitle"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={section.title}
                    onChange={(e) => handleUpdateSection(section.id, 'title', e.target.value)}
                    className="font-semibold flex-1 mr-2"
                    placeholder="Section title"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSection(section.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={section.content}
                  onChange={(e) => handleUpdateSection(section.id, 'content', e.target.value)}
                  rows={6}
                  placeholder="Section content"
                  className="font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleAddSection}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
