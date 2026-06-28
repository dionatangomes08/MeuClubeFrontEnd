import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Companies from "@/pages/companies";
import CompanyDetail from "@/pages/company-detail";
import Structures from "@/pages/structures";
import Reservations from "@/pages/reservations";
import Users from "@/pages/users";
import Plans from "@/pages/plans";
import Settings from "@/pages/settings";
import Admins from "@/pages/admins";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <Component />;
}

function Router() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/" && user) {
      setLocation("/dashboard");
    } else if (location === "/" && !user) {
      setLocation("/login");
    }
  }, [location, user, setLocation]);

  return (
    <Layout>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
        <Route path="/companies" exact><ProtectedRoute component={Companies} /></Route>
        <Route path="/companies/:companyId"><ProtectedRoute component={CompanyDetail} /></Route>
        <Route path="/structures"><ProtectedRoute component={Structures} /></Route>
        <Route path="/reservations"><ProtectedRoute component={Reservations} /></Route>
        <Route path="/users"><ProtectedRoute component={Users} /></Route>
        <Route path="/plans"><ProtectedRoute component={Plans} /></Route>
        <Route path="/admins"><ProtectedRoute component={Admins} /></Route>
        <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
