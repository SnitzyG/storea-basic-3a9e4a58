-- Phase 1 Final: Add RLS to 17 unprotected tables (corrected schemas)

-- Clean up test policies
DROP POLICY IF EXISTS "Users can manage their own todos" ON todos;
DROP POLICY IF EXISTS "Project members can view todos" ON todos;
DROP POLICY IF EXISTS "Users manage own todos" ON todos;
DROP POLICY IF EXISTS "Project members view todos" ON todos;
DROP POLICY IF EXISTS "todos_user_all" ON todos;
DROP POLICY IF EXISTS "todos_project_select" ON todos;

-- 1. todos
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todos_own" ON todos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_project" ON todos FOR SELECT USING (EXISTS (SELECT 1 FROM project_users WHERE project_users.project_id = todos.project_id AND project_users.user_id = auth.uid()));

-- 2-4. RFI tables
ALTER TABLE rfi_workflow_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfi_trans_view" ON rfi_workflow_transitions FOR SELECT USING (EXISTS (SELECT 1 FROM rfis WHERE rfis.id = rfi_workflow_transitions.rfi_id AND (rfis.raised_by = auth.uid() OR rfis.assigned_to = auth.uid())));
CREATE POLICY "rfi_trans_ins" ON rfi_workflow_transitions FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE rfi_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfi_act_view" ON rfi_activities FOR SELECT USING (EXISTS (SELECT 1 FROM rfis WHERE rfis.id = rfi_activities.rfi_id AND (rfis.raised_by = auth.uid() OR rfis.assigned_to = auth.uid())));
CREATE POLICY "rfi_act_ins" ON rfi_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE rfi_collaboration_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfi_com_view" ON rfi_collaboration_comments FOR SELECT USING (EXISTS (SELECT 1 FROM rfis WHERE rfis.id = rfi_collaboration_comments.rfi_id AND (rfis.raised_by = auth.uid() OR rfis.assigned_to = auth.uid())));
CREATE POLICY "rfi_com_ins" ON rfi_collaboration_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rfi_com_upd" ON rfi_collaboration_comments FOR UPDATE USING (auth.uid() = user_id);

-- 5-10. Tender tables
ALTER TABLE tender_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tli_issuer" ON tender_line_items FOR ALL USING (EXISTS (SELECT 1 FROM tenders WHERE tenders.id = tender_line_items.tender_id AND tenders.issued_by = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenders WHERE tenders.id = tender_line_items.tender_id AND tenders.issued_by = auth.uid()));
CREATE POLICY "tli_bidder" ON tender_line_items FOR SELECT USING (EXISTS (SELECT 1 FROM tender_access WHERE tender_access.tender_id = tender_line_items.tender_id AND tender_access.user_id = auth.uid() AND tender_access.status = 'approved'));

ALTER TABLE tender_bid_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tbli_owner" ON tender_bid_line_items FOR ALL USING (EXISTS (SELECT 1 FROM tender_bids WHERE tender_bids.id = tender_bid_line_items.bid_id AND tender_bids.bidder_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tender_bids WHERE tender_bids.id = tender_bid_line_items.bid_id AND tender_bids.bidder_id = auth.uid()));
CREATE POLICY "tbli_issuer" ON tender_bid_line_items FOR SELECT USING (EXISTS (SELECT 1 FROM tender_bids tb JOIN tenders t ON t.id = tb.tender_id WHERE tb.id = tender_bid_line_items.bid_id AND t.issued_by = auth.uid()));

ALTER TABLE tender_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ti_issuer" ON tender_invitations FOR ALL USING (EXISTS (SELECT 1 FROM tenders WHERE tenders.id = tender_invitations.tender_id AND tenders.issued_by = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenders WHERE tenders.id = tender_invitations.tender_id AND tenders.issued_by = auth.uid()));

ALTER TABLE tender_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tp_arch" ON tender_packages FOR ALL USING (EXISTS (SELECT 1 FROM project_users WHERE project_users.project_id = tender_packages.project_id AND project_users.user_id = auth.uid() AND project_users.role = 'architect'::user_role)) WITH CHECK (EXISTS (SELECT 1 FROM project_users WHERE project_users.project_id = tender_packages.project_id AND project_users.user_id = auth.uid() AND project_users.role = 'architect'::user_role));
CREATE POLICY "tp_view" ON tender_packages FOR SELECT USING (EXISTS (SELECT 1 FROM project_users WHERE project_users.project_id = tender_packages.project_id AND project_users.user_id = auth.uid()));

ALTER TABLE tender_package_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpd_arch" ON tender_package_documents FOR ALL USING (EXISTS (SELECT 1 FROM tenders WHERE tenders.id = tender_package_documents.tender_id AND tenders.issued_by = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenders WHERE tenders.id = tender_package_documents.tender_id AND tenders.issued_by = auth.uid()));

ALTER TABLE tender_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ta_own" ON tender_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ta_issuer" ON tender_access FOR ALL USING (EXISTS (SELECT 1 FROM tenders WHERE tenders.id = tender_access.tender_id AND tenders.issued_by = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM tenders WHERE tenders.id = tender_access.tender_id AND tenders.issued_by = auth.uid()));
CREATE POLICY "ta_req" ON tender_access FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 11. project_join_requests (requester_id not user_id)
ALTER TABLE project_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pjr_own" ON project_join_requests FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "pjr_member" ON project_join_requests FOR SELECT USING (EXISTS (SELECT 1 FROM project_users WHERE project_users.project_id = project_join_requests.project_id AND project_users.user_id = auth.uid()));
CREATE POLICY "pjr_arch" ON project_join_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM project_users WHERE project_users.project_id = project_join_requests.project_id AND project_users.user_id = auth.uid() AND project_users.role = 'architect'::user_role));
CREATE POLICY "pjr_ins" ON project_join_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- 12-16. Telemetry & Sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "us_own" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "us_sys" ON user_sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE telemetry_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ts_ins" ON telemetry_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ts_own" ON telemetry_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ts_admin" ON telemetry_sessions FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "te_ins" ON telemetry_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "te_admin" ON telemetry_events FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

ALTER TABLE telemetry_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terr_ins" ON telemetry_errors FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM telemetry_sessions WHERE telemetry_sessions.session_id = telemetry_errors.session_id AND telemetry_sessions.user_id = auth.uid()));
CREATE POLICY "terr_admin" ON telemetry_errors FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

ALTER TABLE telemetry_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tperf_ins" ON telemetry_performance FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM telemetry_sessions WHERE telemetry_sessions.session_id = telemetry_performance.session_id AND telemetry_sessions.user_id = auth.uid()));
CREATE POLICY "tperf_admin" ON telemetry_performance FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- 17. user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ur_own" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ur_admin" ON user_roles FOR ALL USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role)) WITH CHECK (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));