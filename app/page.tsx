'use client';

import React, { useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import ReactPaginate from 'react-paginate'
import { Car } from './(pages)/dashboard/page'
import CarImageCarousel from '@/components/component/CarImageCarousel'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Spinner from '@/components/ui/spinner'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const HomePage = () => {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const [brand, setBrand] = useState('ALL')
  const [model, setModel] = useState('')
  const [mileage, setMileage] = useState<string>('')
  const [year, setYear] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)

  // pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 9

  const hasFilters = useMemo(
    () => Boolean((brand && brand !== 'ALL') || model || mileage || year),
    [brand, model, mileage, year]
  )

  // get session and userId once
  useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData.session?.user?.id ?? null
      setUserId(uid)
      return uid
    },
  })

  // available brands (distinct)
  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select('brand')
      if (error) throw error
      const unique = Array.from(new Set((data ?? []).map((r: any) => r.brand).filter(Boolean))) as string[]
      unique.sort((a, b) => a.localeCompare(b))
      return unique
    },
  })

  // cars list (depends on filters)
  const { data: cars = [], isLoading: loadingCars } = useQuery({
    queryKey: ['cars', { brand, model, mileage, year }],
    queryFn: async () => {
      let query = supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false })
      if (brand && brand !== 'ALL') query = query.ilike('brand', `%${brand}%`)
      if (model) query = query.ilike('model', `%${model}%`)
      if (year) query = query.eq('year', Number(year))
      if (mileage) query = query.lte('mileage', Number(mileage))
      const { data, error } = await query
      if (error) throw error
      setCurrentPage(0)
      return (data ?? []) as Car[]
    },
  })

  // favorites set when userId exists
  const { data: favoritesSet = new Set<string>(), isLoading: loadingFavs } = useQuery({
    queryKey: ['favoriteIds', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('car_id')
        .eq('user_id', userId)
      if (error) throw error
      return new Set((data ?? []).map((r: { car_id: string }) => r.car_id))
    },
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (carId: string) => {
      if (!userId) throw new Error('Please login to favorite cars')
      const isFav = favoritesSet.has(carId)
      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('car_id', carId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, car_id: carId })
        if (error) throw error
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favoriteIds'] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update favorite')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await queryClient.invalidateQueries({ queryKey: ['cars'] })
  }

  // pagination logic
  const pageCount = Math.ceil(cars.length / itemsPerPage)
  const offset = currentPage * itemsPerPage
  const currentItems = cars.slice(offset, offset + itemsPerPage)

  const handlePageClick = ({ selected }: { selected: number }) => {
    setCurrentPage(selected)
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 pt-28 px-6 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Search / Filter Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <Label className="mb-2">Brand</Label>
            <Select value={brand} onValueChange={(v) => setBrand(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <Input
            placeholder="Max Mileage"
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
          />
          <Input
            placeholder="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />

          <div className="col-span-1 md:col-span-2 flex gap-3">
            <Button type="submit" className="flex-1">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setBrand('ALL')
                setModel('')
                setMileage('')
                setYear('')
                queryClient.invalidateQueries({ queryKey: ['cars'] })
              }}
            >
              Reset
            </Button>
          </div>
        </form>

        {/* Cars Listing */}
        <div className="mt-8">
          {loadingCars || loadingFavs ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : cars.length === 0 ? (
            <p className="text-gray-500 text-center">No cars found.</p>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {currentItems.map((car) => {
                  const sellerLabel = car.seller_username || 'Seller'
                  const isFav = favoritesSet.has(car.id)

                  return (
                    <Link key={car.id} href={`/cars/${car.id}`} className="group relative">
                      <Card className="flex flex-col rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden">
                        {/* Favorite Button */}
                        <button
                          type="button"
                          aria-label="favorite"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleFavoriteMutation.mutate(car.id)
                          }}
                          className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm transition ${
                            isFav
                              ? 'bg-yellow-100 text-yellow-500'
                              : 'bg-white text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Star fill={isFav ? 'currentColor' : 'none'} className="w-5 h-5" />
                        </button>

                        <CarImageCarousel carId={car.id} />

                        <CardHeader>
                          <CardTitle className="text-base font-semibold">
                            {car.brand} {car.model}
                          </CardTitle>
                        </CardHeader>

                        <CardFooter className="text-xs text-gray-500 border-t pt-2">
                          Seller: {sellerLabel}
                        </CardFooter>
                      </Card>
                    </Link>
                  )
                })}
              </div>

              {/* Pagination */}
              {cars.length > itemsPerPage && (
                <div className="flex justify-center mt-10">
                  <ReactPaginate
                    previousLabel={'← Prev'}
                    nextLabel={'Next →'}
                    breakLabel={'...'}
                    pageCount={pageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageClick}
                    containerClassName={'flex gap-2 text-gray-700'}
                    pageClassName={'px-3 py-1 rounded-md border cursor-pointer'}
                    activeClassName={'bg-[#191919] text-white border-black'}
                    previousClassName={'px-3 py-1 rounded-md border cursor-pointer'}
                    nextClassName={'px-3 py-1 rounded-md border cursor-pointer'}
                    disabledClassName={'opacity-50 cursor-not-allowed'}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage
