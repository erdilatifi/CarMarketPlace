'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {toast} from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { FaGoogle } from "react-icons/fa";
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

const LoginPage = () => {
  const supabase = createClient()
  const router = useRouter()

  const { signInWithGoogle, user } = useAuth();

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      router.replace('/')
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } 
    if(data){
        router.push('/');
    }
  }

const handleGoogle = async () => {
  setLoading(true);
  try {
  const result = await signInWithGoogle();
  if(result?.success){
    router.push('/');
  }
  } catch (err: any) {
    console.error(err);
    toast.error(err?.message || "An unexpected error occurred");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className='min-h-screen w-full flex items-center justify-center'>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className='text-center'>Login to your account</CardTitle>
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
              />
            </div>
            <div className="grid gap-2">
              <Input
                id="password"
                type="password"
                placeholder='password...'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='new-password'
              />
            </div>
          </form>
        </CardContent>

        <CardFooter className='flex flex-col gap-2'>
          <Button type="submit" className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span>Signing in...</span>
              </div>
            ) : (
              'Login'
            )}
          </Button>
          <Button variant={"outline"} type="submit" className="w-full" onClick={handleGoogle} disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
              
                <span>Redirecting to Google...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Login with</span>
                <FaGoogle  />
              </div>
            )}
          </Button>
          <p className='text-sm text-gray-400'>Don't have an account? <Link href={'/register'} className='text-gray-500 underline'>Register</Link></p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default LoginPage
