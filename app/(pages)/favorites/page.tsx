'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Car } from '../dashboard/page'


const FavoritesPage = () => {
  const { user, loading } = useAuth()
  const supabase = createClient()

  const [favorites, setFavorites] = useState<Car[]>([])
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [favIds, setFavIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) fetchFavorites()
  }, [user])

  const fetchFavorites = async () => {
    try {
      // 1️⃣ Get favorite car_ids
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('car_id')
        .eq('user_id', user?.id)

      if (favError) throw favError

      const ids = (favData ?? []).map((f: any) => f.car_id)
      setFavIds(new Set(ids))
      if (!ids.length) return

      // 2️⃣ Fetch car details including seller_username
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .in('id', ids)

      if (carsError) throw carsError

      const carsList = (carsData ?? []) as Car[]
      setFavorites(carsList)

      // 3️⃣ Load thumbnails
      await loadThumbnails(carsList)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load favorites')
    }
  }

  const loadThumbnails = async (list: Car[]) => {
    const ids = Array.from(new Set(list.map(c => c.id)))
    if (!ids.length) return

    const { data, error } = await supabase
      .from('car_images')
      .select('car_id, path')
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

    setThumbnails(firstByCar)
  }

  const toggleFavorite = async (carId: string) => {
    if (!user) return
    const isFav = favIds.has(carId)

    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('car_id', carId)
        if (error) throw error
        setFavIds(prev => {
          const next = new Set(prev)
          next.delete(carId)
          return next
        })
        setFavorites(prev => prev.filter(f => f.id !== carId))
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: user.id, car_id: carId })
        if (error) throw error
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update favorite')
    }
  }

  if (loading) return <p className="text-center mt-20">Loading...</p>

  return (
    <div className="min-h-screen pt-28 px-6 pb-10 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Your Favorites</h2>
        {favorites.length === 0 ? (
          <p className="text-gray-500 text-center">You have no favorite cars.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map(car => {
              const sellerLabel = car.seller_username || 'Seller'
              const isFav = favIds.has(car.id)
              const thumb = thumbnails[car.id]

              return (
                <Link key={car.id} href={`/cars/${car.id}`}>
                  <Card className="relative flex flex-col rounded-xl shadow-sm hover:shadow-lg transition overflow-hidden">
                    <button
                      type="button"
                      aria-label="favorite"
                      onClick={(e) => { e.preventDefault(); toggleFavorite(car.id) }}
                      className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm transition ${isFav ? 'bg-yellow-100 text-yellow-500' : 'bg-white text-gray-400 hover:text-gray-600'}`}
                    >
                      <Star fill={isFav ? 'currentColor' : 'none'} className="w-5 h-5" />
                    </button>

                    {thumb ? (
                      <img src={thumb} alt={`${car.brand} ${car.model}`} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gray-200" />
                    )}

                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{car.brand} {car.model}</CardTitle>
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
  )
}

export default FavoritesPage
