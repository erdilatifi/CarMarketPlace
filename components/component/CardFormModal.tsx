"use client";

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
import CarImageUploader from "@/components/component/CarImageUploader";

interface Props {
  car?: Car;
  fetchCars: () => void;
}

const CarFormModal: React.FC<Props> = ({ car, fetchCars }) => {
  const supabase = createClient();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(2020);
  const [price, setPrice] = useState<number>(0);
  const [mileage, setMileage] = useState<number>(0);
  const [gearbox, setGearbox] = useState("Manual");
  const [fuelType, setFuelType] = useState("Gasoline");
  const [saving, setSaving] = useState(false);
  const [newCarId, setNewCarId] = useState<string | null>(null);

  useEffect(() => {
    if (car) {
      setBrand(car.brand);
      setModel(car.model);
      setYear(car.year);
      setPrice(car.price);
      setMileage(car.mileage);
      setGearbox(car.gearbox);
      setFuelType(car.fuel_type);
      setNewCarId(null);
    } else {
      setBrand("");
      setModel("");
      setYear(new Date().getFullYear());
      setPrice(0);
      setMileage(0);
      setGearbox("Manual");
      setFuelType("Gasoline");
      setNewCarId(null);
    }
  }, [car, modalOpen]);

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
      seller_id: user.id 
    };
    
    let error, result;
    if (car) {
      ({ error } = await supabase.from("cars").update(payload).eq("id", car.id));
    } else {
      ({ data: result, error } = await supabase.from("cars").insert(payload).select().single());
      if (result && !error) {
        setNewCarId(result.id);
      }
    }
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Car saved successfully!");
      fetchCars();
      if (car) {
        setModalOpen(false);
      }
    }
    setSaving(false);
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button>{car ? "Edit" : "Add New Car"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{car ? "Edit Car" : "Add New Car"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2">Brand</Label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <Label  className="mb-2">Model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div>
            <Label  className="mb-2">Year</Label>
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <div>
            <Label  className="mb-2">Price (€)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <Label  className="mb-2">Mileage (km)</Label>
            <Input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} />
          </div>
          <div>
            <Label  className="mb-2">Gearbox</Label>
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
            <Label  className="mb-2">Fuel Type</Label>
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
          
          {/* Image uploader - only show for new cars after they're saved */}
          {!car && newCarId && (
            <div>
              <Label className="mb-2">Upload Images</Label>
              <CarImageUploader 
                carId={newCarId} 
                onUploadComplete={() => {
                  fetchCars();
                  toast.success("Images uploaded successfully!");
                }} 
              />
            </div>
          )}
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
