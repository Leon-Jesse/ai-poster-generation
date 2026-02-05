import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[#1A1E29] text-slate-300">
        <div className="container mx-auto px-4 py-8">
          {/* Upper content area */}
          <div className="text-center mb-6">
            <p className="text-sm text-slate-300">
              上传你的照片,生成专属爆款封面!
            </p>
          </div>
          
          {/* Separator line */}
          <div className="border-t border-white/10 mb-6"></div>
          
          {/* Footer content */}
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Left: Copyright */}
            <p className="text-sm text-slate-300">
              © 2026 CoverMagic
            </p>
            
            {/* Right: Links */}
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                隐私政策
              </a>
              <a
                href="#"
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                服务条款
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
