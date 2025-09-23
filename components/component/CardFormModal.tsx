'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Car } from "@/app/(pages)/dashboard/page";
import { useAuth } from "@/context/AuthContext";
import TempImageUploader from "@/components/component/TempImageUploader";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  car?: Car;
  fetchCars: () => void;
}

const CarFormModal: React.FC<Props> = ({ car, fetchCars }) => {
  const supabase = createClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [price, setPrice] = useState<number>(0);
  const [mileage, setMileage] = useState<number>(0);
  const [gearbox, setGearbox] = useState("Manual");
  const [fuelType, setFuelType] = useState("Gasoline");
  const [saving, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [description, setDescription] = useState<string>("");
  const [locationLat, setLocationLat] = useState<string>("");
  const [locationLng, setLocationLng] = useState<string>("");

  useEffect(() => {
    if (car) {
      setBrand(car.brand);
      setModel(car.model);
      setYear(car.year);
      setPrice(car.price);
      setMileage(car.mileage);
      setGearbox(car.gearbox);
      setFuelType(car.fuel_type);
      setSelectedImages([]);
      setDescription((car as any).description || "");
      setLocationLat(((car as any).location_lat ?? "").toString());
      setLocationLng(((car as any).location_lng ?? "").toString());
    } else {
      setBrand("");
      setModel("");
      setYear(new Date().getFullYear());
      setPrice(0);
      setMileage(0);
      setGearbox("Manual");
      setFuelType("Gasoline");
      setSelectedImages([]);
      setDescription("");
      setLocationLat("");
      setLocationLng("");
    }
  }, [car, modalOpen]);

  const uploadImages = async (carId: string, images: File[]) => {
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
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
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to save a car");
      return;
    }

    setSaving(true);

    const payload = {
      brand,
      model,
      year,
      price,
      mileage,
      gearbox,
      fuel_type: fuelType,
      seller_id: user.id, 
      seller_username: user.user_metadata?.full_name || 'No name set',
      seller_phone: user.user_metadata?.seller_phone || null,
      updated_at: new Date().toISOString(),
      description,
      location_lat: locationLat ? Number(locationLat) : null,
      location_lng: locationLng ? Number(locationLng) : null,
    };

    try {
      let result;

      if (car) {
        const { data, error } = await supabase
          .from("cars")
          .update(payload)
          .eq("id", car.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("cars")
          .insert(payload)
          .select()
          .single(); // ensures we get the new car id
        if (error) throw error;
        result = data;
      }

      // Upload images if any
      let uploadedCount = 0;
      if (selectedImages.length > 0 && result) {
        await uploadImages(result.id, selectedImages);
        uploadedCount = selectedImages.length;
      }

      const successMsg = uploadedCount > 0
        ? `Car saved successfully. Uploaded ${uploadedCount} image${uploadedCount === 1 ? '' : 's'}.`
        : "Car saved successfully.";
      toast.success(successMsg);
      // Refresh lists via TanStack Query invalidation
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cars'] }),
        queryClient.invalidateQueries({ queryKey: ['sellerCars'] }),
        queryClient.invalidateQueries({ queryKey: ['favoriteIds'] }),
      ]);
      fetchCars(); // keep compatibility for current page refresh
      setModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button>{car ? "Edit" : "Add New Car"}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{car ? "Edit Car" : "Add New Car"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2">Brand</Label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2">Model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2">Description</Label>
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the car (condition, features, etc.)"
            />
          </div>
          <div>
            <Label className="mb-2">Year</Label>
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-2">Price (€)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-2">Mileage (km)</Label>
            <Input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2">Location Latitude</Label>
              <Input
                type="number"
                step="any"
                value={locationLat}
                onChange={(e) => setLocationLat(e.target.value)}
                placeholder="e.g., 41.9028"
              />
            </div>
            <div>
              <Label className="mb-2">Location Longitude</Label>
              <Input
                type="number"
                step="any"
                value={locationLng}
                onChange={(e) => setLocationLng(e.target.value)}
                placeholder="e.g., 12.4964"
              />
            </div>
          </div>
          <div>
            <Label className="mb-2">Gearbox</Label>
            <Select value={gearbox} onValueChange={setGearbox}>
              <SelectTrigger><SelectValue placeholder="Select Gearbox" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Automatic">Automatic</SelectItem>
                <SelectItem value="Semi-automatic">Semi-automatic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2">Fuel Type</Label>
            <Select value={fuelType} onValueChange={setFuelType}>
              <SelectTrigger><SelectValue placeholder="Select Fuel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Gasoline">Gasoline</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <TempImageUploader 
              onImagesChange={setSelectedImages}
              maxImages={5}
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarFormModal;
