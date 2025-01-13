'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

import * as z from "zod"
import { login } from '@/server/user'

const loginSchema = z.object({
  userName: z.string().min(1 ,{
    message: "Please enter a valid user name.",
  }),
  password: z.string().min(1, {
    message: "Password must be entered.",
  }),
})


export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      userName: "",
      password: "",
    },
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      await login(data.userName, data.password).then((res)=>{
        if(res.status === 'success'){
          router.push('/dashboard/new')
          setSuccess(true)
          setLoading(false)
        }else if(res.status === 'error'){
          setError(res.message)
          setLoading(false)
        }
      })
      
    } catch (err:any) {
      console.error(err)
      setError('Failed to log in. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">Enter your user name and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your user name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in ..." :"Login"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          {error && (
            <Alert variant="destructive" className="mt-4 w-full">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {
            success && (
              <Alert variant="default" className="mt-4 w-full">
                <AlertDescription>Login successful. Redirecting to dashboard...</AlertDescription>
              </Alert>
            )
          }

        </CardFooter>
      </Card>
    </div>
  )
}

