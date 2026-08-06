import { createClient } from "@/lib/supabase/client";
import type { DbTeacher } from "@/lib/database-types";

export type TeacherInput = {
  name: string;
  display_name: string;
  profile_photo?: string | null;
  gender?: "male" | "female" | null;
  voice_provider?: string | null;
  voice_id?: string | null;
  teaching_style?: "friendly" | "professional" | "casual" | "academic" | null;
  languages?: string[];
  bio?: string | null;
  experience?: string | null;
  is_active?: boolean;
};

export async function listTeachers(): Promise<DbTeacher[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DbTeacher[];
}

export async function getTeacher(id: string): Promise<DbTeacher | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as DbTeacher | null;
}

export async function createTeacher(input: TeacherInput): Promise<DbTeacher> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("teachers")
    .insert({
      name: input.name,
      display_name: input.display_name,
      profile_photo: input.profile_photo ?? null,
      gender: input.gender ?? null,
      voice_provider: input.voice_provider ?? null,
      voice_id: input.voice_id ?? null,
      teaching_style: input.teaching_style ?? "friendly",
      languages: input.languages ?? ["en"],
      bio: input.bio ?? null,
      experience: input.experience ?? null,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data as unknown as DbTeacher;
}

export async function updateTeacher(id: string, updates: Partial<TeacherInput>): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("teachers")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function deleteTeacher(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  return !error;
}

export async function toggleTeacherActive(id: string, isActive: boolean): Promise<boolean> {
  return updateTeacher(id, { is_active: isActive });
}
