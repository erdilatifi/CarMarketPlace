"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CarImageCarousel from "@/components/component/CarImageCarousel";
import CarFormModal from "@/components/component/CardFormModal";
import { Car } from "@/app/(pages)/dashboard/page";

interface Props {
  car: Car;
  fetchCars: () => void;
  onDelete: (id: string) => void;
}

const CarCard: React.FC<Props> = ({ car, fetchCars, onDelete }) => {
  return (
    <Card className="group overflow-hidden bg-gradient-to-b from-[#121212] to-[#161616] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_50px_-12px_rgba(0,0,0,0.7)] hover:-translate-y-0.5">
      <CardHeader className="pb-0">
        <CardTitle className="text-white text-xl md:text-2xl font-bold tracking-tight">
          {car.brand} {car.model}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full h-64 rounded-xl overflow-hidden ring-1 ring-white/5 bg-neutral-900">
          <CarImageCarousel carId={car.id} />
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm md:text-base">
          <div className="text-muted-foreground">Year</div>
          <div className="text-white text-right">{car.year}</div>
          <div className="text-muted-foreground">Price</div>
          <div className="text-white text-right">€{car.price}</div>
          <div className="text-muted-foreground">Mileage</div>
          <div className="text-white text-right">{car.mileage} km</div>
          <div className="text-muted-foreground">Gearbox</div>
          <div className="text-white text-right">{car.gearbox}</div>
          <div className="text-muted-foreground">Fuel</div>
          <div className="text-white text-right">{car.fuel_type}</div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-0">
        <CarFormModal car={car} fetchCars={fetchCars} />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="pill" onClick={() => onDelete(car.id)}>Delete</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CarCard;
