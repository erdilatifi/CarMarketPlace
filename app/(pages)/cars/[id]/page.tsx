'use client';

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CarImageCarousel from "@/components/component/CarImageCarousel";
import { toast } from "sonner";

type Car = {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  gearbox: string;
  fuel_type: string;
  seller_id: string;
  seller_username: string | null;
  created_at: string;
};

const CarDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const id = params?.id as string;
      if (!id) return;
      setLoading(true);

      try {
        // Fetch car data including seller_username
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        setCar(data as Car);
      } catch (err: any) {
        toast.error(err.message || "Failed to load car details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">Loading car details...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Car not found.</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 pt-28 px-6 pb-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              {car.brand} {car.model}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CarImageCarousel carId={car.id} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <p><strong>Year:</strong> {car.year}</p>
              <p><strong>Price:</strong> €{car.price.toLocaleString()}</p>
              <p><strong>Mileage:</strong> {car.mileage.toLocaleString()} km</p>
              <p><strong>Gearbox:</strong> {car.gearbox}</p>
              <p><strong>Fuel:</strong> {car.fuel_type}</p>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-gray-500 border-t pt-3">
            Seller: {car.seller_username || "Seller"}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CarDetailPage;
