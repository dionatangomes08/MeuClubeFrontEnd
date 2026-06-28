import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  useListCompanyUsers, 
  useAddCompanyUser, 
  useUpdateCompanyUser,
  useRemoveCompanyUser,
  getListCompanyUsersQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, CheckCircle, Ban, Trash2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const { user: currentUser } = useAuth();
  const companyId = currentUser?.companyId as number;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const { data: users, isLoading } = useListCompanyUsers(companyId, {
    query: { enabled: !!companyId, queryKey: getListCompanyUsersQueryKey(companyId) }
  });
  
  const addUser = useAddCompanyUser();
  const updateUser = useUpdateCompanyUser();
  const removeUser = useRemoveCompanyUser();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "member"
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addUser.mutate({ companyId, data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompanyUsersQueryKey(companyId) });
        setIsAddOpen(false);
        setFormData({ name: "", phone: "", email: "", password: "", role: "member" });
        toast({ title: "Usuário adicionado com sucesso!" });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Erro ao adicionar usuário";
        toast({ title: msg, variant: "destructive" });
      }
    });
  };

  const handleRoleChange = (userId: number, role: string) => {
    updateUser.mutate({ companyId, userId, data: { role } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompanyUsersQueryKey(companyId) });
        toast({ title: "Cargo atualizado!" });
      },
      onError: () => {
        toast({ title: "Erro ao atualizar cargo", variant: "destructive" });
      }
    });
  };

  const handleStatusChange = (userId: number, status: string) => {
    updateUser.mutate({ companyId, userId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompanyUsersQueryKey(companyId) });
        toast({ title: "Status atualizado!" });
      },
      onError: () => {
        toast({ title: "Erro ao atualizar status", variant: "destructive" });
      }
    });
  };

  const handleRemove = (userId: number) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      removeUser.mutate({ companyId, userId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCompanyUsersQueryKey(companyId) });
          toast({ title: "Usuário removido!" });
        },
        onError: () => {
          toast({ title: "Erro ao remover", variant: "destructive" });
        }
      });
    }
  };

  if (!companyId) return null;
  if (currentUser?.companyRole === "member") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Acesso restrito</h1>
        <p className="text-muted-foreground">Membros não têm acesso ao gerenciamento de usuários.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground mt-2">Gerencie os membros e operadores do seu clube ou condomínio.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Adicionar Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>Preencha os dados para convidar um novo membro ou operador.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha Temporária</Label>
                <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo *</Label>
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="member">Membro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={addUser.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length ? users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{user.phone}</div>
                      <div className="text-xs text-muted-foreground">{user.email || '--'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{{ admin: 'Administrador', operator: 'Operador', member: 'Membro' }[user.role] ?? user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {{ active: 'Ativo', inactive: 'Inativo' }[user.status] ?? user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Mudar Cargo</DropdownMenuLabel>
                          {user.role !== 'admin' && <DropdownMenuItem onClick={() => handleRoleChange(user.userId, 'admin')}>Tornar Admin</DropdownMenuItem>}
                          {user.role !== 'operator' && <DropdownMenuItem onClick={() => handleRoleChange(user.userId, 'operator')}>Tornar Operador</DropdownMenuItem>}
                          {user.role !== 'member' && <DropdownMenuItem onClick={() => handleRoleChange(user.userId, 'member')}>Tornar Membro</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Status</DropdownMenuLabel>
                          {user.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleStatusChange(user.userId, 'inactive')}>
                              <Ban className="mr-2 h-4 w-4" /> Inativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleStatusChange(user.userId, 'active')}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Ativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRemove(user.userId)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
