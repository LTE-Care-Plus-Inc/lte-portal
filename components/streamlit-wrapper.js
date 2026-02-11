"use client"

export default function StreamlitApp({ url, title }) {
  const embedUrl = `${url}?embed=true&embed_options=dark_theme`;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-4 px-6">
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">{title}</h1>
          <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">Cloud Instance Active</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
           <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 w-full rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative">
        <iframe
          src={embedUrl}
          className="w-full h-full border-none"
          allow="camera;microphone;clipboard-read;clipboard-write;"
        />
      </div>
    </div>
  );
}