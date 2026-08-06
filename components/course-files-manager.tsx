'use client';

import * as React from 'react';
import { Upload, File as FileIcon, Download, Trash2, Loader as Loader2, Eye, FileText, Image as ImageIcon, Archive, Video, FileCode, FileSpreadsheet, Lock, Clock as Unlock, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { uploadCourseFile, saveCourseFileRecord, getCourseFiles, deleteCourseFile, validateFile, formatFileSize, type CourseFileWithUploader, type CourseFile } from '@/lib/services/course-file-service';
import { cn } from '@/lib/utils';

type Module = { id: string; title: string };
type Lesson = { id: string; title: string; module_id: string };

export function CourseFilesManager({ courseId, modules: moduleData }: { courseId: string; modules: Module[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = React.useState<CourseFileWithUploader[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [showUpload, setShowUpload] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [linkToLesson, setLinkToLesson] = React.useState<string>('');
  const [isDownloadable, setIsDownloadable] = React.useState(true);
  const [isPreview, setIsPreview] = React.useState(false);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);

  const loadFiles = React.useCallback(async () => {
    const data = await getCourseFiles(courseId);
    setFiles(data);
    setLoading(false);
  }, [courseId]);

  const loadLessons = React.useCallback(async () => {
    if (moduleData.length === 0) return;
    const moduleIds = moduleData.map((m) => m.id);
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { data } = await supabase.from('lessons').select('id, title, module_id').in('module_id', moduleIds).order('order_index', { ascending: true });
    setLessons((data ?? []) as Lesson[]);
  }, [moduleData]);

  React.useEffect(() => { loadFiles(); loadLessons(); }, [loadFiles, loadLessons]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    const validation = validateFile(selectedFile);
    if (!validation.valid) { toast({ title: 'Invalid file', description: validation.error, variant: 'destructive' }); return; }

    setUploading(true);
    const result = await uploadCourseFile({ file: selectedFile, courseId, lessonId: linkToLesson || null });
    if (!result.success || !result.filePath) {
      toast({ title: 'Upload failed', description: result.error, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const resourceType = classifyType(selectedFile.type, selectedFile.name);
    const saveResult = await saveCourseFileRecord({
      courseId, lessonId: linkToLesson || null,
      fileName: selectedFile.name, filePath: result.filePath,
      fileType: selectedFile.type, fileSize: selectedFile.size,
      resourceType, isDownloadable, isPreview,
    });

    if (!saveResult.success) {
      toast({ title: 'Save failed', description: saveResult.error, variant: 'destructive' });
    } else {
      toast({ title: 'File uploaded successfully' });
      setShowUpload(false); setSelectedFile(null); setLinkToLesson(''); setIsDownloadable(true); setIsPreview(false);
      loadFiles();
    }
    setUploading(false);
  };

  const handleDelete = async (file: CourseFileWithUploader) => {
    const result = await deleteCourseFile(file.id, file.filePath);
    if (result.success) { toast({ title: 'File deleted' }); loadFiles(); }
    else toast({ title: 'Delete failed', description: result.error, variant: 'destructive' });
  };

  const handleDownload = async (file: CourseFileWithUploader) => {
    const supabase = (await import('@/lib/supabase/client')).createClient();
    const { data } = await supabase.storage.from('course-files').createSignedUrl(file.filePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    else toast({ title: 'Could not generate download link', variant: 'destructive' });
  };

  const resourceIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'pdf': return FileText;
      case 'document': return FileText;
      case 'spreadsheet': return FileSpreadsheet;
      case 'archive': return Archive;
      case 'image': return ImageIcon;
      case 'code': return FileCode;
      default: return FileIcon;
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Course Files</h3>
          <p className="text-sm text-muted-foreground">Upload and manage learning materials for this course.</p>
        </div>
        <Button onClick={() => setShowUpload(true)} size="sm"><Upload className="mr-2 h-4 w-4" /> Upload File</Button>
      </div>

      {files.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {files.map((file) => {
            const Icon = resourceIcon(file.resourceType);
            const linkedLesson = lessons.find((l) => l.id === file.lessonId);
            return (
              <Card key={file.id} className="p-4 shadow-soft transition-all hover:shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.fileName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] capitalize">{file.resourceType}</Badge>
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</span>
                      {file.isPreview ? <Badge variant="outline" className="text-[10px] text-emerald-600"><Unlock className="mr-0.5 h-2.5 w-2.5" />Preview</Badge> : <Badge variant="outline" className="text-[10px]"><Lock className="mr-0.5 h-2.5 w-2.5" />Enrolled</Badge>}
                      {linkedLesson && <Badge variant="outline" className="text-[10px]">{linkedLesson.title}</Badge>}
                    </div>
                    {file.uploaderName && <p className="mt-1 text-xs text-muted-foreground">by {file.uploaderName}</p>}
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(file)}><Download className="mr-1 h-3.5 w-3.5" />Download</Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-rose-600" onClick={() => handleDelete(file)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 shadow-soft">
          <div className="text-center">
            <FileIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No files uploaded yet</p>
            <p className="text-sm text-muted-foreground">Upload PDFs, videos, documents, and other learning materials.</p>
            <Button onClick={() => setShowUpload(true)} className="mt-4" size="sm"><Upload className="mr-2 h-4 w-4" /> Upload First File</Button>
          </div>
        </Card>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
          <Card className="w-full max-w-md p-6 shadow-float" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Upload File</h3>
              <button onClick={() => setShowUpload(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>File</Label>
                <div className="rounded-lg border-2 border-dashed p-6 text-center">
                  <input type="file" id="course-file-input" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="hidden" />
                  <label htmlFor="course-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{selectedFile ? selectedFile.name : 'Click to select a file'}</span>
                    <span className="text-xs text-muted-foreground">PDF, PPT, DOC, XLS, ZIP, Images, Videos (max 500MB)</span>
                  </label>
                </div>
              </div>
              {lessons.length > 0 && (
                <div className="space-y-2"><Label>Link to Lesson (optional)</Label>
                  <select value={linkToLesson} onChange={(e) => setLinkToLesson(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">No specific lesson</option>
                    {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isDownloadable} onChange={(e) => setIsDownloadable(e.target.checked)} className="h-4 w-4 rounded border-border" /> Downloadable</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="h-4 w-4 rounded border-border" /> Free Preview</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="flex-1">
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function classifyType(mimeType: string, fileName: string): CourseFile['resourceType'] {
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
  return 'other';
}
