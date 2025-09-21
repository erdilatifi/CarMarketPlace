'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { FaGoogle } from 'react-icons/fa'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const LoginPage: React.FC = () => {
  const supabase = createClient()
  const router = useRouter()
  const { signInWithGoogle, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/')
    }
  }, [user, router])

  // Email/password login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    if (data?.user) {
      router.replace('/')
    }
  }

  // Google login
  const handleGoogle = async () => {
    setLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result?.success) {
        router.replace('/')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">Login to your account</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="grid gap-2">
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            {loading ? (
              <span>Redirecting to Google...</span>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Login with</span>
                <FaGoogle />
              </div>
            )}
          </Button>

          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-gray-500 underline">
              Register
            </Link>
          </p>

          <p className="text-sm text-gray-400">
            <Link href="/reset-password" className="text-gray-500 underline">
              Forgot password?
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default LoginPage
