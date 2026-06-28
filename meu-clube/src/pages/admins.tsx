import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useListAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  getListAdminUsersQueryKey,
} from "@workspace/api-client-react";

export default function Admins() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", password: "" });

  const { data: admins, isLoading } = useListAdminUsers({
    query: { queryKey: getListAdminUsersQueryKey() }
  });

  const createAdmin = useCreateAdminUser();
  const deleteAdmin = useDeleteAdminUser();

  if (currentUser?.role !== "super_admin") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Acesso restrito</h1>
        <p className="text-muted-foreground">Apenas super administradores podem acessar esta área.</p>
      </div>
    );
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createAdmin.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        setIsAddOpen(false);
        setFormData({ name: "", phone: "", email: "", password: "" });
        toast({ title: "Administrador criado com sucesso!" });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Erro ao criar administrador";
        toast({ title: msg, variant: "destructive" });
      }
    });
  };

  const handleDelete = (userId: number) => {
    if (!confirm("Tem certeza que deseja remover este administrador?")) return;
    deleteAdmin.mutate({ userId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
        toast({ title: "Administrador removido!" });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Erro ao remover administrador";
        toast({ title: msg, variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administradores</h1>
          <p className="text-muted-foreground mt-2">Gerencie os super administradores da plataforma.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Administrador</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Super Administrador</DialogTitle>
              <DialogDescription>Crie uma conta com acesso total à plataforma.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Nome Completo *</Label>
                <Input
                  id="admin-name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-phone">Telefone (login) *</Label>
                <Input
                  id="admin-phone"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createAdmin.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins?.length ? admins.map(admin => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{admin.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="gap-1">
                        <ShieldCheck className="h-3 w-3" /> Super Admin
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={admin.id === currentUser?.id}
                        onClick={() => handleDelete(admin.id)}
                        title={admin.id === currentUser?.id ? "Você não pode remover sua própria conta" : "Remover"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum administrador encontrado.
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
