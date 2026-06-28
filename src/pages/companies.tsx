import { useState } from "react";
import { Link } from "wouter";
import { 
  useListCompanies, 
  useCreateCompany, 
  useUpdateCompanyStatus,
  getListCompaniesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, CheckCircle, Ban, XCircle } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const emptyForm = {
  name: "",
  type: "club",
  email: "",
  phone: "",
  address: "",
  adminName: "",
  adminPhone: "",
  adminPassword: "",
};

export default function Companies() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: companies, isLoading } = useListCompanies({
    query: { queryKey: getListCompaniesQueryKey() }
  });
  
  const createCompany = useCreateCompany();
  const updateStatus = useUpdateCompanyStatus();

  const [formData, setFormData] = useState(emptyForm);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.adminPhone && !formData.adminPassword) {
      toast({ title: "Informe a senha do administrador.", variant: "destructive" });
      return;
    }

    createCompany.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        setIsCreateOpen(false);
        setFormData(emptyForm);
        toast({ title: "Empresa criada com sucesso!" });
      },
      onError: () => {
        toast({ title: "Erro ao criar empresa", variant: "destructive" });
      }
    });
  };

  const handleStatusChange = (companyId: number, status: string) => {
    updateStatus.mutate({ companyId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        toast({ title: "Status atualizado com sucesso!" });
      },
      onError: () => {
        toast({ title: "Erro ao atualizar status", variant: "destructive" });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Ativa</Badge>;
      case 'inactive': return <Badge variant="secondary">Inativa</Badge>;
      case 'suspended': return <Badge variant="destructive">Suspensa</Badge>;
      case 'cancelled': return <Badge variant="outline">Cancelada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground mt-2">Gerencie os clubes e condomínios da plataforma.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
              <DialogDescription>Adicione um novo clube ou condomínio à plataforma.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="club">Clube</SelectItem>
                    <SelectItem value="condominium">Condomínio</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-1">Usuário Administrador Inicial</p>
                <p className="text-xs text-muted-foreground mb-3">Opcional. Cria um administrador que poderá fazer login imediatamente.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminName">Nome do Administrador</Label>
                <Input id="adminName" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPhone">Telefone (login) do Administrador</Label>
                <Input id="adminPhone" value={formData.adminPhone} onChange={e => setFormData({...formData, adminPhone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Senha do Administrador</Label>
                <Input id="adminPassword" type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createCompany.isPending}>
                  {createCompany.isPending ? "Salvando..." : "Salvar"}
                </Button>
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
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies?.length ? companies.map(company => (
                  <TableRow key={company.id}>
                    <TableCell className="font-mono text-muted-foreground">#{company.id}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/companies/${company.id}`} className="hover:underline hover:text-primary">
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell>{{ club: 'Clube', condominium: 'Condomínio', other: 'Outro' }[company.type] ?? company.type}</TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell>{new Date(company.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/companies/${company.id}`}>Ver Detalhes</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(company.id, 'active')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Ativar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(company.id, 'suspended')}>
                            <Ban className="mr-2 h-4 w-4" /> Suspender
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(company.id, 'cancelled')}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma empresa encontrada.
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
