"use client"
import { LayoutGrid, ArrowLeft } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
      
      {/* Visual Element */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-brand-blue/20 blur-[100px] rounded-full" />
        <div className="relative bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
          <LayoutGrid size={48} className="text-brand-blue rotate-90 opacity-80" />
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
          System Ready
        </h1>
        
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Authenticated</span>
          </div>
        </div>

        <p className="text-white/30 text-xs font-bold uppercase tracking-[0.3em] max-w-[280px] leading-loose pt-4">
          Select an application from the sidebar to begin operations
        </p>
      </div>

      {/* Decorative Arrow Hint (pointing to your hidden sidebar) */}
      <div className="absolute left-12 bottom-12 animate-bounce">
         <div className="flex items-center gap-4 opacity-20">
            <ArrowLeft size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Menu</span>
         </div>
      </div>
    </div>
  )
}