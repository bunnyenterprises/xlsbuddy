import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GridFour, ChartLine, BookOpen, ChatCircleDots, SignOut, User as UserIcon,
  List, X, Crown, Star, Tag, Shield, BookmarkSimple, Moon, Sun, Sparkle,
} from "@phosphor-icons/react";

export const Header = () => {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: GridFour },
    { to: "/functions", label: "Functions", icon: ChartLine },
    { to: "/tutorials", label: "Tutorials", icon: BookOpen },
    { to: "/chat", label: "AI Chat", icon: ChatCircleDots },
    { to: "/formula-generator", label: "Formula AI", icon: Sparkle },
    { to: "/pricing", label: "Pricing", icon: Tag },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-950 dark:border-white/10 border-b border-foreground/15" data-testid="app-header">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group" data-testid="brand-link">
          <div className="w-7 h-7 bg-klein flex items-center justify-center">
            <span className="text-white font-black text-sm">X</span>
          </div>
          <span className="font-black tracking-tight text-lg dark:text-white">XLS<span className="klein">Buddy</span></span>
        </Link>

        {user && (
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border ${
                    active ? "bg-klein text-white border-klein" : "border-transparent hover:border-foreground/20 dark:text-gray-300 dark:hover:border-white/20"
                  }`}
                >
                  <Icon size={15} weight={active ? "fill" : "regular"} />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="h-9 w-9 flex items-center justify-center border border-foreground/15 dark:border-white/15 hover:bg-secondary dark:hover:bg-white/10 transition-colors"
            data-testid="dark-mode-toggle"
          >
            {dark ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
          </button>

          {user ? (
            <>
              {!user.is_pro && (
                <Link to="/pricing" className="hidden sm:inline-flex" data-testid="header-upgrade-cta">
                  <Button size="sm" className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white h-9">
                    <Crown size={14} weight="fill" className="mr-1.5" /> Upgrade
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-none border-foreground/20 dark:border-white/15 dark:text-white h-9" data-testid="user-menu-trigger">
                    <UserIcon size={16} className="mr-2" />
                    <span className="hidden sm:inline font-medium">{user.name}</span>
                    {user.is_pro && <Crown size={13} weight="fill" className="ml-1.5 klein" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-xs text-muted-foreground">Signed in as</div>
                    <div className="font-bold truncate">{user.email}</div>
                    <div className="text-xs mt-1">
                      {user.is_pro ? <span className="klein font-bold">PRO</span> : <span className="text-muted-foreground">FREE</span>}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard">
                    <GridFour size={14} className="mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/bookmarks")} data-testid="menu-bookmarks">
                    <BookmarkSimple size={14} className="mr-2" /> Bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/reviews")} data-testid="menu-reviews">
                    <Star size={14} className="mr-2" /> Reviews
                  </DropdownMenuItem>
                  {!user.is_pro && (
                    <DropdownMenuItem onClick={() => navigate("/pricing")} data-testid="menu-upgrade">
                      <Crown size={14} className="mr-2 klein" /> Upgrade to Pro
                    </DropdownMenuItem>
                  )}
                  {user.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin">
                        <Shield size={14} className="mr-2 klein" weight="fill" /> Admin Console
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); navigate("/"); }} data-testid="menu-logout">
                    <SignOut size={14} className="mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/pricing" data-testid="header-pricing-link" className="hidden sm:inline-flex">
                <Button variant="ghost" className="rounded-none dark:text-white">Pricing</Button>
              </Link>
              <Link to="/login" data-testid="header-login-link">
                <Button variant="ghost" className="rounded-none dark:text-white">Sign in</Button>
              </Link>
              <Link to="/signup" data-testid="header-signup-link">
                <Button className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white">Get Started</Button>
              </Link>
            </>
          )}

          {user && (
            <button className="lg:hidden dark:text-white" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle">
              {open ? <X size={22} /> : <List size={22} />}
            </button>
          )}
        </div>
      </div>

      {user && open && (
        <div className="lg:hidden border-t border-foreground/15 dark:border-white/10 px-6 py-3 space-y-1 bg-white dark:bg-gray-950">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-transparent hover:border-foreground/20 dark:text-gray-300"
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          <Link to="/bookmarks" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-transparent hover:border-foreground/20 dark:text-gray-300">
            <BookmarkSimple size={16} /> Bookmarks
          </Link>
          <Link to="/reviews" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-transparent hover:border-foreground/20 dark:text-gray-300">
            <Star size={16} /> Reviews
          </Link>
          {user.is_admin && (
            <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-transparent hover:border-foreground/20 dark:text-gray-300">
              <Shield size={16} weight="fill" className="klein" /> Admin
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
