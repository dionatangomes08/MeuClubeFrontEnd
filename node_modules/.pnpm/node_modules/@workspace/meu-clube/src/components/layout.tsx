import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useLogout } from "@workspace/api-client-react";
import {
  Building,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Users,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return <>{children}</>;
  }

  const isSuperAdmin = user.role === "super_admin";
  const hasCompany = !!user.companyId;
  const isMember = user.companyRole === "member";

  const navItems = [
    { href: "/dashboard", label: "Painel", icon: LayoutDashboard, show: true },
    { href: "/companies", label: "Empresas", icon: Building, show: isSuperAdmin },
    { href: "/plans", label: "Planos", icon: CreditCard, show: isSuperAdmin },
    { href: "/admins", label: "Administradores", icon: ShieldCheck, show: isSuperAdmin },
    { href: "/structures", label: "Estruturas", icon: MapPin, show: hasCompany && !isMember },
    { href: "/reservations", label: "Reservas", icon: CalendarDays, show: hasCompany },
    { href: "/users", label: "Usuários", icon: Users, show: hasCompany && !isMember },
    { href: "/settings", label: "Configurações", icon: Settings, show: true },
  ].filter((item) => item.show);

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  }

  const navContent = (onNavigate?: () => void) => (
    <>
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary tracking-tight">Meu Clube</h1>
        <p className="text-sm text-muted-foreground mt-1 truncate">{user.name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location.startsWith(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar — visível somente em desktop */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        {navContent()}
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col">
              {navContent(() => setMobileOpen(false))}
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold text-primary">Meu Clube</h1>
        </header>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}