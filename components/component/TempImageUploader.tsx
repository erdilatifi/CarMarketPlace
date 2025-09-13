"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
}

const TempImageUploader: React.FC<Props> = ({ onImagesChange, maxImages = 5 }) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).slice(0, maxImages - selectedImages.length);
    
    if (selectedImages.length + newImages.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    const updatedImages = [...selectedImages, ...newImages];
    setSelectedImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const removeImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-3">
      <Label>Upload Images ({selectedImages.length}/{maxImages})</Label>
      
      {selectedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {selectedImages.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(image)}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-md border"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => removeImage(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {selectedImages.length < maxImages && (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500">
            Select up to {maxImages - selectedImages.length} more images
          </p>
        </div>
      )}
      
      {selectedImages.length >= maxImages && (
        <p className="text-sm text-gray-500">
          Maximum {maxImages} images reached
        </p>
      )}
    </div>
  );
};

export default TempImageUploader;
