'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/utils/supabase/client'
import { toast } from "sonner"
import Spinner from '@/components/ui/spinner'
import Link from 'next/link'

const Page = () => {
  const supabase = createClient()

  const [role, setRole] = useState<'buyer' | 'seller'>('buyer') // default to client
  const [password, setPassword] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Check email for comfirmation!`)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Create your account</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Input
                  type="password"
                  placeholder="password..."
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Role selection: always one selected */}
            <div className="flex gap-6 mt-6 items-center justify-center">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="buyer"
                  checked={role === 'buyer'}
                  onCheckedChange={() => setRole('buyer')}
                />
                <Label htmlFor="buyer">buyer</Label>
              </div>

              {/* Seller */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="seller"
                  checked={role === 'seller'}
                  onCheckedChange={() => setRole('seller')} // switch role on click
                />
                <Label htmlFor="seller">Seller</Label>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Spinner />
                  <span>Creating account...</span>
                </div>
              ) : (
                'Sign Up'
              )}
            </Button>
          <p className='text-sm mt-2 text-gray-400'>Already have an account? <Link href={'/login'} className='text-gray-500 underline'>Log in</Link></p>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Page
