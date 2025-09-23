'use client';

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import ReactPaginate from "react-paginate";

import CarFormModal from "@/components/component/CardFormModal";
import CarCard from "@/components/component/CarCard";
import ConfirmationDialog from "@/components/ui/confirmation-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/ui/spinner";

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
  seller_username: string | null;
  created_at: string;
  description?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
}

const PAGE_SIZE = 6;

const SellerDashboard = () => {
  const { user, loading } = useAuth();
  const supabase = createClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading: loadingCars } = useQuery({
    queryKey: ["sellerCars", user?.id, currentPage],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("cars")
        .select("*", { count: "exact" })
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { list: (data ?? []) as Car[], total: count ?? 0 };
    },
  });
  const cars = data?.list ?? [];
  const totalCount = data?.total ?? 0;

  const handleDeleteClick = (id: string) => {
    setCarToDelete(id);
    setDeleteDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cars").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Car listing deleted successfully!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sellerCars"] }),
        queryClient.invalidateQueries({ queryKey: ["cars"] }),
      ]);
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete"),
    onSettled: () => {
      setCarToDelete(null);
      setDeleteDialogOpen(false);
    }
  });

  const handleDeleteConfirm = async () => {
    if (!carToDelete) return;
    deleteMutation.mutate(carToDelete);
  };

  const pageCount = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
  };

  if (loading && cars.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Loading seller dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-6 py-10 md:py-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-black/40 backdrop-blur border border-white/10 p-6 rounded-2xl shadow-sm">
          <h1 className="mb-4 md:mb-0">
            Seller Dashboard
          </h1>
          <CarFormModal fetchCars={() => queryClient.invalidateQueries({ queryKey: ["sellerCars"] })} />
        </div>

        {/* Cars Grid */}
        {loadingCars ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : cars.length === 0 ? (
          <p className="text-center text-muted-foreground mt-20 text-lg">
            You have no car listings yet.
          </p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  fetchCars={() => queryClient.invalidateQueries({ queryKey: ["sellerCars"] })}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>

            {/* React Paginate */}
            {pageCount > 1 && (
<div className="flex justify-center mt-10">
  <ReactPaginate
    previousLabel="← Prev"
    nextLabel="Next →"
    breakLabel="..."
    pageCount={pageCount}
    marginPagesDisplayed={2}
    pageRangeDisplayed={3}
    onPageChange={handlePageClick}
    containerClassName="flex gap-3 text-sm font-medium items-center"
    
    pageClassName="px-4 py-2 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 
                   hover:bg-zinc-800 hover:text-white hover:border-zinc-500 
                   transition-colors duration-200 cursor-pointer"
    
    activeClassName="!bg-white !text-black !border-white shadow-md"
    
    previousClassName="px-5 py-2 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 
                       hover:bg-zinc-800 hover:text-white hover:border-zinc-500 
                       transition-colors duration-200 cursor-pointer"
    nextClassName="px-5 py-2 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 
                   hover:bg-zinc-800 hover:text-white hover:border-zinc-500 
                   transition-colors duration-200 cursor-pointer"
    
    breakClassName="px-4 py-2 rounded-full text-zinc-500"
    
    disabledClassName="opacity-40 cursor-not-allowed"
  />
</div>

            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Car Listing"
        description="Are you sure you want to delete this car listing? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default SellerDashboard;
