"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  carId: string;
}

const supabase = createClient();

const CarImageCarousel: React.FC<Props> = ({ carId }) => {
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("car_images")
      .select("path")
      .eq("car_id", carId);

    if (error) {
      console.error(error);
      return;
    }

    const urls = data
      .map((img) =>
        supabase.storage.from("car-images").getPublicUrl(img.path).data.publicUrl
      )
      .filter(Boolean) as string[];

    setImages(urls);
  };

  useEffect(() => {
    fetchImages();
  }, [carId]);

  if (images.length === 0) return <p className="text-gray-500 text-sm">No images yet</p>;

  const prev = () => setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const next = () => setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative w-full h-64 flex items-center justify-center bg-gray-100 overflow-hidden rounded-md">
      <img
        src={images[index]}
        alt={`Car image ${index + 1}`}
        className="object-contain w-full h-full transition-all"
        loading="lazy"
      />

      {images.length > 1 && (
        <>
          <Button
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
            onClick={prev}
            size="sm"
          >
            <ChevronLeft />
          </Button>
          <Button
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
            onClick={next}
            size="sm"
          >
            <ChevronRight />
          </Button>
        </>
      )}
    </div>
  );
};

export default CarImageCarousel;
