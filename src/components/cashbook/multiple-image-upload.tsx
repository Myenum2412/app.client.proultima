'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MultipleImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number; // default 10
  maxSizeMB?: number; // default 10
  className?: string;
  acceptAllTypes?: boolean; // If true, accept all file types instead of just images
  acceptedMimeTypes?: string[]; // Specific mime types to accept (overrides acceptAllTypes/images default)
  label?: string; // Custom label text
  helperText?: string; // Optional helper text under instructions
}

interface FilePreview {
  file: File;
  preview?: string;
  size: string;
}

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function MultipleImageUpload({
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 10,
  className,
  acceptAllTypes = false,
  acceptedMimeTypes,
  label = 'Receipt/Bill Images (Optional)',
  helperText,
}: MultipleImageUploadProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveMimeTypes = acceptAllTypes
    ? undefined
    : acceptedMimeTypes && acceptedMimeTypes.length > 0
      ? acceptedMimeTypes
      : DEFAULT_IMAGE_TYPES;

  const validateFiles = (selected: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    selected.forEach((file, index) => {
      // Type validation when restrictions exist
      if (effectiveMimeTypes && !effectiveMimeTypes.includes(file.type)) {
        errors.push(
          `File ${index + 1}: Unsupported type (${file.type || 'unknown'}).`
        );
        return;
      }

      if (file.size > maxSizeBytes) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        errors.push(
          `File ${index + 1}: Too large (${sizeMB}MB). Max ${maxSizeMB}MB allowed.`
        );
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return;

    const selected = Array.from(fileList);

    if (files.length + selected.length > maxImages) {
      toast.error(`Maximum ${maxImages} files allowed. You can add ${maxImages - files.length} more.`);
      return;
    }

    const { valid, errors } = validateFiles(selected);

    if (errors.length) {
      errors.forEach((message) => toast.error(message));
    }

    if (valid.length) {
      const newPreviews: FilePreview[] = valid.map((file) => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        size: formatFileSize(file.size),
      }));

      const nextFiles = [...files, ...newPreviews];
      setFiles(nextFiles);
      onImagesChange(nextFiles.map((entry) => entry.file));
      toast.success(`${valid.length} file${valid.length > 1 ? 's' : ''} added successfully`);
    }
  };

  const removeFile = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    setFiles(nextFiles);
    onImagesChange(nextFiles.map((entry) => entry.file));
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const acceptedAttr = acceptAllTypes
    ? '*/*'
    : effectiveMimeTypes
        ?.map((type) => type)
        .join(',') || DEFAULT_IMAGE_TYPES.join(',');

  return (
    <div className={cn('space-y-4', className)}>
      <Label>{label}</Label>

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          handleFileSelect(event.dataTransfer.files);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragOver(false);
        }}
        onClick={openFilePicker}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-1">
          Click to upload or drag and drop files here
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxImages} file{maxImages > 1 ? 's' : ''}, {maxSizeMB}MB each{!acceptAllTypes && effectiveMimeTypes ? '' : ' (any type)'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedAttr}
          onChange={(event) => handleFileSelect(event.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Selected files ({files.length}/{maxImages})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFiles([]);
                onImagesChange([]);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {files.map((entry, index) => (
              <Card key={index} className="relative group overflow-hidden">
                <div className="relative h-32 bg-muted flex items-center justify-center">
                  {entry.preview ? (
                    <img
                      src={entry.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground px-3 text-center">
                      {entry.file.name}
                    </div>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="p-2 space-y-1">
                  <p className="text-xs text-muted-foreground truncate">{entry.file.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {entry.size}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <div>
          <p>• Maximum {maxImages} file{maxImages > 1 ? 's' : ''} allowed</p>
          <p>• Each file must be ≤{maxSizeMB}MB</p>
          {effectiveMimeTypes && !acceptAllTypes ? (
            <p>• Supported formats: {effectiveMimeTypes.join(', ')}</p>
          ) : null}
          {helperText ? <p>• {helperText}</p> : null}
        </div>
      </div>
    </div>
  );
}

