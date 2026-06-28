import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useChangePassword } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const changePassword = useChangePassword();

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    user: "Usuário",
  };

  const companyRoleLabel: Record<string, string> = {
    admin: "Administrador",
    operator: "Operador",
    member: "Membro",
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (pwForm.newPassword.length < 6) {
      toast({ title: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: "A nova senha e a confirmação não coincidem.", variant: "destructive" });
      return;
    }

    changePassword.mutate(
      { data: { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword } },
      {
        onSuccess: () => {
          setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
          toast({ title: "Senha alterada com sucesso!" });
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Erro ao alterar senha";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas informações de conta.</p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Perfil Pessoal</CardTitle>
            <CardDescription>Informações básicas da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nome</div>
                  <div className="mt-1 font-medium">{user.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Cargo de Sistema</div>
                  <div className="mt-1"><Badge variant="outline">{roleLabel[user.role] ?? user.role}</Badge></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Telefone</div>
                  <div className="mt-1">{user.phone}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="mt-1">{user.email || 'Não informado'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {user.companyId && (
          <Card>
            <CardHeader>
              <CardTitle>Vínculo Corporativo</CardTitle>
              <CardDescription>Sua relação com o clube ou condomínio atual.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">ID da Empresa</div>
                  <div className="mt-1 font-mono text-sm">#{user.companyId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Cargo na Empresa</div>
                  <div className="mt-1">{companyRoleLabel[user.companyRole ?? ""] ?? user.companyRole ?? 'Não definido'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Alterar Senha
            </CardTitle>
            <CardDescription>Para sua segurança, informe a senha atual antes de definir uma nova.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  disabled={changePassword.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  disabled={changePassword.isPending}
                />
                <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  disabled={changePassword.isPending}
                />
              </div>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Salvando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
