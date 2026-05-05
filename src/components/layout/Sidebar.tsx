"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calculator, CreditCard, Gift, FileArchive, LogOut, LayoutDashboard, Users, FileText, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

const staffNavigation = [
  { name: "Cash Rapport", href: "/staff/cash", icon: Calculator },
  { name: "TPE Rapport", href: "/staff/tpe", icon: CreditCard },
  { name: "Gratuité / DP / PC", href: "/staff/gratuite", icon: Gift },
  { name: "ZIP Receipts", href: "/staff/receipts", icon: FileArchive },
  { name: "Settings", href: "/staff/settings", icon: Settings },
]

const managerNavigation = [
  { name: "Dashboard", href: "/manager", icon: LayoutDashboard },
  { name: "Users", href: "/manager/users", icon: Users },
  { name: "Logs", href: "/manager/logs", icon: FileText },
]

export function Sidebar({ role }: { role: "Staff" | "Manager" }) {
  const pathname = usePathname()
  const navigation = role === "Staff" ? staffNavigation : managerNavigation
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    if (role === "Manager") {
      const fetchPending = async () => {
        const { count } = await supabase
          .from('pin_change_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        
        setPendingRequests(count || 0)
      }

      fetchPending()

      // Set up real-time subscription for new requests
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pin_change_requests' },
          () => {
            fetchPending()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [role])

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-slate-300">
      <div className="flex h-20 items-center justify-center flex-col px-4 pt-4 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <img src="/Agafay-luxury-camp-w-120x40.webp" alt="Agafay Logo" className="h-10 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <div className="flex flex-col">
            <span className="font-bold text-white text-lg tracking-tight leading-tight">AGAFAY</span>
            <span className="font-medium text-primary text-xs tracking-wider">Caisse Rapport</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center">
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </div>
                {item.name === "Users" && pendingRequests > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingRequests}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="border-t border-slate-800 p-4">
        <Link
          href="/"
          onClick={async () => {
            // Log logout action
            const staffId = document.cookie.split('; ').find(row => row.startsWith('auth_id='))?.split('=')[1]
            if (staffId) {
              await supabase.from('action_logs').insert({
                user_id: staffId,
                action_type: 'logout',
                description: 'User logged out'
              })
            }
            document.cookie = "auth_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            document.cookie = "auth_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            document.cookie = "auth_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
          }}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" />
          Logout
        </Link>
      </div>
    </div>
  )
}
