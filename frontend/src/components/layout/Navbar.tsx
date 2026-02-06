import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Zap, LogOut, Coins, Settings } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useEffect, useState } from "react"
import { paymentService } from "@/services/paymentService"

export default function Navbar() {
  const { user, logout, fetchUser } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [lang, setLang] = useState<'en' | 'zh'>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('coverdesigner_lang')
      if (stored === 'en' || stored === 'zh') return stored
    }
    return 'zh'
  })
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  useEffect(() => {
    // Skip balance fetch on auth pages to avoid 401 loop
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/password');
    if (isAuthPage) {
      return;
    }

    // Refresh user info (including balance and free trials) when location changes or on mount if user exists
    if (user) {
      fetchUser();
    }
  }, [location.pathname, user?.ID]); // Dependency on pathname to refresh on navigation

  const setLanguage = (next: 'en' | 'zh') => {
    setLang(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('coverdesigner_lang', next)
    }
    setLangMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#050816]">
      <div className="container flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <Zap className="h-6 w-6 text-yellow-400" />
          <span className="bg-gradient-to-r from-[#7dd3fc] via-[#c4b5fd] to-[#f9a8d4] bg-clip-text text-xl font-bold tracking-wide text-transparent">
            CoverDesigner
          </span>
        </Link>

        {/* Center: Navigation links */}
        <nav className="hidden md:flex items-center gap-10 lg:gap-16">
          <Link
            to="/workspace"
            className="text-sm font-medium text-white hover:text-white/90 transition-colors"
          >
            {lang === 'en' ? 'Workspace' : '工作区'}
          </Link>
          <Link
            to="/gallery"
            className="text-sm font-medium text-white hover:text-white/90 transition-colors"
          >
            {lang === 'en' ? 'History' : '历史'}
          </Link>
          <Link
            to="/pricing"
            className="text-sm font-medium text-white hover:text-white/90 transition-colors"
          >
            {lang === 'en' ? 'Pricing' : '价格'}
          </Link>
        </nav>

        {/* Right: User actions */}
        <nav className="flex items-center gap-4">
          {/* Language selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLangMenuOpen((open) => !open)}
              className="text-sm text-white/80 hover:text-white hover:bg-white/10 px-2"
            >
              {lang === 'en' ? 'Language' : '语言'}
            </Button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-1 w-28 rounded-md border border-white/10 bg-[#020617] shadow-lg z-50">
                <button
                  type="button"
                  onClick={() => setLanguage('zh')}
                  className={`block w-full px-3 py-1.5 text-left text-xs ${
                    lang === 'zh' ? 'text-emerald-400 bg-white/5' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  中文
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`block w-full px-3 py-1.5 text-left text-xs ${
                    lang === 'en' ? 'text-emerald-400 bg-white/5' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  English
                </button>
              </div>
            )}
          </div>
          {user ? (
            <>
              {/* Balance */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <Coins className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">{user.balance ?? 0}</span>
              </div>
              {/* Email */}
              <span className="hidden md:inline-block text-sm text-white">
                {user.email}
              </span>
              {/* Settings */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/settings')}
                className="text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                {lang === 'en' ? 'Settings' : '设置'}
              </Button>
              {/* Logout */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {lang === 'en' ? 'Logout' : '退出'}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  {lang === 'en' ? 'Login' : '登录'}
                </Button>
              </Link>
              <Link to="/register">
                <Button 
                  size="sm" 
                  className="rounded-full bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ec4899] text-white hover:brightness-110 px-6"
                >
                  {lang === 'en' ? 'Sign up' : '注册'}
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
