import { useAuth } from "@/lib/auth-context";
import { useGetCompanyDashboard, useListCompanies, getGetCompanyDashboardQueryKey, getListCompaniesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return null;

  if (user.role === "super_admin" && !user.companyId) {
    return <SuperAdminDashboard />;
  }

  if (user.companyId) {
    return <CompanyDashboard companyId={user.companyId} isMember={user.companyRole === "member"} />;
  }

  return <div className="p-8 text-muted-foreground">Acesso negado.</div>;
}

function SuperAdminDashboard() {
  const { data: companies, isLoading } = useListCompanies({
    query: {
      queryKey: getListCompaniesQueryKey()
    }
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Super Admin</h1>
        <p className="text-muted-foreground mt-2">Visão geral de todas as empresas cadastradas.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies?.filter(c => c.status === 'active').length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CompanyDashboard({ companyId, isMember }: { companyId: number; isMember: boolean }) {
  const { data: dashboard, isLoading } = useGetCompanyDashboard(companyId, {
    query: {
      enabled: !!companyId,
      queryKey: getGetCompanyDashboardQueryKey(companyId)
    }
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Visão geral do seu clube ou condomínio.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : dashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {!isMember && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.totalUsers}</div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estruturas</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.totalStructures}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboard.activeStructures} ativas
                </p>
              </CardContent>
            </Card>

            {!isMember && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reservas Totais</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.totalReservations}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboard.reservationsThisWeek} nesta semana
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Reservas</CardTitle>
                <CardDescription>Suas reservas agendadas mais recentes</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard.upcomingReservations?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Estrutura</TableHead>
                        {!isMember && <TableHead>Usuário</TableHead>}
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.upcomingReservations.slice(0, 5).map(res => (
                        <TableRow key={res.id}>
                          <TableCell className="font-medium">{res.date} {res.startTime}</TableCell>
                          <TableCell>{res.structureName}</TableCell>
                          {!isMember && <TableCell>{res.userName}</TableCell>}
                          <TableCell>
                            <Badge variant={
                              res.status === 'confirmed' ? 'default' : 
                              res.status === 'requested' ? 'secondary' : 
                              'outline'
                            }>
                              {{ confirmed: 'Confirmada', requested: 'Solicitada', cancelled: 'Cancelada', rejected: 'Rejeitada', completed: 'Concluída' }[res.status] ?? res.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">Nenhuma reserva futura.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reservas por Status</CardTitle>
                <CardDescription>Distribuição atual das reservas</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                  {dashboard.reservationsByStatus?.map(stat => (
                    <div key={stat.status} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{{ confirmed: 'Confirmada', requested: 'Solicitada', cancelled: 'Cancelada', rejected: 'Rejeitada', completed: 'Concluída' }[stat.status] ?? stat.status}</span>
                      <span className="text-sm text-muted-foreground">{stat.count}</span>
                    </div>
                  ))}
                 </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
