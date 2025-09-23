'use client'

import React from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Car } from '../dashboard/page'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Spinner from '@/components/ui/spinner'
import { loadThumbnails } from '@/utils/carUtils'


const FavoritesPage = () => {
  const { user, loading } = useAuth()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: favIds = new Set<string>(), isLoading: loadingFavIds } = useQuery({
    queryKey: ['favoriteIds', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('car_id')
        .eq('user_id', user!.id)
      if (error) throw error
      return new Set((data ?? []).map((r: { car_id: string }) => r.car_id))
    },
  })

  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ['favoriteCars', Array.from(favIds)],
    enabled: favIds.size > 0,
    queryFn: async () => {
      const ids = Array.from(favIds)
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .in('id', ids)
      if (error) throw error
      return (data ?? []) as Car[]
    }
  })

  const { data: thumbnails = {}, isLoading: loadingThumbs } = useQuery({
    queryKey: ['favoriteThumbs', favorites.map(f => f.id)],
    enabled: favorites.length > 0,
    queryFn: async () => loadThumbnails(favorites),
  })

  const toggleFavorite = useMutation({
    mutationFn: async (carId: string) => {
      if (!user) throw new Error('Not logged in')
      const isFav = favIds.has(carId)
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('car_id', carId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: user.id, car_id: carId })
        if (error) throw error
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['favoriteIds'] }),
        queryClient.invalidateQueries({ queryKey: ['favoriteCars'] }),
        queryClient.invalidateQueries({ queryKey: ['favoriteThumbs'] }),
      ])
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update favorite'),
  })

  if (loading || loadingFavIds) return <div className="flex justify-center mt-20"><Spinner /></div>

  return (
    <div className="min-h-screen pt-6 md:pt-8 px-6 pb-10">
      <div className="max-w-7xl mx-auto">
        <h2 className="mb-6">Your Favorites</h2>
        {loadingFavorites ? (
          <div className="flex justify-center"><Spinner /></div>
        ) : favorites.length === 0 ? (
          <p className="text-muted-foreground text-center">You have no favorite cars.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map(car => {
              const sellerLabel = car.seller_username || 'Seller'
              const isFav = favIds.has(car.id)
              const thumb = (thumbnails as Record<string, string>)[car.id]

              return (
                <Link key={car.id} href={`/cars/${car.id}`}>
                  <Card className="relative flex flex-col rounded-2xl bg-gradient-to-b from-[#121212] to-[#161616] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_50px_-12px_rgba(0,0,0,0.7)] transition overflow-hidden ring-1 ring-white/5">
                    <button
                      type="button"
                      aria-label="favorite"
                      onClick={(e) => { e.preventDefault(); toggleFavorite.mutate(car.id) }}
                      className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm transition border border-white/10 ${isFav ? 'bg-yellow-100 text-yellow-600' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                    >
                      <Star fill={isFav ? 'currentColor' : 'none'} className="w-5 h-5" />
                    </button>

                    {thumb ? (
                      <img src={thumb} alt={`${car.brand} ${car.model}`} className="w-full h-44 object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
                    ) : (
                      <div className="w-full h-44 bg-neutral-900/80" />
                    )}

                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-white">{car.brand} {car.model}</CardTitle>
                    </CardHeader>
                    <CardFooter className="text-xs text-muted-foreground border-t border-white/10 pt-2">
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
