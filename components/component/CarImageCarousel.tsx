"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Spinner from "@/components/ui/spinner";

interface Props {
  carId: string;
}

const supabase = createClient();

const CarImageCarousel: React.FC<Props> = ({ carId }) => {
  const [index, setIndex] = useState(0);
  const { data: images, isLoading } = useQuery({
    queryKey: ["carImages", carId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_images")
        .select("path")
        .eq("car_id", carId);
      if (error) throw error;
      const urls = (data ?? [])
        .map((img) =>
          supabase.storage.from("car-images").getPublicUrl(img.path).data.publicUrl
        )
        .filter(Boolean) as string[];
      return urls;
    },
  });

  if (isLoading) {
    return (
      <div className="relative w-full h-64 flex items-center justify-center bg-neutral-900/80 overflow-hidden rounded-xl ring-1 ring-white/5">
        <Spinner />
      </div>
    );
  }

  if (!images || images.length === 0)
    return <p className="text-gray-500 text-sm">No images yet</p>;

  const prev = () => setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const next = () => setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="relative w-full h-64 flex items-center justify-center bg-neutral-900/80 overflow-hidden rounded-xl ring-1 ring-white/5 group">
      <img
        src={images[index]}
        alt={`Car image ${index + 1}`}
        className="object-contain w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.02]"
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
