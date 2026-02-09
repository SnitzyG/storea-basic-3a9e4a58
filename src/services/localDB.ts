const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export type TableName =
    | 'projects'
    | 'activity_log'
    | 'todos'
    | 'calendar_events'
    | 'documents'
    | 'messages'
    | 'message_threads'
    | 'message_participants'
    | 'tenders'
    | 'tender_packages'
    | 'tender_bids'
    | 'tender_line_items'
    | 'tender_bid_line_items'
    | 'profiles'
    | 'project_users'
    | 'companies'
    | 'rfis'
    | 'rfi_activities'
    | 'rfi_collaboration_comments'
    | 'document_groups'
    | 'document_revisions'
    | 'document_shares'
    | 'document_events'
    | 'notifications'
    | 'invitations'
    | 'tender_access'
    | 'project_budgets'
    | 'project_invoices'
    | 'line_item_budgets'
    | 'progress_claims'
    | 'variations'
    | 'user_roles'
    | 'user_sessions'
    | 'admin_alerts'
    | 'audit_logs'
    | 'system_metrics'
    | 'project_pending_invitations'
    | 'project_join_requests'
    | 'tender_package_documents'
    | 'payment_schedule_stages';

type DBListener = (payload: any) => void;

class LocalDatabase {
    private store: Record<string, any[]> = {};
    private listeners: Record<string, DBListener[]> = {};

    constructor() {
        this.seed();
    }

    private seed() {
        const userId = 'mock-user-id';
        const sarahId = 'user-sarah';
        const jamesId = 'user-james';
        const emmaId = 'user-emma';
        const now = new Date().toISOString();
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
        const threeDaysAgo = new Date(Date.now() - 86400000 * 3).toISOString();
        const fiveDaysAgo = new Date(Date.now() - 86400000 * 5).toISOString();
        const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();
        const tomorrow = new Date(Date.now() + 86400000).toISOString();
        const nextWeek = new Date(Date.now() + 86400000 * 7).toISOString();
        const inTwoWeeks = new Date(Date.now() + 86400000 * 14).toISOString();

        this.store = {
            profiles: [
                { id: 'prof-1', user_id: userId, name: 'Richard Architect', role: 'architect', email: 'richard@storea.com', phone: '0412345678', company_id: 'comp-1', company_name: 'STOREA Architecture', company_position: 'Principal Architect', avatar_url: '', created_at: now, approved: true, online_status: true, last_seen: now },
                { id: 'prof-2', user_id: sarahId, name: 'Sarah Builder', role: 'builder', email: 'sarah@buildright.com', phone: '0423456789', company_id: 'comp-2', company_name: 'BuildRight Construction', company_position: 'Project Manager', avatar_url: '', created_at: yesterday, approved: true, online_status: true, last_seen: twoHoursAgo },
                { id: 'prof-3', user_id: jamesId, name: 'James Contractor', role: 'contractor', email: 'james@homevision.com', phone: '0434567890', company_id: 'comp-3', company_name: 'HomeVision Contracting', company_position: 'Lead Contractor', avatar_url: '', created_at: twoDaysAgo, approved: true, online_status: false, last_seen: yesterday },
                { id: 'prof-4', user_id: emmaId, name: 'Emma Client', role: 'homeowner', email: 'emma@email.com', phone: '0445678901', company_id: null, company_name: null, company_position: null, avatar_url: '', created_at: threeDaysAgo, approved: true, online_status: false, last_seen: twoDaysAgo },
            ],
            companies: [
                { id: 'comp-1', name: 'STOREA Architecture', address: '100 Collins St, Melbourne VIC 3000', settings: {}, created_at: now, updated_at: now },
                { id: 'comp-2', name: 'BuildRight Construction', address: '50 Spencer St, Melbourne VIC 3000', settings: {}, created_at: now, updated_at: now },
                { id: 'comp-3', name: 'HomeVision Contracting', address: '25 Bourke St, Melbourne VIC 3000', settings: {}, created_at: now, updated_at: now },
            ],
            projects: [
                { id: 'proj-1', name: 'Luxury Villa Renovation', address: '123 Ocean Drive, Gold Coast QLD 4217', status: 'active', architectural_stage: 'Construction Documentation', budget: 1500000, estimated_start_date: '2026-02-01', estimated_finish_date: '2026-12-01', project_reference_number: 'PRJ-2026-001', project_id: 'PRJ-001', homeowner_name: 'John Smith', description: 'Full renovation of existing 2-storey beachfront property including new kitchen, bathrooms, and outdoor entertaining area.', priority: 'high', created_by: userId, created_at: fiveDaysAgo, updated_at: now, invitation_token: 'proj_abc123' },
                { id: 'proj-2', name: 'City Apartment Complex', address: '45 High Street, Melbourne VIC 3000', status: 'active', architectural_stage: 'Concept', budget: 5000000, estimated_start_date: '2026-06-01', estimated_finish_date: '2027-06-01', project_reference_number: 'PRJ-2026-002', project_id: 'PRJ-002', homeowner_name: 'Metro Developments', description: 'New 12-unit apartment complex in the heart of Melbourne CBD.', priority: 'medium', created_by: userId, created_at: threeDaysAgo, updated_at: yesterday, invitation_token: 'proj_def456' },
                { id: 'proj-3', name: 'Suburban Family Home', address: '78 Maple Avenue, Brighton VIC 3186', status: 'completed', architectural_stage: 'As Built', budget: 850000, estimated_start_date: '2025-01-15', estimated_finish_date: '2025-11-30', project_reference_number: 'PRJ-2025-003', project_id: 'PRJ-003', homeowner_name: 'Emma Client', description: 'Custom 4-bedroom family home with sustainable design features.', priority: 'low', created_by: userId, created_at: fiveDaysAgo, updated_at: twoDaysAgo, invitation_token: 'proj_ghi789' },
            ],
            project_users: [
                { id: 'pu-1', project_id: 'proj-1', user_id: userId, role: 'architect', joined_at: fiveDaysAgo, created_at: fiveDaysAgo, invited_by: userId },
                { id: 'pu-2', project_id: 'proj-1', user_id: sarahId, role: 'builder', joined_at: threeDaysAgo, created_at: threeDaysAgo, invited_by: userId },
                { id: 'pu-3', project_id: 'proj-1', user_id: jamesId, role: 'contractor', joined_at: twoDaysAgo, created_at: twoDaysAgo, invited_by: userId },
                { id: 'pu-4', project_id: 'proj-1', user_id: emmaId, role: 'homeowner', joined_at: twoDaysAgo, created_at: twoDaysAgo, invited_by: userId },
                { id: 'pu-5', project_id: 'proj-2', user_id: userId, role: 'architect', joined_at: threeDaysAgo, created_at: threeDaysAgo, invited_by: userId },
                { id: 'pu-6', project_id: 'proj-2', user_id: sarahId, role: 'builder', joined_at: twoDaysAgo, created_at: twoDaysAgo, invited_by: userId },
                { id: 'pu-7', project_id: 'proj-3', user_id: userId, role: 'architect', joined_at: fiveDaysAgo, created_at: fiveDaysAgo, invited_by: userId },
                { id: 'pu-8', project_id: 'proj-3', user_id: emmaId, role: 'homeowner', joined_at: fiveDaysAgo, created_at: fiveDaysAgo, invited_by: userId },
            ],
            rfis: [
                { id: 'rfi-1', project_id: 'proj-1', rfi_number: 'STO-RFI-0001', subject: 'Structural beam specification clarification', question: 'The drawings show a 360UB beam at grid line B3, but the structural report references a 310UB. Which specification should we follow for the main living area?', status: 'outstanding', priority: 'high', rfi_type: 'request_for_information', category: 'Structural', raised_by: sarahId, assigned_to: userId, required_date: tomorrow, created_at: twoDaysAgo, updated_at: yesterday },
                { id: 'rfi-2', project_id: 'proj-1', rfi_number: 'STO-RFI-0002', subject: 'Window frame material selection', question: 'Client has requested aluminium frames but the specification calls for timber. Please confirm the preferred material and any cost implications.', status: 'outstanding', priority: 'medium', rfi_type: 'request_for_information', category: 'Architectural', raised_by: jamesId, assigned_to: userId, required_date: nextWeek, created_at: yesterday, updated_at: yesterday },
                { id: 'rfi-3', project_id: 'proj-1', rfi_number: 'STO-RFI-0003', subject: 'Bathroom waterproofing method', question: 'Which waterproofing system should be used for the ensuite - sheet membrane or liquid applied? The spec is ambiguous.', status: 'answered', priority: 'high', rfi_type: 'request_for_information', category: 'Structural', raised_by: sarahId, assigned_to: userId, response: 'Use liquid-applied membrane system (Ardex WPM 300) as per AS3740-2021. Sheet membrane is acceptable as alternative.', responded_by: userId, responded_at: yesterday, required_date: twoDaysAgo, created_at: threeDaysAgo, updated_at: yesterday },
                { id: 'rfi-4', project_id: 'proj-1', rfi_number: 'STO-GC-0001', subject: 'Site access schedule update', question: 'Can we get updated site access hours for the demolition phase starting next week?', status: 'closed', priority: 'low', rfi_type: 'general_correspondence', category: 'General', raised_by: jamesId, assigned_to: userId, response: 'Site access hours updated: Mon-Fri 7am-5pm, Sat 8am-1pm. No Sunday work permitted.', responded_by: userId, responded_at: threeDaysAgo, required_date: fiveDaysAgo, created_at: fiveDaysAgo, updated_at: threeDaysAgo },
                { id: 'rfi-5', project_id: 'proj-2', rfi_number: 'STO-RFI-0004', subject: 'Facade cladding options', question: 'Need design direction on the external facade cladding - considering Alucobond vs terracotta tiles.', status: 'draft', priority: 'medium', rfi_type: 'request_for_information', category: 'Architectural', raised_by: userId, assigned_to: null, required_date: inTwoWeeks, created_at: yesterday, updated_at: yesterday },
                { id: 'rfi-6', project_id: 'proj-1', rfi_number: 'STO-RFI-0005', subject: 'Electrical switchboard location', question: 'The proposed switchboard location conflicts with the plumbing riser. Need alternative location approval.', status: 'outstanding', priority: 'high', rfi_type: 'request_for_information', category: 'Services', raised_by: jamesId, assigned_to: userId, required_date: yesterday, created_at: threeDaysAgo, updated_at: threeDaysAgo },
            ],
            rfi_activities: [
                { id: 'rfia-1', rfi_id: 'rfi-1', user_id: sarahId, action: 'created', description: 'RFI created', created_at: twoDaysAgo },
                { id: 'rfia-2', rfi_id: 'rfi-3', user_id: userId, action: 'responded', description: 'Response provided', created_at: yesterday },
            ],
            rfi_collaboration_comments: [],
            document_groups: [
                { id: 'dg-1', project_id: 'proj-1', document_number: 'STO-CON-0001', title: 'Architectural Plans Rev 2', category: 'Architectural', status: 'current', visibility_scope: 'project', is_locked: true, locked_by: userId, locked_at: now, current_revision_id: 'dr-1', project_stage: 'Construction Documentation', created_by: userId, created_at: threeDaysAgo, updated_at: now },
                { id: 'dg-2', project_id: 'proj-1', document_number: 'STO-CON-0002', title: 'Structural Engineering Report', category: 'Structural', status: 'current', visibility_scope: 'project', is_locked: false, locked_by: null, locked_at: null, current_revision_id: 'dr-2', project_stage: 'Construction Documentation', created_by: sarahId, created_at: twoDaysAgo, updated_at: yesterday },
                { id: 'dg-3', project_id: 'proj-1', document_number: 'STO-CON-0003', title: 'Site Survey Report', category: 'Survey', status: 'current', visibility_scope: 'project', is_locked: false, locked_by: null, locked_at: null, current_revision_id: 'dr-3', project_stage: 'Pre-Design', created_by: jamesId, created_at: fiveDaysAgo, updated_at: fiveDaysAgo },
                { id: 'dg-4', project_id: 'proj-1', document_number: 'STO-CON-0004', title: 'Electrical Layout Plans', category: 'Services', status: 'current', visibility_scope: 'project', is_locked: false, locked_by: null, locked_at: null, current_revision_id: 'dr-4', project_stage: 'Construction Documentation', created_by: userId, created_at: twoDaysAgo, updated_at: twoDaysAgo },
                { id: 'dg-5', project_id: 'proj-1', document_number: 'STO-CON-0005', title: 'Plumbing Layout Plans', category: 'Services', status: 'draft', visibility_scope: 'project', is_locked: false, locked_by: null, locked_at: null, current_revision_id: 'dr-5', project_stage: 'Construction Documentation', created_by: userId, created_at: yesterday, updated_at: yesterday },
                { id: 'dg-6', project_id: 'proj-1', document_number: 'STO-CON-0006', title: 'Landscape Design Package', category: 'Landscape', status: 'current', visibility_scope: 'project', is_locked: false, locked_by: null, locked_at: null, current_revision_id: 'dr-6', project_stage: 'Design Development', created_by: userId, created_at: threeDaysAgo, updated_at: threeDaysAgo },
                { id: 'dg-7', project_id: 'proj-1', document_number: 'STO-CON-0007', title: 'Building Permit Application', category: 'Permit', status: 'submitted', visibility_scope: 'project', is_locked: true, locked_by: userId, locked_at: yesterday, current_revision_id: 'dr-7', project_stage: 'Permit', created_by: userId, created_at: twoDaysAgo, updated_at: yesterday },
                { id: 'dg-8', project_id: 'proj-2', document_number: 'STO-CON-0008', title: 'Concept Design Presentation', category: 'Architectural', status: 'current', visibility_scope: 'project', is_locked: false, locked_by: null, locked_at: null, current_revision_id: 'dr-8', project_stage: 'Concept', created_by: userId, created_at: twoDaysAgo, updated_at: twoDaysAgo },
            ],
            document_revisions: [
                { id: 'dr-1', document_group_id: 'dg-1', revision_number: 2, file_name: 'architectural_plans_v2.pdf', file_path: 'proj-1/architectural_plans_v2.pdf', file_type: 'application/pdf', file_size: 15200000, file_extension: 'pdf', uploaded_by: userId, is_current: true, is_archived: false, changes_summary: 'Updated kitchen layout per client feedback', created_at: now },
                { id: 'dr-2', document_group_id: 'dg-2', revision_number: 1, file_name: 'structural_report.pdf', file_path: 'proj-1/structural_report.pdf', file_type: 'application/pdf', file_size: 8500000, file_extension: 'pdf', uploaded_by: sarahId, is_current: true, is_archived: false, created_at: twoDaysAgo },
                { id: 'dr-3', document_group_id: 'dg-3', revision_number: 1, file_name: 'site_survey.pdf', file_path: 'proj-1/site_survey.pdf', file_type: 'application/pdf', file_size: 4200000, file_extension: 'pdf', uploaded_by: jamesId, is_current: true, is_archived: false, created_at: fiveDaysAgo },
                { id: 'dr-4', document_group_id: 'dg-4', revision_number: 1, file_name: 'electrical_layout.dwg', file_path: 'proj-1/electrical_layout.dwg', file_type: 'application/octet-stream', file_size: 3100000, file_extension: 'dwg', uploaded_by: userId, is_current: true, is_archived: false, created_at: twoDaysAgo },
                { id: 'dr-5', document_group_id: 'dg-5', revision_number: 1, file_name: 'plumbing_layout.dwg', file_path: 'proj-1/plumbing_layout.dwg', file_type: 'application/octet-stream', file_size: 2800000, file_extension: 'dwg', uploaded_by: userId, is_current: true, is_archived: false, created_at: yesterday },
                { id: 'dr-6', document_group_id: 'dg-6', revision_number: 1, file_name: 'landscape_design.pdf', file_path: 'proj-1/landscape_design.pdf', file_type: 'application/pdf', file_size: 6700000, file_extension: 'pdf', uploaded_by: userId, is_current: true, is_archived: false, created_at: threeDaysAgo },
                { id: 'dr-7', document_group_id: 'dg-7', revision_number: 1, file_name: 'building_permit.pdf', file_path: 'proj-1/building_permit.pdf', file_type: 'application/pdf', file_size: 1200000, file_extension: 'pdf', uploaded_by: userId, is_current: true, is_archived: false, created_at: twoDaysAgo },
                { id: 'dr-8', document_group_id: 'dg-8', revision_number: 1, file_name: 'concept_presentation.pdf', file_path: 'proj-2/concept_presentation.pdf', file_type: 'application/pdf', file_size: 22000000, file_extension: 'pdf', uploaded_by: userId, is_current: true, is_archived: false, created_at: twoDaysAgo },
            ],
            document_shares: [],
            document_events: [],
            documents: [],
            message_threads: [
                { id: 'thread-1', project_id: 'proj-1', subject: 'Design Review Discussion', created_by: userId, created_at: threeDaysAgo, updated_at: twoHoursAgo, last_message_at: twoHoursAgo },
                { id: 'thread-2', project_id: 'proj-1', subject: 'Site Progress Update', created_by: sarahId, created_at: twoDaysAgo, updated_at: yesterday, last_message_at: yesterday },
                { id: 'thread-3', project_id: 'proj-1', subject: 'Material Selection - Kitchen', created_by: emmaId, created_at: yesterday, updated_at: yesterday, last_message_at: yesterday },
            ],
            message_participants: [
                { id: 'mp-1', thread_id: 'thread-1', user_id: userId, joined_at: threeDaysAgo },
                { id: 'mp-2', thread_id: 'thread-1', user_id: sarahId, joined_at: threeDaysAgo },
                { id: 'mp-3', thread_id: 'thread-1', user_id: jamesId, joined_at: threeDaysAgo },
                { id: 'mp-4', thread_id: 'thread-2', user_id: sarahId, joined_at: twoDaysAgo },
                { id: 'mp-5', thread_id: 'thread-2', user_id: userId, joined_at: twoDaysAgo },
                { id: 'mp-6', thread_id: 'thread-3', user_id: emmaId, joined_at: yesterday },
                { id: 'mp-7', thread_id: 'thread-3', user_id: userId, joined_at: yesterday },
            ],
            messages: [
                { id: 'msg-1', thread_id: 'thread-1', sender_id: userId, content: 'Hi team, I\'ve uploaded the revised architectural plans. Please review the updated kitchen layout and provide feedback by end of week.', created_at: threeDaysAgo, read_by: [userId, sarahId] },
                { id: 'msg-2', thread_id: 'thread-1', sender_id: sarahId, content: 'Thanks Richard. The kitchen layout looks great. One concern - the island bench dimensions seem tight for the plumbing connections. Can we check with James?', created_at: twoDaysAgo, read_by: [userId, sarahId] },
                { id: 'msg-3', thread_id: 'thread-1', sender_id: jamesId, content: 'I\'ve reviewed the plumbing routes. We can make it work but we\'ll need to adjust the waste pipe run by about 200mm. I\'ll update the plumbing layout accordingly.', created_at: yesterday, read_by: [jamesId] },
                { id: 'msg-4', thread_id: 'thread-1', sender_id: userId, content: 'Perfect, thanks James. Please send through the updated plumbing layout when ready. I\'ll coordinate with the structural engineer about the floor penetrations.', created_at: twoHoursAgo, read_by: [userId] },
                { id: 'msg-5', thread_id: 'thread-2', sender_id: sarahId, content: 'Site progress update: Demolition phase is 80% complete. We\'re on track to start framing next Monday. Photos attached.', created_at: twoDaysAgo, read_by: [sarahId, userId] },
                { id: 'msg-6', thread_id: 'thread-2', sender_id: userId, content: 'Great progress Sarah! Have we confirmed the steel delivery date? We need the beams on site by Wednesday for the framing to stay on schedule.', created_at: twoDaysAgo, read_by: [userId, sarahId] },
                { id: 'msg-7', thread_id: 'thread-2', sender_id: sarahId, content: 'Steel is confirmed for Tuesday delivery. I\'ve also booked the crane for Wednesday morning. All on track.', created_at: yesterday, read_by: [sarahId] },
                { id: 'msg-8', thread_id: 'thread-3', sender_id: emmaId, content: 'Hi Richard, I\'ve been looking at kitchen benchtop options. I\'m torn between Caesarstone and natural marble. What would you recommend for this style of home?', created_at: yesterday, read_by: [emmaId] },
                { id: 'msg-9', thread_id: 'thread-3', sender_id: userId, content: 'Hi Emma, both are excellent choices. For a beachfront property I\'d recommend Caesarstone - it\'s more resistant to salt air and requires less maintenance. I can send you some samples of colours that would complement the cabinetry.', created_at: yesterday, read_by: [userId] },
            ],
            tenders: [
                { id: 'tender-1', project_id: 'proj-1', title: 'Kitchen Renovation Works', description: 'Complete kitchen renovation including demolition, cabinetry, benchtops, splashback, and appliance installation.', status: 'draft', tender_id: 'TND-001', tender_type: 'select', closing_date: nextWeek, budget_estimate: 85000, issued_by: userId, created_at: twoDaysAgo, updated_at: yesterday },
                { id: 'tender-2', project_id: 'proj-1', title: 'Electrical Installation Package', description: 'Full electrical installation for 2-storey renovation including switchboard upgrade, lighting, and power points.', status: 'open', tender_id: 'TND-002', tender_type: 'open', closing_date: inTwoWeeks, budget_estimate: 45000, issued_by: userId, created_at: threeDaysAgo, updated_at: yesterday },
                { id: 'tender-3', project_id: 'proj-1', title: 'Landscaping Package', description: 'Complete landscaping including pool area, outdoor entertaining, gardens, and irrigation.', status: 'awarded', tender_id: 'TND-003', tender_type: 'select', closing_date: yesterday, budget_estimate: 120000, awarded_to: jamesId, issued_by: userId, created_at: fiveDaysAgo, updated_at: yesterday },
            ],
            tender_packages: [
                { id: 'tp-1', tender_id: 'tender-2', name: 'Scope of Works', description: 'Detailed scope document', created_at: threeDaysAgo },
            ],
            tender_line_items: [
                { id: 'tli-1', tender_id: 'tender-2', line_number: 1, item_description: 'Switchboard upgrade to 3-phase', specification: 'AS/NZS 3000 compliant', unit_of_measure: 'item', quantity: 1, unit_price: null, total: 0, category: 'Switchboard', created_at: threeDaysAgo, updated_at: threeDaysAgo },
                { id: 'tli-2', tender_id: 'tender-2', line_number: 2, item_description: 'LED downlight supply and install', specification: 'Warm white 3000K, IP44 rated', unit_of_measure: 'each', quantity: 45, unit_price: null, total: 0, category: 'Lighting', created_at: threeDaysAgo, updated_at: threeDaysAgo },
                { id: 'tli-3', tender_id: 'tender-2', line_number: 3, item_description: 'GPO supply and install', specification: 'Double power points, white', unit_of_measure: 'each', quantity: 28, unit_price: null, total: 0, category: 'Power', created_at: threeDaysAgo, updated_at: threeDaysAgo },
            ],
            tender_bids: [
                { id: 'bid-1', tender_id: 'tender-2', bidder_id: jamesId, bidder_name: 'HomeVision Contracting', total_amount: 42500, status: 'submitted', notes: 'Can commence within 2 weeks of award. Price includes all materials and labour.', submitted_at: yesterday, created_at: yesterday },
                { id: 'bid-2', tender_id: 'tender-2', bidder_id: sarahId, bidder_name: 'BuildRight Construction', total_amount: 47800, status: 'submitted', notes: 'Premium materials included. 12-month warranty on all workmanship.', submitted_at: yesterday, created_at: yesterday },
                { id: 'bid-3', tender_id: 'tender-3', bidder_id: jamesId, bidder_name: 'HomeVision Contracting', total_amount: 115000, status: 'accepted', notes: 'Includes premium turf and native plantings. 6-week completion timeline.', submitted_at: fiveDaysAgo, created_at: fiveDaysAgo },
            ],
            tender_bid_line_items: [],
            tender_access: [
                { id: 'ta-1', tender_id: 'tender-2', user_id: jamesId, status: 'approved', created_at: threeDaysAgo },
                { id: 'ta-2', tender_id: 'tender-2', user_id: sarahId, status: 'approved', created_at: threeDaysAgo },
            ],
            tender_package_documents: [],
            calendar_events: [
                { id: 'cal-1', project_id: 'proj-1', title: 'Site Inspection', description: 'Weekly site inspection with builder', start_time: new Date(Date.now() + 86400000).toISOString(), end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(), event_type: 'inspection', created_by: userId, attendees: [userId, sarahId], created_at: twoDaysAgo },
                { id: 'cal-2', project_id: 'proj-1', title: 'Design Review Meeting', description: 'Review updated architectural plans with client', start_time: new Date(Date.now() + 86400000 * 2).toISOString(), end_time: new Date(Date.now() + 86400000 * 2 + 7200000).toISOString(), event_type: 'meeting', created_by: userId, attendees: [userId, emmaId], created_at: threeDaysAgo },
                { id: 'cal-3', project_id: 'proj-1', title: 'Council Submission Deadline', description: 'Building permit application due to Gold Coast Council', start_time: new Date(Date.now() + 86400000 * 5).toISOString(), end_time: new Date(Date.now() + 86400000 * 5 + 3600000).toISOString(), event_type: 'deadline', created_by: userId, attendees: [userId], created_at: fiveDaysAgo },
                { id: 'cal-4', project_id: 'proj-1', title: 'Client Presentation', description: 'Present final design package to homeowner', start_time: new Date(Date.now() + 86400000 * 7).toISOString(), end_time: new Date(Date.now() + 86400000 * 7 + 5400000).toISOString(), event_type: 'presentation', created_by: userId, attendees: [userId, emmaId, sarahId], created_at: yesterday },
                { id: 'cal-5', project_id: 'proj-2', title: 'Concept Progress Meeting', description: 'Review concept design progress with team', start_time: new Date(Date.now() + 86400000 * 3).toISOString(), end_time: new Date(Date.now() + 86400000 * 3 + 3600000).toISOString(), event_type: 'meeting', created_by: userId, attendees: [userId, sarahId], created_at: twoDaysAgo },
                { id: 'cal-6', project_id: 'proj-3', title: 'Final Walkthrough', description: 'Final inspection and handover walkthrough', start_time: new Date(Date.now() + 86400000 * 10).toISOString(), end_time: new Date(Date.now() + 86400000 * 10 + 7200000).toISOString(), event_type: 'inspection', created_by: userId, attendees: [userId, emmaId], created_at: threeDaysAgo },
            ],
            todos: [
                { id: 'todo-1', project_id: 'proj-1', user_id: userId, title: 'Review structural engineering report', completed: false, priority: 'high', due_date: tomorrow, created_at: twoDaysAgo },
                { id: 'todo-2', project_id: 'proj-1', user_id: userId, title: 'Submit DA documents to council', completed: false, priority: 'high', due_date: new Date(Date.now() + 86400000 * 5).toISOString(), created_at: threeDaysAgo },
                { id: 'todo-3', project_id: 'proj-1', user_id: userId, title: 'Order kitchen benchtop samples', completed: false, priority: 'medium', due_date: nextWeek, created_at: yesterday },
                { id: 'todo-4', project_id: 'proj-1', user_id: userId, title: 'Schedule site meeting with builder', completed: true, priority: 'medium', due_date: yesterday, created_at: threeDaysAgo, completed_at: yesterday },
                { id: 'todo-5', project_id: 'proj-2', user_id: userId, title: 'Update project timeline', completed: false, priority: 'low', due_date: nextWeek, created_at: twoDaysAgo },
                { id: 'todo-6', project_id: 'proj-1', user_id: userId, title: 'Review tender submissions for electrical', completed: false, priority: 'high', due_date: inTwoWeeks, created_at: yesterday },
            ],
            activity_log: [
                { id: 'act-1', project_id: 'proj-1', user_id: userId, entity_type: 'document', entity_id: 'dg-1', action: 'uploaded', description: 'Uploaded architectural plans v2.pdf', created_at: twoHoursAgo, user_profile: { name: 'Richard Architect' }, project: { name: 'Luxury Villa Renovation' } },
                { id: 'act-2', project_id: 'proj-1', user_id: sarahId, entity_type: 'rfi', entity_id: 'rfi-1', action: 'created', description: 'Created RFI: Structural beam specification clarification', created_at: twoDaysAgo, user_profile: { name: 'Sarah Builder' }, project: { name: 'Luxury Villa Renovation' } },
                { id: 'act-3', project_id: 'proj-1', user_id: userId, entity_type: 'rfi', entity_id: 'rfi-3', action: 'responded', description: 'Responded to RFI: Bathroom waterproofing method', created_at: yesterday, user_profile: { name: 'Richard Architect' }, project: { name: 'Luxury Villa Renovation' } },
                { id: 'act-4', project_id: 'proj-1', user_id: jamesId, entity_type: 'tender', entity_id: 'tender-2', action: 'bid_submitted', description: 'Submitted bid for Electrical Installation Package', created_at: yesterday, user_profile: { name: 'James Contractor' }, project: { name: 'Luxury Villa Renovation' } },
                { id: 'act-5', project_id: 'proj-1', user_id: sarahId, entity_type: 'message', entity_id: 'msg-5', action: 'sent', description: 'Posted site progress update with photos', created_at: twoDaysAgo, user_profile: { name: 'Sarah Builder' }, project: { name: 'Luxury Villa Renovation' } },
                { id: 'act-6', project_id: 'proj-1', user_id: userId, entity_type: 'project', entity_id: 'proj-1', action: 'updated', description: 'Updated project stage to Construction Documentation', created_at: threeDaysAgo, user_profile: { name: 'Richard Architect' }, project: { name: 'Luxury Villa Renovation' } },
                { id: 'act-7', project_id: 'proj-2', user_id: userId, entity_type: 'document', entity_id: 'dg-8', action: 'uploaded', description: 'Uploaded concept design presentation', created_at: twoDaysAgo, user_profile: { name: 'Richard Architect' }, project: { name: 'City Apartment Complex' } },
                { id: 'act-8', project_id: 'proj-1', user_id: emmaId, entity_type: 'message', entity_id: 'msg-8', action: 'sent', description: 'Asked about kitchen benchtop options', created_at: yesterday, user_profile: { name: 'Emma Client' }, project: { name: 'Luxury Villa Renovation' } },
                { id: 'act-9', project_id: 'proj-1', user_id: userId, entity_type: 'tender', entity_id: 'tender-3', action: 'awarded', description: 'Awarded landscaping package to HomeVision Contracting', created_at: fiveDaysAgo, user_profile: { name: 'Richard Architect' }, project: { name: 'Luxury Villa Renovation' } },
                { id: 'act-10', project_id: 'proj-1', user_id: sarahId, entity_type: 'document', entity_id: 'dg-2', action: 'uploaded', description: 'Uploaded structural engineering report', created_at: twoDaysAgo, user_profile: { name: 'Sarah Builder' }, project: { name: 'Luxury Villa Renovation' } },
            ],
            notifications: [
                { id: 'notif-1', user_id: userId, type: 'info', title: 'New RFI Assigned', message: 'Sarah Builder raised RFI-0001: Structural beam specification clarification', read: false, data: { project_id: 'proj-1', rfi_id: 'rfi-1' }, created_at: twoDaysAgo },
                { id: 'notif-2', user_id: userId, type: 'info', title: 'Document Uploaded', message: 'Sarah Builder uploaded Structural Engineering Report to Luxury Villa Renovation', read: false, data: { project_id: 'proj-1', document_id: 'dg-2' }, created_at: twoDaysAgo },
                { id: 'notif-3', user_id: userId, type: 'success', title: 'Tender Bid Received', message: 'HomeVision Contracting submitted a bid of $42,500 for Electrical Installation Package', read: true, data: { project_id: 'proj-1', tender_id: 'tender-2' }, created_at: yesterday },
                { id: 'notif-4', user_id: userId, type: 'warning', title: 'RFI Overdue', message: 'RFI-0005: Electrical switchboard location is past its required date', read: false, data: { project_id: 'proj-1', rfi_id: 'rfi-6' }, created_at: yesterday },
                { id: 'notif-5', user_id: userId, type: 'info', title: 'New Message', message: 'Emma Client sent a message in Material Selection - Kitchen', read: false, data: { project_id: 'proj-1', thread_id: 'thread-3' }, created_at: yesterday },
            ],
            invitations: [
                { id: 'inv-1', project_id: 'proj-1', email: 'newmember@buildco.com', role: 'contractor', status: 'pending', token: 'inv_token_001', inviter_id: userId, expires_at: nextWeek, created_at: yesterday },
            ],
            project_budgets: [
                { id: 'pb-1', project_id: 'proj-1', original_budget: 1500000, revised_budget: 1620000, currency: 'AUD', created_at: fiveDaysAgo, updated_at: yesterday },
            ],
            project_invoices: [
                { id: 'inv-i-1', project_id: 'proj-1', invoice_number: 'INV-001', amount: 150000, status: 'paid', description: 'Demolition phase - Progress claim 1', issued_date: fiveDaysAgo, due_date: yesterday, paid_date: yesterday, created_at: fiveDaysAgo },
                { id: 'inv-i-2', project_id: 'proj-1', invoice_number: 'INV-002', amount: 85000, status: 'pending', description: 'Framing materials supply', issued_date: yesterday, due_date: nextWeek, paid_date: null, created_at: yesterday },
                { id: 'inv-i-3', project_id: 'proj-1', invoice_number: 'INV-003', amount: 42500, status: 'draft', description: 'Electrical installation - Phase 1', issued_date: null, due_date: null, paid_date: null, created_at: now },
            ],
            line_item_budgets: [
                { id: 'lib-1', project_id: 'proj-1', item_number: 1, item_name: 'Demolition & Site Prep', category: 'Preliminaries', total: 180000, contract_budget: 180000, claimed_to_date: 150000, balance_to_claim: 30000, created_at: fiveDaysAgo },
                { id: 'lib-2', project_id: 'proj-1', item_number: 2, item_name: 'Structural Framing', category: 'Structure', total: 320000, contract_budget: 320000, claimed_to_date: 0, balance_to_claim: 320000, created_at: fiveDaysAgo },
                { id: 'lib-3', project_id: 'proj-1', item_number: 3, item_name: 'Electrical Works', category: 'Services', total: 45000, contract_budget: 45000, claimed_to_date: 0, balance_to_claim: 45000, created_at: fiveDaysAgo },
                { id: 'lib-4', project_id: 'proj-1', item_number: 4, item_name: 'Plumbing Works', category: 'Services', total: 65000, contract_budget: 65000, claimed_to_date: 0, balance_to_claim: 65000, created_at: fiveDaysAgo },
                { id: 'lib-5', project_id: 'proj-1', item_number: 5, item_name: 'Kitchen Fitout', category: 'Finishes', total: 85000, contract_budget: 85000, claimed_to_date: 0, balance_to_claim: 85000, created_at: fiveDaysAgo },
            ],
            progress_claims: [
                { id: 'pc-1', project_id: 'proj-1', claim_number: 1, amount: 150000, status: 'approved', description: 'Demolition phase complete', submitted_date: threeDaysAgo, approved_date: yesterday, submitted_by: sarahId, created_at: threeDaysAgo },
            ],
            variations: [
                { id: 'var-1', project_id: 'proj-1', variation_number: 'V001', title: 'Additional pool heating system', description: 'Client requested heated pool system not in original scope', amount: 35000, status: 'approved', submitted_by: sarahId, approved_by: userId, created_at: twoDaysAgo },
                { id: 'var-2', project_id: 'proj-1', variation_number: 'V002', title: 'Upgraded bathroom fixtures', description: 'Premium tapware and fixtures upgrade for master ensuite', amount: 12000, status: 'pending', submitted_by: jamesId, approved_by: null, created_at: yesterday },
            ],
            payment_schedule_stages: [
                { id: 'pss-1', project_id: 'proj-1', stage_name: 'Deposit', percentage: 10, amount: 150000, status: 'paid', due_date: fiveDaysAgo, paid_date: fiveDaysAgo, created_at: fiveDaysAgo },
                { id: 'pss-2', project_id: 'proj-1', stage_name: 'Frame Stage', percentage: 20, amount: 300000, status: 'upcoming', due_date: nextWeek, paid_date: null, created_at: fiveDaysAgo },
                { id: 'pss-3', project_id: 'proj-1', stage_name: 'Lock-up Stage', percentage: 25, amount: 375000, status: 'upcoming', due_date: inTwoWeeks, paid_date: null, created_at: fiveDaysAgo },
            ],
            user_roles: [
                { id: 'ur-1', user_id: userId, role: 'admin', created_at: now },
            ],
            user_sessions: [],
            admin_alerts: [
                { id: 'aa-1', severity: 'warn', alert_type: 'pending_approvals', title: 'Pending User Approvals', message: '1 user waiting for approval', is_read: false, resolved_at: null, metadata: { count: 1 }, created_at: yesterday },
            ],
            audit_logs: [],
            system_metrics: [],
            project_pending_invitations: [],
            project_join_requests: [],
        };
    }

    public from(table: string) {
        if (!this.store[table]) {
            this.store[table] = [];
        }
        return new LocalQueryBuilder(this.store[table], table, this);
    }

    public notify(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', oldRecord: any, newRecord: any) {
        const channelName = `${table}-changes`;
        const listeners = this.listeners[channelName] || [];
        const payload = { eventType: event, new: newRecord, old: oldRecord, table, schema: 'public' };
        listeners.forEach(cb => cb(payload));
    }

    public subscribe(channel: string, callback: DBListener) {
        if (!this.listeners[channel]) {
            this.listeners[channel] = [];
        }
        this.listeners[channel].push(callback);
        return {
            unsubscribe: () => {
                this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
            }
        };
    }
}

class LocalQueryBuilder {
    private data: any[];
    private table: string;
    private db: LocalDatabase;
    private filters: ((item: any) => boolean)[] = [];
    private sorts: ((a: any, b: any) => number)[] = [];
    private limitCount?: number;
    private isSingle = false;
    private isMaybeSingle = false;

    constructor(data: any[], table: string, db: LocalDatabase) {
        this.data = data;
        this.table = table;
        this.db = db;
    }

    select(columns = '*', options?: any) {
        return this;
    }

    filter(column: string, operator: string, value: any) {
        if (operator === 'eq') this.filters.push(item => item[column] === value);
        else if (operator === 'neq') this.filters.push(item => item[column] !== value);
        else if (operator === 'in') this.filters.push(item => (value as any[]).includes(item[column]));
        return this;
    }

    // Filters
    eq(column: string, value: any) {
        this.filters.push(item => item[column] === value);
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push(item => item[column] !== value);
        return this;
    }

    in(column: string, values: any[]) {
        this.filters.push(item => values.includes(item[column]));
        return this;
    }

    contains(column: string, value: any) {
        this.filters.push(item => {
            const val = item[column];
            if (Array.isArray(val)) return val.includes(value);
            return JSON.stringify(val).includes(JSON.stringify(value));
        });
        return this;
    }

    gt(column: string, value: any) {
        this.filters.push(item => item[column] > value);
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push(item => item[column] >= value);
        return this;
    }

    lt(column: string, value: any) {
        this.filters.push(item => item[column] < value);
        return this;
    }

    lte(column: string, value: any) {
        this.filters.push(item => item[column] <= value);
        return this;
    }

    is(column: string, value: any) {
        this.filters.push(item => item[column] === value);
        return this;
    }

    ilike(column: string, pattern: string) {
        const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
        this.filters.push(item => regex.test(String(item[column] || '')));
        return this;
    }

    not(column: string, operator: string, value: any) {
        if (operator === 'eq') {
            this.filters.push(item => item[column] !== value);
        } else if (operator === 'is') {
            this.filters.push(item => item[column] !== value);
        } else if (operator === 'in') {
            this.filters.push(item => !value.includes(item[column]));
        }
        return this;
    }

    match(criteria: Record<string, any>) {
        Object.entries(criteria).forEach(([col, val]) => {
            this.filters.push(item => item[col] === val);
        });
        return this;
    }

    or(filterString: string) {
        // Parse basic or() filter strings like "status.eq.open,status.eq.draft"
        const parts = filterString.split(',');
        const orFilters: ((item: any) => boolean)[] = [];

        for (const part of parts) {
            const trimmed = part.trim();
            const dotParts = trimmed.split('.');
            if (dotParts.length >= 3) {
                const col = dotParts[0];
                const op = dotParts[1];
                const val = dotParts.slice(2).join('.');
                if (op === 'eq') {
                    orFilters.push(item => String(item[col]) === val);
                } else if (op === 'ilike') {
                    const regex = new RegExp(val.replace(/%/g, '.*'), 'i');
                    orFilters.push(item => regex.test(String(item[col] || '')));
                } else if (op === 'is') {
                    orFilters.push(item => item[col] === (val === 'null' ? null : val));
                }
            }
        }

        if (orFilters.length > 0) {
            this.filters.push(item => orFilters.some(f => f(item)));
        }
        return this;
    }

    textSearch(column: string, query: string) {
        const terms = query.toLowerCase().split(/\s+/);
        this.filters.push(item => {
            const val = String(item[column] || '').toLowerCase();
            return terms.some(t => val.includes(t));
        });
        return this;
    }

    // Modifiers
    order(column: string, { ascending = true } = {}) {
        this.sorts.push((a, b) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
        });
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    range(from: number, to: number) {
        // Simplified range - just limit
        this.limitCount = to - from + 1;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isMaybeSingle = true;
        return this;
    }

    // PromiseLike implementation so `await` works correctly
    then<TResult1 = { data: any; error: any; count?: number }, TResult2 = never>(
        onfulfilled?: ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return new Promise<{ data: any; error: any; count?: number }>((resolve, reject) => {
            try {
                let result = this.data.filter(item => this.filters.every(f => f(item)));
                const totalCount = result.length;
                for (const sort of this.sorts) { result.sort(sort); }
                if (this.limitCount) { result = result.slice(0, this.limitCount); }

                let data: any = result;
                if (this.isSingle) {
                    if (result.length === 0) return resolve({ data: null, error: { message: 'Row not found', code: 'PGRST116' } });
                    if (result.length > 1) return resolve({ data: null, error: { message: 'Multiple rows found', code: 'PGRST116' } });
                    data = result[0];
                } else if (this.isMaybeSingle) {
                    data = result.length > 0 ? result[0] : null;
                }

                resolve({ data, error: null, count: totalCount });
            } catch (err) {
                reject(err);
            }
        }).then(onfulfilled as any, onrejected);
    }

    // Mutations - return PromiseLike-compatible objects
    insert(rowOrRows: any): any {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const inserted = rows.map(r => ({
            id: r.id || generateUUID(),
            created_at: new Date().toISOString(),
            ...r
        }));

        this.data.push(...inserted);
        inserted.forEach(row => this.db.notify(this.table, 'INSERT', null, row));
        const result = Array.isArray(rowOrRows) ? inserted : inserted[0];

        const makePromiseLike = (data: any) => ({
            select: () => makePromiseLike(data),
            single: () => makePromiseLike(data),
            maybeSingle: () => makePromiseLike(data),
            then: (onfulfilled?: any, onrejected?: any) =>
                Promise.resolve({ data, error: null }).then(onfulfilled, onrejected),
        });
        return makePromiseLike(result);
    }

    upsert(rowOrRows: any, options?: { onConflict?: string }): any {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const conflictKey = options?.onConflict || 'id';
        const results: any[] = [];

        for (const row of rows) {
            const existingIndex = this.data.findIndex(item => item[conflictKey] === row[conflictKey]);
            if (existingIndex >= 0) {
                const old = { ...this.data[existingIndex] };
                Object.assign(this.data[existingIndex], row, { updated_at: new Date().toISOString() });
                this.db.notify(this.table, 'UPDATE', old, this.data[existingIndex]);
                results.push(this.data[existingIndex]);
            } else {
                const newRow = { id: row.id || generateUUID(), created_at: new Date().toISOString(), ...row };
                this.data.push(newRow);
                this.db.notify(this.table, 'INSERT', null, newRow);
                results.push(newRow);
            }
        }

        const result = Array.isArray(rowOrRows) ? results : results[0];
        const makePromiseLike = (data: any) => ({
            select: () => makePromiseLike(data),
            single: () => makePromiseLike(data),
            maybeSingle: () => makePromiseLike(data),
            then: (onfulfilled?: any, onrejected?: any) =>
                Promise.resolve({ data, error: null }).then(onfulfilled, onrejected),
        });
        return makePromiseLike(result);
    }

    update(updates: any): any {
        const matches = this.data.filter(item => this.filters.every(f => f(item)));
        const updated = matches.map(item => {
            const old = { ...item };
            Object.assign(item, updates, { updated_at: new Date().toISOString() });
            this.db.notify(this.table, 'UPDATE', old, item);
            return item;
        });

        const self = this;
        return {
            eq: (col: string, val: any) => { self.eq(col, val); return self.update(updates); },
            select: () => this,
            then: (onfulfilled?: any, onrejected?: any) =>
                Promise.resolve({ data: updated, error: null }).then(onfulfilled, onrejected),
        };
    }

    delete(..._args: any[]): any {
        const matches = this.data.filter(item => this.filters.every(f => f(item)));
        const matchIds = new Set(matches.map(m => m.id));

        for (let i = this.data.length - 1; i >= 0; i--) {
            if (matchIds.has(this.data[i].id)) {
                const removed = this.data[i];
                this.data.splice(i, 1);
                this.db.notify(this.table, 'DELETE', removed, null);
            }
        }

        const self = this;
        return {
            eq: (col: string, val: any) => { self.eq(col, val); return self.delete(); },
            then: (onfulfilled?: any, onrejected?: any) =>
                Promise.resolve({ data: matches, error: null }).then(onfulfilled, onrejected),
        };
    }
}

// Global Singleton
export const localDB = new LocalDatabase();
