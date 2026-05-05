"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Menu } from "lucide-react"

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div 
      className="flex h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("/backgrounds/bg-abstract.webp")' }}
    >
      <div className="absolute inset-0 bg-slate-900/10 z-0"></div>
      <div className="relative z-10 flex h-full w-full flex-col lg:flex-row">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <img src="/Agafay-luxury-camp-w-120x40.webp" alt="Agafay Logo" className="h-8 w-auto object-contain" />
            <span className="font-bold">AGAFAY</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded-md">
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <Sidebar role="Staff" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/95 backdrop-blur-md shadow-2xl relative">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
