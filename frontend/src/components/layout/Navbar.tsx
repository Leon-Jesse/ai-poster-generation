import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Palette, LogOut, Coins, Settings } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useEffect } from "react"
import { paymentService } from "@/services/paymentService"

export default function Navbar() {
  const { user, logout, setUser } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Refresh balance when location changes (e.g. after payment success) or on mount if user exists
    if (user) {
      const fetchBalance = async () => {
        try {
          const res = await paymentService.getBalance();
          if (res.code === 0) {
             // Update user object with new balance
             // We need to be careful not to overwrite other user data if getBalance only returns balance
             // But here we are just updating the local store state.
             // Ideally, we should update the auth store.
             // Let's assume user object in store can hold balance.
             setUser({ ...user, balance: res.data.balance });
          }
        } catch (error) {
          console.error("Failed to fetch balance", error);
        }
      }
      fetchBalance();
    }
  }, [location.pathname, user?.ID]); // Dependency on pathname to refresh on navigation

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Palette className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              AuraDraw
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/workspace"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Workspace
            </Link>
            <Link
              to="/gallery"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Gallery
            </Link>
            <Link
              to="/pricing"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other elements */}
          </div>
          <nav className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{user.balance ?? 0}</span>
                </div>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
