'use client';

import { File } from '@/hooks/useFiles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText, Image, Video, Music } from 'lucide-react';
import { format } from 'date-fns';
import { useDeleteFile, useDownloadFile } from '@/hooks/useFiles';
import { Badge } from '@/components/ui/badge';

interface FileListProps {
  files: File[];
  onDelete?: () => void;
}

const fileTypeIcons = {
  image: Image,
  document: FileText,
  video: Video,
  audio: Music,
  other: FileText,
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export function FileList({ files, onDelete }: FileListProps) {
  const deleteFile = useDeleteFile();
  const downloadFile = useDownloadFile();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile.mutateAsync(id);
      onDelete?.();
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const blob = await downloadFile.mutateAsync(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const Icon = fileTypeIcons[file.type] || FileText;
        return (
          <Card key={file.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {format(new Date(file.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <Badge variant="outline">{file.type}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file.id, file.name)}
                    disabled={downloadFile.isPending}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    disabled={deleteFile.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

