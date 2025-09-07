"use client";
/* eslint-disable no-unused-vars */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import runtimeConfig from "@/libs/app-config/runtime";

interface ImageUploadProps {
  label: string;
  description?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = runtimeConfig.limits.acceptedMimeTypes;
const MAX_SIZE_MB = runtimeConfig.limits.maxUploadsMB;

export function ImageUpload({
  label,
  description,
  value,
  onChange,
  accept = ACCEPTED_TYPES.join(","),
  maxSizeMB = MAX_SIZE_MB,
  required = false,
  disabled = false,
  className
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URL when file changes
  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [value]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Please upload a valid image file (JPEG, PNG, or WebP)`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  }, [maxSizeMB]);

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }

    setError(null);
    onChange(file);
  }, [validateFile, onChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    onChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Label */}
      <div>
        <label className="text-sm font-medium leading-none">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Upload Area */}
      {!value ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
            "hover:bg-muted/25 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={cn(
              "p-3 rounded-full",
              isDragOver ? "bg-primary/10" : "bg-muted"
            )}>
              <Upload className={cn(
                "h-6 w-6",
                isDragOver ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div>
              <p className="text-sm font-medium">
                {isDragOver ? "Drop your image here" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, or WebP up to {maxSizeMB}MB
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={label}
          />
        </div>
      ) : (
        /* Preview */
        <div className="relative rounded-lg border bg-card overflow-hidden">
          <div className="aspect-video relative">
            {preview && (
              <Image
                src={preview}
                alt="Upload preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            )}
          </div>
          
          {/* Overlay with file info and actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute top-2 right-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-primary-foreground text-sm font-medium truncate">
                {value.name}
              </p>
              <p className="text-primary-foreground/80 text-xs">
                {(value.size / (1024 * 1024)).toFixed(1)}MB
              </p>
            </div>
          </div>
          
          {/* Replace button */}
          <div className="p-3 border-t bg-muted/25">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={disabled}
              className="w-full"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Replace Image
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
            aria-label={`Replace ${label}`}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
