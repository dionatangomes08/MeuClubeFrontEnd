import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetCompany, 
  useGetCompanySubscription, 
  useListCompanyUsers, 
  useListStructures,
  useSetCompanySubscription,
  useListPlans,
  useResetCompanyUserPassword,
  useSetCompanyResponsible,
  useAddCompanyUser,
  getGetCompanyQueryKey,
  getGetCompanySubscriptionQueryKey,
  getListCompanyUsersQueryKey,
  getListStructuresQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Building2, CreditCard, MapPin, Users, Pencil, UserCog, KeyRound, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompanyDetail() {
  const { companyId } = useParams();
  const id = parseInt(companyId || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");

  const [isChangeRespOpen, setIsChangeRespOpen] = useState(false);
  const [selectedRespUserId, setSelectedRespUserId] = useState<string>("");

  const [isCreateRespOpen, setIsCreateRespOpen] = useState(false);
  const [createRespName, setCreateRespName] = useState("");
  const [createRespPhone, setCreateRespPhone] = useState("");
  const [createRespPassword, setCreateRespPassword] = useState("");

  const { data: company, isLoading: isLoadingCompany } = useGetCompany(id, {
    query: { enabled: !!id, queryKey: getGetCompanyQueryKey(id) }
  });

  const { data: subscription, isLoading: isLoadingSub } = useGetCompanySubscription(id, {
    query: { enabled: !!id, queryKey: getGetCompanySubscriptionQueryKey(id) }
  });

  const { data: users, isLoading: isLoadingUsers } = useListCompanyUsers(id, {
    query: { enabled: !!id, queryKey: getListCompanyUsersQueryKey(id) }
  });

  const { data: structures, isLoading: isLoadingStructures } = useListStructures(id, {
    query: { enabled: !!id, queryKey: getListStructuresQueryKey(id) }
  });

  const { data: plans } = useListPlans();

  const setSubscription = useSetCompanySubscription();
  const resetPassword = useResetCompanyUserPassword();
  const setResponsible = useSetCompanyResponsible();
  const addUser = useAddCompanyUser();

  const responsibleUser = users?.find(u => u.userId === company?.responsibleUserId);
  const adminUsers = users?.filter(u => u.role === "admin" || u.role === "operator") ?? [];

  const handleAssignPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    setSubscription.mutate({ companyId: id, data: { planId: Number(selectedPlanId) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCompanySubscriptionQueryKey(id) });
        setIsPlanOpen(false);
        setSelectedPlanId("");
        toast({ title: "Assinatura atualizada com sucesso!" });
      },
      onError: () => {
        toast({ title: "Erro ao atribuir plano", variant: "destructive" });
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsibleUser) return;
    if (resetNewPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (resetNewPassword !== resetConfirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    resetPassword.mutate(
      { companyId: id, userId: responsibleUser.userId, data: { newPassword: resetNewPassword } },
      {
        onSuccess: () => {
          setIsResetOpen(false);
          setResetNewPassword("");
          setResetConfirm("");
          toast({ title: "Senha redefinida com sucesso!" });
        },
        onError: (err: any) => {
          toast({ title: err?.response?.data?.error ?? "Erro ao redefinir senha", variant: "destructive" });
        }
      }
    );
  };

  const handleChangeResponsible = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRespUserId) return;
    setResponsible.mutate(
      { companyId: id, data: { userId: Number(selectedRespUserId) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCompanyQueryKey(id) });
          setIsChangeRespOpen(false);
          setSelectedRespUserId("");
          toast({ title: "Responsável atualizado com sucesso!" });
        },
        onError: (err: any) => {
          toast({ title: err?.response?.data?.error ?? "Erro ao alterar responsável", variant: "destructive" });
        }
      }
    );
  };

  const handleCreateResponsible = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRespName.trim() || !createRespPhone.trim() || createRespPassword.length < 6) return;
    addUser.mutate(
      { companyId: id, data: { name: createRespName.trim(), phone: createRespPhone.trim(), password: createRespPassword, role: "admin" } },
      {
        onSuccess: (newUser) => {
          queryClient.invalidateQueries({ queryKey: getListCompanyUsersQueryKey(id) });
          setResponsible.mutate(
            { companyId: id, data: { userId: newUser.userId } },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getGetCompanyQueryKey(id) });
                queryClient.invalidateQueries({ queryKey: getListCompanyUsersQueryKey(id) });
                setIsCreateRespOpen(false);
                setCreateRespName(""); setCreateRespPhone(""); setCreateRespPassword("");
                toast({ title: "Responsável cadastrado com sucesso!" });
              },
              onError: (err: any) => {
                toast({ title: err?.response?.data?.error ?? "Erro ao definir responsável", variant: "destructive" });
              }
            }
          );
        },
        onError: (err: any) => {
          toast({ title: err?.response?.data?.error ?? "Erro ao cadastrar responsável", variant: "destructive" });
        }
      }
    );
  };

  if (isLoadingCompany) {
    return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  }

  if (!company) {
    return <div className="p-8">Empresa não encontrada.</div>;
  }

  const userCount = users?.length ?? 0;
  const maxUsers = subscription?.planMaxUsers ?? null;
  const userUsagePct = maxUsers ? Math.min(100, Math.round((userCount / maxUsers) * 100)) : null;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/companies">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{{ club: 'Clube', condominium: 'Condomínio', other: 'Outro' }[company.type] ?? company.type}</Badge>
            <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>{{ active: 'Ativa', inactive: 'Inativa', suspended: 'Suspensa', cancelled: 'Cancelada' }[company.status] ?? company.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">Email</span>
              <span>{company.email || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground block">Telefone</span>
              <span>{company.phone || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground block">Endereço</span>
              <span>{company.address || 'Não informado'}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Responsável ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" /> Responsável
              </CardTitle>
              <div className="flex gap-2">
                {/* Trocar responsável */}
                <Dialog open={isChangeRespOpen} onOpenChange={setIsChangeRespOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoadingUsers || adminUsers.length === 0}
                      onClick={() => setSelectedRespUserId(company.responsibleUserId ? String(company.responsibleUserId) : "")}
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-1" />
                      Trocar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Trocar Responsável</DialogTitle>
                      <DialogDescription>
                        Selecione o novo responsável da empresa. Apenas admins e operadores estão disponíveis.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangeResponsible} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Novo Responsável</Label>
                        <Select value={selectedRespUserId} onValueChange={setSelectedRespUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um usuário..." />
                          </SelectTrigger>
                          <SelectContent>
                            {adminUsers.map(u => (
                              <SelectItem key={u.userId} value={String(u.userId)}>
                                {u.name} — {u.phone}
                                {" "}
                                <span className="text-muted-foreground text-xs">
                                  ({ { admin: 'Admin', operator: 'Operador' }[u.role] ?? u.role })
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsChangeRespOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={!selectedRespUserId || setResponsible.isPending}>
                          {setResponsible.isPending ? "Salvando..." : "Confirmar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Resetar senha */}
                {responsibleUser && (
                  <Dialog open={isResetOpen} onOpenChange={(o) => { setIsResetOpen(o); if (!o) { setResetNewPassword(""); setResetConfirm(""); } }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <KeyRound className="h-4 w-4 mr-1" />
                        Resetar Senha
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Redefinir Senha do Responsável</DialogTitle>
                        <DialogDescription>
                          Defina uma nova senha para <strong>{responsibleUser.name}</strong> ({responsibleUser.phone}).
                          Informe a nova senha ao responsável após a alteração.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nova Senha</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={resetNewPassword}
                            onChange={e => setResetNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Repita a nova senha"
                            value={resetConfirm}
                            onChange={e => setResetConfirm(e.target.value)}
                          />
                        </div>
                        {resetNewPassword && resetConfirm && resetNewPassword !== resetConfirm && (
                          <p className="text-sm text-destructive">As senhas não coincidem.</p>
                        )}
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>Cancelar</Button>
                          <Button
                            type="submit"
                            disabled={!resetNewPassword || !resetConfirm || resetPassword.isPending}
                          >
                            {resetPassword.isPending ? "Salvando..." : "Redefinir Senha"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <Skeleton className="h-20 w-full" />
            ) : responsibleUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">
                      {responsibleUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{responsibleUser.name}</div>
                    <div className="text-sm text-muted-foreground">{responsibleUser.phone}</div>
                    {responsibleUser.email && (
                      <div className="text-xs text-muted-foreground truncate">{responsibleUser.email}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-auto flex-shrink-0">
                    {{ admin: 'Admin', operator: 'Operador', member: 'Membro' }[responsibleUser.role] ?? responsibleUser.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Responsável pelo acesso administrativo e pelo contato com a plataforma.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Nenhum responsável definido.</p>
                <div className="flex flex-wrap gap-2">
                  {/* Cadastrar novo responsável */}
                  <Dialog open={isCreateRespOpen} onOpenChange={(o) => { setIsCreateRespOpen(o); if (!o) { setCreateRespName(""); setCreateRespPhone(""); setCreateRespPassword(""); } }}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <UserCog className="h-4 w-4 mr-1" />
                        Cadastrar Responsável
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cadastrar Responsável</DialogTitle>
                        <DialogDescription>
                          Crie um novo usuário administrador e defina-o como responsável desta empresa.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateResponsible} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="respName">Nome completo <span className="text-destructive">*</span></Label>
                          <Input
                            id="respName"
                            placeholder="Ex: João da Silva"
                            value={createRespName}
                            onChange={e => setCreateRespName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="respPhone">Telefone (usado no login) <span className="text-destructive">*</span></Label>
                          <Input
                            id="respPhone"
                            placeholder="Ex: 47999990000"
                            value={createRespPhone}
                            onChange={e => setCreateRespPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="respPassword">Senha <span className="text-destructive">*</span></Label>
                          <Input
                            id="respPassword"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={createRespPassword}
                            onChange={e => setCreateRespPassword(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsCreateRespOpen(false)}>Cancelar</Button>
                          <Button
                            type="submit"
                            disabled={!createRespName.trim() || !createRespPhone.trim() || createRespPassword.length < 6 || addUser.isPending || setResponsible.isPending}
                          >
                            {(addUser.isPending || setResponsible.isPending) ? "Cadastrando..." : "Cadastrar e Definir"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Selecionar de usuários existentes (se houver admins) */}
                  {adminUsers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangeRespOpen(true)}
                    >
                      <ArrowLeftRight className="h-4 w-4 mr-1" />
                      Selecionar Existente
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Assinatura
              </CardTitle>
              <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPlanId(subscription?.planId ? String(subscription.planId) : "")}>
                    <Pencil className="h-4 w-4 mr-1" />
                    {subscription ? "Alterar Plano" : "Atribuir Plano"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{subscription ? "Alterar Plano" : "Atribuir Plano"}</DialogTitle>
                    <DialogDescription>Selecione um plano comercial para esta empresa. O limite de usuários passará a valer imediatamente.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAssignPlan} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Plano</Label>
                      <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um plano..." />
                        </SelectTrigger>
                        <SelectContent>
                          {plans?.filter(p => p.active).map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} — até {p.maxUsers} usuários / {p.maxStructures} estruturas
                              {" "}(R$ {Number(p.price).toFixed(2).replace('.', ',')}/{p.periodicity === 'monthly' ? 'mês' : 'ano'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsPlanOpen(false)}>Cancelar</Button>
                      <Button type="submit" disabled={!selectedPlanId || setSubscription.isPending}>
                        {setSubscription.isPending ? "Salvando..." : "Confirmar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSub ? <Skeleton className="h-20 w-full" /> : subscription ? (
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground block">Plano Atual</span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-lg">{subscription.planName || `Plano #${subscription.planId}`}</span>
                    <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                      {{ active: 'Ativa', overdue: 'Inadimplente', cancelled: 'Cancelada' }[subscription.status] ?? subscription.status}
                    </Badge>
                  </div>
                </div>

                {maxUsers !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usuários</span>
                      <span className={userCount >= maxUsers ? "text-destructive font-medium" : ""}>
                        {userCount} / {maxUsers}
                      </span>
                    </div>
                    <Progress value={userUsagePct ?? 0} className={userCount >= maxUsers ? "[&>div]:bg-destructive" : ""} />
                    {userCount >= maxUsers && (
                      <p className="text-xs text-destructive">Limite de usuários atingido.</p>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground block">Início</span>
                    <span>{new Date(subscription.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {subscription.nextBillingDate && (
                    <div className="text-right">
                      <span className="text-muted-foreground block">Próxima Cobrança</span>
                      <span>{new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Sem assinatura ativa.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Equipe / Membros
            </CardTitle>
            <CardDescription>
              {userCount} usuário{userCount !== 1 ? 's' : ''} vinculado{userCount !== 1 ? 's' : ''}
              {maxUsers !== null ? ` (limite: ${maxUsers})` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
             {isLoadingUsers ? <Skeleton className="h-20 w-full" /> : (
              <div className="space-y-4">
                {users?.slice(0, 5).map(u => (
                  <div key={u.id} className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {u.name}
                        {u.userId === company.responsibleUserId && (
                          <Badge variant="secondary" className="text-xs px-1 py-0 ml-1">Resp.</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.phone}</div>
                    </div>
                    <Badge variant="outline">{{ admin: 'Admin', operator: 'Operador', member: 'Membro' }[u.role] ?? u.role}</Badge>
                  </div>
                ))}
                {users && users.length > 5 && (
                  <div className="text-sm text-center text-muted-foreground pt-2">E mais {users.length - 5} usuários...</div>
                )}
                {users?.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhum usuário vinculado.</div>
                )}
              </div>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Estruturas
            </CardTitle>
            <CardDescription>
              {structures?.length || 0} espaço{(structures?.length || 0) !== 1 ? 's' : ''} disponíve{(structures?.length || 0) !== 1 ? 'is' : 'l'}
              {subscription?.planMaxStructures != null ? ` (limite: ${subscription.planMaxStructures})` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStructures ? <Skeleton className="h-20 w-full" /> : (
              <div className="space-y-4">
                {structures?.slice(0, 5).map(s => (
                  <div key={s.id} className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{{ court: 'Quadra', pool: 'Piscina', room: 'Salão', field: 'Campo', gym: 'Academia', other: 'Outro' }[s.type] ?? s.type} • Capacidade: {s.capacity}</div>
                    </div>
                    <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{{ active: 'Ativa', inactive: 'Inativa', maintenance: 'Manutenção' }[s.status] ?? s.status}</Badge>
                  </div>
                ))}
                {structures && structures.length > 5 && (
                  <div className="text-sm text-center text-muted-foreground pt-2">E mais {structures.length - 5} estruturas...</div>
                )}
                {structures?.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhuma estrutura cadastrada.</div>
                )}
              </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
