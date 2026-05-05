"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { NumericKeypad } from "@/components/ui/NumericKeypad"
import { supabase } from "@/lib/supabase/client"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (pin: string) => {
    setLoading(true)
    setError("")

    try {
      const { data, error: sbError } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .single()

      if (sbError || !data) {
        setError("Invalid PIN. Please try again.")
        setLoading(false)
        return
      }

      // Store simple auth info in a cookie for middleware/layout checks
      // In a real prod app, use proper JWT or Supabase Auth. For this POS style with simple PIN:
      document.cookie = `auth_role=${data.role}; path=/; max-age=86400`
      document.cookie = `auth_id=${data.id}; path=/; max-age=86400`
      document.cookie = `auth_name=${data.name}; path=/; max-age=86400`

      // Log the login action
      await supabase.from('action_logs').insert({
        user_id: data.id,
        action_type: 'login',
        description: 'User logged in'
      })

      if (data.role === 'Manager') {
        router.push('/manager')
      } else {
        router.push('/staff/cash')
      }
    } catch (err) {
      setError("An error occurred.")
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("/backgrounds/bg-hotel.jpg")' }}
    >
      <div className="absolute inset-0 bg-slate-900/70 z-0 backdrop-blur-[2px]"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/Agafay-luxury-camp-w-120x40.webp" alt="Agafay Luxury Camp Logo" className="h-16 w-auto object-contain mb-4" />
          <p className="text-slate-300 font-medium tracking-wide">Caisse Dashboard</p>
        </div>
        <NumericKeypad onSubmit={handleLogin} loading={loading} error={error} />
      </div>
    </div>
  )
}
