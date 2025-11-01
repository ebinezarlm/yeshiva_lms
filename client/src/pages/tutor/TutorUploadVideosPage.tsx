import UnifiedVideoManager from '@/components/UnifiedVideoManager';

export default function TutorUploadVideosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Upload Videos</h1>
        <p className="text-muted-foreground">
          Add videos from YouTube, Vimeo, Google Drive, or upload files directly
        </p>
      </div>

      <UnifiedVideoManager />
    </div>
  );
}
