"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CarImageCarousel from "@/components/component/CarImageCarousel";
import CarImageUploader from "@/components/component/CarImageUploader";
import CarFormModal from "@/components/component/CardFormModal";
import { Car } from "@/app/(pages)/dashboard/page";

interface Props {
  car: Car;
  fetchCars: () => void;
  onDelete: (id: string) => void;
}

const CarCard: React.FC<Props> = ({ car, fetchCars, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{car.brand} {car.model}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <CarImageCarousel carId={car.id} />
        <p><strong>Year:</strong> {car.year}</p>
        <p><strong>Price:</strong> €{car.price}</p>
        <p><strong>Mileage:</strong> {car.mileage} km</p>
        <p><strong>Gearbox:</strong> {car.gearbox}</p>
        <p><strong>Fuel:</strong> {car.fuel_type}</p>

        <CarImageUploader carId={car.id} onUploadComplete={fetchCars} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <CarFormModal car={car} fetchCars={fetchCars} />
        <Button size="sm" variant="destructive" onClick={() => onDelete(car.id)}>Delete</Button>
      </CardFooter>
    </Card>
  );
};

export default CarCard;
