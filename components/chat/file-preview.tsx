"use client";

import * as React from "react";
import { X, File, Image as ImageIcon, FileText, FileCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilePreviewProps = {
  file: File;
  onRemove: () => void;
};

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  if (type.includes("code") || type.includes("text")) return FileCode;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const Icon = getFileIcon(file.type);
  const isImage = file.type.startsWith("image/");
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file, isImage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border"
    >
      {isImage && preview ? (
        <div className="relative h-12 w-12 rounded overflow-hidden shrink-0">
          <img
            src={preview}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-12 w-12 rounded bg-background border flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {file.type || "Unknown type"} • {formatFileSize(file.size)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

type FilePreviewListProps = {
  files: File[];
  onRemove: (index: number) => void;
};

export function FilePreviewList({ files, onRemove }: FilePreviewListProps) {
  return (
    <AnimatePresence>
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2 mb-2"
        >
          {files.map((file, index) => (
            <FilePreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => onRemove(index)}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

