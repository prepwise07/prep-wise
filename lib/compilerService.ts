import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export interface ProjectData {
    id?: string;
    name: string;
    language: string;
    files: any;
}

export async function saveProject(project: ProjectData) {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Authentication required to save projects.");

    const { data, error } = await supabase
        .from("ide_projects")
        .upsert({
            id: project.id === "temp" ? undefined : project.id,
            user_id: user.id,
            name: project.name,
            language: project.language,
            files: project.files,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getProjects() {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
        .from("ide_projects")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function shareProject(projectId: string) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
        .from("ide_shares")
        .insert({ project_id: projectId })
        .select()
        .single();

    if (error) throw error;
    const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${origin}/shared/${data.id}`;
}

export async function getSharedProject(shareId: string) {
    const supabase = createSupabaseBrowserClient();
    const { data: shareData, error: shareError } = await supabase
        .from("ide_shares")
        .select("project_id")
        .eq("id", shareId)
        .single();

    if (shareError) throw shareError;

    const { data: projectData, error: projectError } = await supabase
        .from("ide_projects")
        .select("*")
        .eq("id", shareData.project_id)
        .single();

    if (projectError) throw projectError;
    return projectData;
}
