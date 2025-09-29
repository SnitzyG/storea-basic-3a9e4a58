-- Complete the remaining RLS policies restoration

-- invitations policies
CREATE POLICY "Users can manage invitations for their projects" ON public.invitations
FOR ALL TO authenticated USING (
  project_id IN (
    SELECT projects.id
    FROM projects
    WHERE projects.created_by = auth.uid()
  )
)
WITH CHECK (
  project_id IN (
    SELECT projects.id
    FROM projects
    WHERE projects.created_by = auth.uid()
  )
);

-- message_participants policies
CREATE POLICY "Users can mark messages as read" ON public.message_participants
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their read status" ON public.message_participants
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view message participants for their projects" ON public.message_participants
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN project_users pu ON m.project_id = pu.project_id
    WHERE m.id = message_participants.message_id
      AND pu.user_id = auth.uid()
  )
);

-- message_threads policies
CREATE POLICY "Users can create message threads in their projects" ON public.message_threads
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = message_threads.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view message threads for their projects" ON public.message_threads
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = message_threads.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Only project members can see thread updates" ON public.message_threads
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = message_threads.project_id
      AND project_users.user_id = auth.uid()
  )
);

-- messages policies
CREATE POLICY "Users can send messages in their projects" ON public.messages
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = messages.project_id
      AND project_users.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages for their projects" ON public.messages
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users
    WHERE project_users.project_id = messages.project_id
      AND project_users.user_id = auth.uid()
  )
);

-- notifications policies
CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- profiles policies
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Project teammates can view each other's profiles" ON public.profiles
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM project_users me
    JOIN project_users teammate ON teammate.project_id = me.project_id
    WHERE me.user_id = auth.uid()
      AND teammate.user_id = profiles.user_id
  )
);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = user_id);