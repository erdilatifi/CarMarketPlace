"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Props {
  carId: string;
  onUploadComplete?: () => void;
}

const supabase = createClient();

const CarImageUploader: React.FC<Props> = ({ carId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${carId}/${Date.now()}-${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase
          .storage.from("car-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Insert record in car_images table
        const { error: dbError } = await supabase
          .from("car_images")
          .insert([{ car_id: carId, path: fileName }]);

        if (dbError) throw dbError;
      }

      toast.success("Images uploaded successfully!");
      onUploadComplete?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
    </div>
  );
};

export default CarImageUploader;
