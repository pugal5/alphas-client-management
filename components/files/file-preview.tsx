'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileEntity as File } from '@/hooks/useFiles';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useDownloadFile } from '@/hooks/useFiles';

interface FilePreviewProps {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilePreview({ file, open, onOpenChange }: FilePreviewProps) {
  const downloadFile = useDownloadFile();

  const handleDownload = async () => {
    if (!file) return;
    try {
      const blob = await downloadFile.mutateAsync(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!file) return null;

  const isImage = file.type === 'image';
  const isVideo = file.type === 'video';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{file.name}</DialogTitle>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogHeader>
        <div className="mt-4">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-[70vh] mx-auto rounded-lg"
            />
          ) : isVideo ? (
            <video
              src={file.url}
              controls
              className="max-w-full max-h-[70vh] mx-auto rounded-lg"
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download to view
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

