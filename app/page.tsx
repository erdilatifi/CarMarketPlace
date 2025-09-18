'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { Car } from './(pages)/dashboard/page'

const HomePage = () => {
  const supabase = createClient()

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [mileage, setMileage] = useState<string>('')
  const [year, setYear] = useState<string>('')

  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  const hasFilters = useMemo(() => Boolean(brand || model || mileage || year), [brand, model, mileage, year])

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData.session?.user?.id ?? null
      setUserId(uid)
      await fetchCars(uid)
    }
    init()
  }, [])

  const fetchCars = async (uid?: string) => {
    setLoading(true)
    try {
      let query = supabase.from('cars').select('*').order('created_at', { ascending: false })

      if (brand) query = query.ilike('brand', `%${brand}%`)
      if (model) query = query.ilike('model', `%${model}%`)
      if (year) query = query.eq('year', Number(year))
      if (mileage) query = query.lte('mileage', Number(mileage))

      const { data, error } = await query
      if (error) throw error

      const list = (data ?? []) as Car[]
      setCars(list)
      await loadThumbnails(list)

      if (uid) await loadFavorites(uid)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load cars')
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async (uid: string) => {
    const { data, error } = await supabase.from('favorites').select('car_id').eq('user_id', uid)
    if (error) return
    setFavorites(new Set((data ?? []).map((r: any) => r.car_id as string)))
  }

  const loadThumbnails = async (list: Car[]) => {
    const ids = Array.from(new Set(list.map((c) => c.id)))
    if (ids.length === 0) return
    const { data, error } = await supabase
      .from('car_images')
      .select('car_id, path, created_at')
      .in('car_id', ids)
      .order('created_at', { ascending: true })
    if (error) return
    const firstByCar: Record<string, string> = {}
    for (const row of (data as any[]) || []) {
      if (!firstByCar[row.car_id]) {
        const { data: pub } = supabase.storage.from('car-images').getPublicUrl(row.path)
        firstByCar[row.car_id] = pub.publicUrl
      }
    }
    setThumbnails((prev) => ({ ...prev, ...firstByCar }))
  }

  const toggleFavorite = async (carId: string) => {
    if (!userId) {
      toast.error('Please login to favorite cars')
      return
    }
    const isFav = favorites.has(carId)
    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('car_id', carId)
        if (error) throw error
        const next = new Set(favorites)
        next.delete(carId)
        setFavorites(next)
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: userId, car_id: carId })
        if (error) throw error
        const next = new Set(favorites)
        next.add(carId)
        setFavorites(next)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update favorite')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchCars(userId ?? undefined)
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 pt-28 px-6 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* Search / Filter Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <Input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
          <Input placeholder="Max Mileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          <Input placeholder="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />

          <div className="col-span-1 md:col-span-2 flex gap-3">
            <Button type="submit" className="flex-1">Search</Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setBrand('')
                setModel('')
                setMileage('')
                setYear('')
                fetchCars(userId ?? undefined)
              }}
            >
              Reset
            </Button>
          </div>
        </form>

        {/* Cars Listing */}
        <div className="mt-8">
          {loading ? (
            <p className="text-gray-500 text-center">Loading cars...</p>
          ) : cars.length === 0 ? (
            <p className="text-gray-500 text-center">No cars found.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((car) => {
                const sellerLabel = car.seller_username || 'Seller'
                const isFav = favorites.has(car.id)
                const thumb = thumbnails[car.id]

                return (
                  <Link key={car.id} href={`/cars/${car.id}`} className="group">
                    <Card className="relative flex flex-col rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden">
                      <button
                        type="button"
                        aria-label="favorite"
                        onClick={(e) => { e.preventDefault(); toggleFavorite(car.id) }}
                        className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm transition ${
                          isFav ? 'bg-yellow-100 text-yellow-500' : 'bg-white text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Star fill={isFav ? 'currentColor' : 'none'} className="w-5 h-5" />
                      </button>

                      {thumb ? (
                        <img src={thumb} alt={`${car.brand} ${car.model}`} className="w-full h-44 object-cover" />
                      ) : (
                        <div className="w-full h-44 bg-gray-200" />
                      )}

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
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage
