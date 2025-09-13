"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

import CarFormModal from "@/components/component/CardFormModal";
import CarCard from "@/components/component/CarCard";

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  gearbox: string;
  fuel_type: string;
  seller_id: string;
  created_at: string;
}

const SellerDashboard = () => {
  const { user, loading } = useAuth();
  const supabase = createClient();
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);

  // Fetch seller cars
  const fetchCars = async () => {
    if (!user) return;
    setLoadingCars(true);
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) toast.error(error.message);
    else setCars(data as Car[]);
    setLoadingCars(false);
  };

  useEffect(() => {
    fetchCars();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Car deleted!");
      fetchCars();
    }
  };

  if (loading || loadingCars) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg">Loading seller dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-6 py-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Seller Dashboard
          </h1>
          <CarFormModal fetchCars={fetchCars} />
        </div>

        {/* Cars Grid */}
        {cars.length === 0 ? (
          <p className="text-center text-gray-500 mt-20 text-lg">
            You have no car listings yet.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                fetchCars={fetchCars}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
