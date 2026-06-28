import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useLogout } from "@workspace/api-client-react";
import { 
  Building, 
  CalendarDays, 
  LayoutDashboard, 
  LogOut, 
  MapPin, 
  Settings, 
  Users,
  CreditCard,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const logout = useLogout();
  
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
  ].filter(item => item.show);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary tracking-tight">Meu Clube</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">{user.name}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.startsWith(item.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => {
              logout.mutate(undefined, {
                onSuccess: () => {
                  window.location.href = "/login";
                }
              });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
