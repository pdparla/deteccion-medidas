'use client';

import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewType } from '@/types/measurement';
import { VIEW_LABELS } from '@/types/session';

interface PhotoSlotProps {
  view: ViewType;
  file: File | null;
  dataUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
}

function PhotoSlot({ view, file, dataUrl, onFileSelect, onRemove }: PhotoSlotProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 text-center">{VIEW_LABELS[view]}</h3>

        {dataUrl ? (
          <div className="relative">
            <img
              src={dataUrl}
              alt={VIEW_LABELS[view]}
              className="w-full rounded-lg aspect-[3/4] object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <Check className="w-4 h-4" />
              </div>
              <Button
                onClick={onRemove}
                size="sm"
                variant="destructive"
                className="rounded-full p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              'border-2 border-dashed border-gray-300 rounded-lg',
              'aspect-[3/4] flex flex-col items-center justify-center',
              'hover:border-blue-500 hover:bg-blue-50/50 transition-colors',
              'cursor-pointer'
            )}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id={`file-input-${view}`}
            />
            <label
              htmlFor={`file-input-${view}`}
              className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-6 text-center"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                Arrastra una imagen o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG hasta 10MB
              </p>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PhotoUploadProps {
  photos: Record<ViewType, File | null>;
  photoUrls: Record<ViewType, string | null>;
  onPhotoChange: (view: ViewType, file: File) => void;
  onPhotoRemove: (view: ViewType) => void;
}

export function PhotoUpload({
  photos,
  photoUrls,
  onPhotoChange,
  onPhotoRemove,
}: PhotoUploadProps) {
  const views: ViewType[] = ['front', 'right', 'back', 'left'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {views.map((view) => (
        <PhotoSlot
          key={view}
          view={view}
          file={photos[view]}
          dataUrl={photoUrls[view]}
          onFileSelect={(file) => onPhotoChange(view, file)}
          onRemove={() => onPhotoRemove(view)}
        />
      ))}
    </div>
  );
}
