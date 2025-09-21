'use client';

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import ReactPaginate from "react-paginate";

import CarFormModal from "@/components/component/CardFormModal";
import CarCard from "@/components/component/CarCard";
import ConfirmationDialog from "@/components/ui/confirmation-dialog";

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
}

const PAGE_SIZE = 6;

const SellerDashboard = () => {
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCars = useCallback(
    async (pageNumber: number) => {
      if (!user) return;

      setLoadingCars(true);

      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("cars")
        .select("*", { count: "exact" })
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        toast.error(error.message);
      } else {
        setCars(data as Car[]);
        setTotalCount(count ?? 0);
      }

      setLoadingCars(false);
    },
    [supabase, user]
  );

  useEffect(() => {
    if (user) fetchCars(0);
  }, [user, fetchCars]);

  const handleDeleteClick = (id: string) => {
    setCarToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!carToDelete) return;

    const { error } = await supabase.from("cars").delete().eq("id", carToDelete);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Car listing deleted successfully!");
      fetchCars(currentPage); // refresh current page
    }

    setCarToDelete(null);
    setDeleteDialogOpen(false);
  };

  const pageCount = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageClick = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
    fetchCars(selected);
  };

  if (loading && cars.length === 0) {
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
          <CarFormModal fetchCars={() => fetchCars(0)} />
        </div>

        {/* Cars Grid */}
        {cars.length === 0 ? (
          <p className="text-center text-gray-500 mt-20 text-lg">
            You have no car listings yet.
          </p>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  fetchCars={() => fetchCars(currentPage)}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>

            {/* React Paginate */}
            {pageCount > 1 && (
              <div className="flex justify-center mt-6">
                <ReactPaginate
                  previousLabel={'← Previous'}
                  nextLabel={'Next →'}
                  breakLabel={'...'}
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={3}
                  onPageChange={handlePageClick}
                  containerClassName={'flex gap-2 text-gray-700'}
                  pageClassName={'px-3 py-1 rounded-md border cursor-pointer'}
                  activeClassName={'bg-blue-500 text-white border-blue-500'}
                  previousClassName={'px-3 py-1 rounded-md border cursor-pointer'}
                  nextClassName={'px-3 py-1 rounded-md border cursor-pointer'}
                  disabledClassName={'opacity-50 cursor-not-allowed'}
                />
              </div>
            )}

            {loadingCars && (
              <p className="text-center text-gray-500 mt-6">Loading cars...</p>
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
