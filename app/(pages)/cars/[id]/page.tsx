'use client';

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CarImageCarousel from "@/components/component/CarImageCarousel";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import Spinner from "@/components/ui/spinner";
import { MessageCircle } from "lucide-react";

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
  seller_phone?: string | null;
  created_at: string;
  description?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
};

const CarDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const id = params?.id as string | undefined;

  const { data: car, isLoading: loading } = useQuery({
    queryKey: ["car", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Car;
    },
  });

  const phoneForWhatsapp = car?.seller_phone || "";
  const hasPhone = Boolean(phoneForWhatsapp && phoneForWhatsapp.trim().length > 0);
  const titleForMessage = car ? `${car.brand} ${car.model}` : "Car";
  const message = `Hi, I'm interested in the ${titleForMessage} (Listing ID: ${car?.id}). Is it still available?`;
  const encodedMessage = encodeURIComponent(message);
  const waLink = hasPhone ? `https://wa.me/${encodeURIComponent(phoneForWhatsapp)}?text=${encodedMessage}` : "";
  const [opening, setOpening] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Spinner />
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
            {car.description && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{car.description}</p>
              </div>
            )}
            {car.location_lat != null && car.location_lng != null && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="w-full h-64 rounded-md overflow-hidden border">
                  <iframe
                    title="Car Location"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${car.location_lng-0.01}%2C${car.location_lat-0.01}%2C${car.location_lng+0.01}%2C${car.location_lat+0.01}&layer=mapnik&marker=${car.location_lat}%2C${car.location_lng}`}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Coordinates: {car.location_lat.toFixed(5)}, {car.location_lng.toFixed(5)}</p>
                  <a
                    className="text-blue-600 underline"
                    href={`https://www.google.com/maps?q=${car.location_lat},${car.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-gray-500 border-t pt-3">
            <div className="flex flex-col gap-1">
              <span>Seller: {car.seller_username || "Seller"}</span>
              {hasPhone ? (
                <span>Phone: {phoneForWhatsapp}</span>
              ) : (
                <span className="text-xs text-gray-400">No phone provided for this listing</span>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setOpening(true);
              try {
                if (hasPhone && waLink) window.open(waLink, "_blank");
              } finally {
                setOpening(false);
              }
            }}
            disabled={!hasPhone}
            title={hasPhone ? "Open WhatsApp" : "No phone set for this listing"}
            className={`mt-2 inline-flex items-center gap-2 rounded-md text-white ${hasPhone ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            {opening ? <Spinner /> : <MessageCircle className="h-4 w-4" />}
            <span>Contact via WhatsApp</span>
          </Button>

          {hasPhone ? (
            <a
              href={`tel:${encodeURIComponent(phoneForWhatsapp)}`}
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-900 hover:bg-black text-white px-4 py-2"
            >
              <span>Call Seller</span>
            </a>
          ) : (
            <span
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-300 text-gray-600 px-4 py-2 cursor-not-allowed"
              title="No phone set for this listing"
            >
              Call Seller
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarDetailPage;
