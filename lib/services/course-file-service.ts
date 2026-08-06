'use client';

import { createClient } from '@/lib/supabase/client';

const COURSE_FILES_BUCKET = 'course-files';

export type CourseFile = {
  id: string;
  courseId: string;
  lessonId: string | null;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  resourceType: 'video' | 'pdf' | 'document' | 'spreadsheet' | 'archive' | 'image' | 'audio' | 'code' | 'dataset' | 'research_paper' | 'other';
  isDownloadable: boolean;
  isPreview: boolean;
  createdAt: string;
};

export type CourseFileWithUploader = CourseFile & {
  uploaderName?: string;
};

const ALLOWED_TYPES = [
  'video/mp4', 'video/webm', 'video/avi', 'video/mov',
  'application/pdf',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-zip-compressed',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript',
  'application/json', 'application/xml',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
  'application/x-r', 'application/x-r-project',
  'application/octet-stream',
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

function classifyResourceType(mimeType: string, fileName: string): CourseFile['resourceType'] {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  if (['ppt', 'pptx'].includes(ext) || mimeType.includes('powerpoint')) return 'document';
  if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) return 'document';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  if (['py', 'r', 'js', 'ts', 'java', 'cpp', 'c', 'sh', 'sql', 'go', 'rs'].includes(ext)) return 'code';
  if (['json', 'xml', 'txt', 'html', 'css'].includes(ext)) return 'code';
  if (ext === 'dat' || ext === 'fasta' || ext === 'fastq' || ext === 'bam' || ext === 'sam' || ext === 'vcf') return 'dataset';
  return 'other';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 500MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` };
  }
  // Allow octet-stream as fallback for unusual scientific file types
  if (file.type !== 'application/octet-stream' && !ALLOWED_TYPES.includes(file.type)) {
    // Check by extension as fallback
    const ext = file.name.split('.').pop()?.toLowerCase();
    const knownExtensions = ['mp4', 'webm', 'mov', 'avi', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx',
      'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'txt', 'csv', 'html', 'css', 'js', 'ts',
      'json', 'xml', 'mp3', 'wav', 'ogg', 'py', 'r', 'java', 'cpp', 'c', 'sh', 'sql', 'go', 'rs',
      'dat', 'fasta', 'fastq', 'bam', 'sam', 'vcf', 'bed', 'gff', 'gtf'];
    if (!ext || !knownExtensions.includes(ext)) {
      return { valid: false, error: `File type not supported. Supported: video, PDF, PPT, DOC, XLS, ZIP, images, audio, code, datasets.` };
    }
  }
  return { valid: true };
}

export async function uploadCourseFile(params: {
  file: File;
  courseId: string;
  lessonId?: string | null;
}): Promise<{ success: boolean; error?: string; filePath?: string; fileUrl?: string }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { success: false, error: 'Not authenticated' };

  const validation = validateFile(params.file);
  if (!validation.valid) return { success: false, error: validation.error };

  const resourceType = classifyResourceType(params.file.type, params.file.name);
  const ext = params.file.name.split('.').pop();
  const fileName = `${userId}/${params.courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(COURSE_FILES_BUCKET)
    .upload(filePath, params.file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from(COURSE_FILES_BUCKET)
    .getPublicUrl(filePath);

  return {
    success: true,
    filePath,
    fileUrl: urlData.publicUrl,
  };
}

export async function saveCourseFileRecord(params: {
  courseId: string;
  lessonId?: string | null;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  resourceType: CourseFile['resourceType'];
  isDownloadable?: boolean;
  isPreview?: boolean;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('course_files')
    .insert({
      course_id: params.courseId,
      lesson_id: params.lessonId ?? null,
      uploaded_by: userId,
      file_name: params.fileName,
      file_path: params.filePath,
      file_type: params.fileType,
      file_size: params.fileSize,
      resource_type: params.resourceType,
      is_downloadable: params.isDownloadable ?? true,
      is_preview: params.isPreview ?? false,
    })
    .select('id')
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data?.id };
}

export async function getCourseFiles(courseId: string): Promise<CourseFileWithUploader[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('course_files')
    .select('*, profiles!course_files_uploaded_by_fkey(full_name)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as Record<string, unknown> | null;
    return {
      id: row.id as string,
      courseId: row.course_id as string,
      lessonId: (row.lesson_id as string) ?? null,
      uploadedBy: row.uploaded_by as string,
      fileName: row.file_name as string,
      filePath: row.file_path as string,
      fileType: row.file_type as string,
      fileSize: row.file_size as number,
      resourceType: row.resource_type as CourseFile['resourceType'],
      isDownloadable: (row.is_downloadable as boolean) ?? true,
      isPreview: (row.is_preview as boolean) ?? false,
      createdAt: row.created_at as string,
      uploaderName: (profile?.full_name as string) ?? undefined,
    };
  });
}

export async function getLessonFiles(lessonId: string): Promise<CourseFile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('course_files')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    courseId: row.course_id as string,
    lessonId: (row.lesson_id as string) ?? null,
    uploadedBy: row.uploaded_by as string,
    fileName: row.file_name as string,
    filePath: row.file_path as string,
    fileType: row.file_type as string,
    fileSize: row.file_size as number,
    resourceType: row.resource_type as CourseFile['resourceType'],
    isDownloadable: (row.is_downloadable as boolean) ?? true,
    isPreview: (row.is_preview as boolean) ?? false,
    createdAt: row.created_at as string,
  }));
}

export async function deleteCourseFile(id: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(COURSE_FILES_BUCKET)
    .remove([filePath]);

  if (storageError) {
    // Continue anyway - the file might already be gone
  }

  // Delete from database
  const { error } = await supabase.from('course_files').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getDownloadUrl(filePath: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from(COURSE_FILES_BUCKET)
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  return data?.signedUrl ?? null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
