import { supabase } from "@/integrations/supabase/client";

export async function ensureTenderDraft(params: {
  projectId: string;
  title?: string;
  project_address?: string;
  client_name?: string;
  deadline?: string;
}): Promise<string> {
  const { projectId, title, project_address, client_name, deadline } = params;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  
  const base: any = {
    project_id: projectId,
    title: title?.trim() || "Untitled Tender",
    project_address: project_address || null,
    client_name: client_name || null,
    deadline: deadline || null,
    status: "draft",
    issued_by: user.id
  };
  
  const { data, error } = await supabase
    .from("tenders")
    .insert([base])
    .select("id")
    .single();
    
  if (error) throw error;
  return data.id;
}
