'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/ui/spinner'

const AppLoadingOverlay: React.FC = () => {
  const { loading } = useAuth()

  if (!loading) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 text-white">
        <Spinner size={20} />
        <span>Loading…</span>
      </div>
    </div>
  )
}

export default AppLoadingOverlay


