import { Sidebar } from "@/components/layout/Sidebar"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div 
      className="flex h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("/backgrounds/bg-pool.webp")' }}
    >
      <div className="absolute inset-0 bg-slate-900/20 z-0"></div>
      <div className="relative z-10 flex h-full w-full">
        <Sidebar role="Manager" />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white/95 backdrop-blur-md shadow-2xl relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
