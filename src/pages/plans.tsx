import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  useListPlans, 
  useCreatePlan, 
  getListPlansQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Check } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter as DialogFooterUI, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function Plans() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: plans, isLoading } = useListPlans({
    query: { enabled: isSuperAdmin, queryKey: getListPlansQueryKey() }
  });
  
  const createPlan = useCreatePlan();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxUsers: 100,
    maxStructures: 5,
    price: 99.90,
    periodicity: "monthly"
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPlan.mutate({ 
      data: { 
        ...formData, 
        maxUsers: Number(formData.maxUsers), 
        maxStructures: Number(formData.maxStructures),
        price: Number(formData.price)
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
        setIsCreateOpen(false);
        setFormData({ name: "", description: "", maxUsers: 100, maxStructures: 5, price: 99.90, periodicity: "monthly" });
        toast({ title: "Plano criado com sucesso!" });
      },
      onError: () => {
        toast({ title: "Erro ao criar plano", variant: "destructive" });
      }
    });
  };

  if (!isSuperAdmin) return <div className="p-8">Acesso restrito.</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
          <p className="text-muted-foreground mt-2">Gerencie os planos de assinatura da plataforma.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Plano</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Plano</DialogTitle>
              <DialogDescription>Configure os limites e valores do novo plano.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Máx. Usuários *</Label>
                  <Input id="maxUsers" type="number" required value={formData.maxUsers} onChange={e => setFormData({...formData, maxUsers: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStructures">Máx. Estruturas *</Label>
                  <Input id="maxStructures" type="number" required value={formData.maxStructures} onChange={e => setFormData({...formData, maxStructures: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço *</Label>
                  <Input id="price" type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodicity">Periodicidade *</Label>
                  <Select value={formData.periodicity} onValueChange={v => setFormData({...formData, periodicity: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooterUI>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createPlan.isPending}>Salvar</Button>
              </DialogFooterUI>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      ) : plans?.length ? (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map(plan => (
            <Card key={plan.id} className={`flex flex-col ${!plan.active && 'opacity-60 grayscale-[0.5]'}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                  </div>
                  {!plan.active && <Badge variant="secondary">Inativo</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-3xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                  </span>
                  <span className="text-muted-foreground text-sm">/{plan.periodicity === 'monthly' ? 'mês' : 'ano'}</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Até {plan.maxUsers} usuários
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Até {plan.maxStructures} estruturas
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Gestão de reservas
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Suporte base
                  </li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
          Nenhum plano cadastrado.
        </div>
      )}
    </div>
  );
}
