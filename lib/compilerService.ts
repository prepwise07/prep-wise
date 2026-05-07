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
    return `http://localhost:3000/shared/${data.id}`;
}
