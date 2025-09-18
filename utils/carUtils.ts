import { createClient } from '@/utils/supabase/client'

export const supabase = createClient()

export async function loadSellerNames(carList: { seller_id: string }[]) {
  const uniqueSellerIds = Array.from(new Set(carList.map(c => c.seller_id))).filter(Boolean)
  if (!uniqueSellerIds.length) return {}

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uniqueSellerIds)

  const map: Record<string, string> = {}
  for (const row of data || []) {
    map[row.id] = row.full_name || 'Seller'
  }
  return map
}

export async function loadThumbnails(carList: { id: string }[]) {
  const ids = Array.from(new Set(carList.map(c => c.id)))
  if (!ids.length) return {}

  const { data } = await supabase
    .from('car_images')
    .select('car_id, path, created_at')
    .in('car_id', ids)
    .order('created_at', { ascending: true })

  const firstByCar: Record<string, string> = {}
  for (const row of (data as any[]) || []) {
    if (!firstByCar[row.car_id]) {
      const { data: pub } = supabase.storage.from('car-images').getPublicUrl(row.path)
      firstByCar[row.car_id] = pub.publicUrl
    }
  }
  return firstByCar
}
