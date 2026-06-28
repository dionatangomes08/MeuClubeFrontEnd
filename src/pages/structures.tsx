import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  useListStructures, 
  useCreateStructure, 
  useUpdateStructure,
  useDeleteStructure,
  getListStructuresQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

export default function Structures() {
  const { user } = useAuth();
  const companyId = user?.companyId as number;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);
  
  const { data: structures, isLoading } = useListStructures(companyId, {
    query: { enabled: !!companyId, queryKey: getListStructuresQueryKey(companyId) }
  });
  
  const createStructure = useCreateStructure();
  const updateStructure = useUpdateStructure();
  const deleteStructure = useDeleteStructure();

  const [formData, setFormData] = useState({
    name: "",
    type: "court",
    description: "",
    capacity: 10,
    openTime: "08:00",
    closeTime: "22:00",
    maxDurationMinutes: 60,
    requiresApproval: false
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createStructure.mutate({ companyId, data: { ...formData, capacity: Number(formData.capacity), maxDurationMinutes: Number(formData.maxDurationMinutes) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStructuresQueryKey(companyId) });
        setIsCreateOpen(false);
        setFormData({ name: "", type: "court", description: "", capacity: 10, openTime: "08:00", closeTime: "22:00", maxDurationMinutes: 60, requiresApproval: false });
        toast({ title: "Estrutura criada com sucesso!" });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Erro ao criar estrutura";
        toast({ title: msg, variant: "destructive" });
      }
    });
  };

  const handleEditClick = (structure: any) => {
    setCurrentEditId(structure.id);
    setFormData({
      name: structure.name,
      type: structure.type,
      description: structure.description || "",
      capacity: structure.capacity,
      openTime: structure.openTime || "",
      closeTime: structure.closeTime || "",
      maxDurationMinutes: structure.maxDurationMinutes || 60,
      requiresApproval: structure.requiresApproval || false
    });
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditId) return;

    updateStructure.mutate({ companyId, structureId: currentEditId, data: { ...formData, capacity: Number(formData.capacity), maxDurationMinutes: Number(formData.maxDurationMinutes) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStructuresQueryKey(companyId) });
        setIsEditOpen(false);
        toast({ title: "Estrutura atualizada com sucesso!" });
      },
      onError: () => {
        toast({ title: "Erro ao atualizar estrutura", variant: "destructive" });
      }
    });
  };

  const handleDelete = (structureId: number) => {
    if (confirm("Tem certeza que deseja excluir esta estrutura?")) {
      deleteStructure.mutate({ companyId, structureId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStructuresQueryKey(companyId) });
          toast({ title: "Estrutura excluída!" });
        },
        onError: () => {
          toast({ title: "Erro ao excluir", variant: "destructive" });
        }
      });
    }
  };

  if (!companyId) return null;
  if (user?.companyRole === "member") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Acesso restrito</h1>
        <p className="text-muted-foreground">Membros não têm acesso ao gerenciamento de estruturas.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estruturas</h1>
          <p className="text-muted-foreground mt-2">Gerencie os espaços disponíveis para reserva.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Estrutura</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Estrutura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name-create">Nome da Estrutura *</Label>
                  <Input id="name-create" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-create">Tipo *</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="court">Quadra</SelectItem>
                      <SelectItem value="pool">Piscina</SelectItem>
                      <SelectItem value="room">Salão</SelectItem>
                      <SelectItem value="field">Campo</SelectItem>
                      <SelectItem value="gym">Academia</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity-create">Capacidade (pessoas) *</Label>
                  <Input id="capacity-create" type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openTime-create">Horário Abertura</Label>
                  <Input id="openTime-create" type="time" value={formData.openTime} onChange={e => setFormData({...formData, openTime: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime-create">Horário Fechamento</Label>
                  <Input id="closeTime-create" type="time" value={formData.closeTime} onChange={e => setFormData({...formData, closeTime: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDuration-create">Duração Max Reserva (min)</Label>
                  <Input id="maxDuration-create" type="number" value={formData.maxDurationMinutes} onChange={e => setFormData({...formData, maxDurationMinutes: Number(e.target.value)})} />
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <div className="flex items-center space-x-2">
                    <Switch id="approval-create" checked={formData.requiresApproval} onCheckedChange={c => setFormData({...formData, requiresApproval: c})} />
                    <Label htmlFor="approval-create">Requer Aprovação?</Label>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createStructure.isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Estrutura</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name-edit">Nome da Estrutura *</Label>
                <Input id="name-edit" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-edit">Tipo *</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="court">Quadra</SelectItem>
                    <SelectItem value="pool">Piscina</SelectItem>
                    <SelectItem value="room">Salão</SelectItem>
                    <SelectItem value="field">Campo</SelectItem>
                    <SelectItem value="gym">Academia</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity-edit">Capacidade (pessoas) *</Label>
                <Input id="capacity-edit" type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openTime-edit">Horário Abertura</Label>
                <Input id="openTime-edit" type="time" value={formData.openTime} onChange={e => setFormData({...formData, openTime: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeTime-edit">Horário Fechamento</Label>
                <Input id="closeTime-edit" type="time" value={formData.closeTime} onChange={e => setFormData({...formData, closeTime: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDuration-edit">Duração Max Reserva (min)</Label>
                <Input id="maxDuration-edit" type="number" value={formData.maxDurationMinutes} onChange={e => setFormData({...formData, maxDurationMinutes: Number(e.target.value)})} />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center space-x-2">
                  <Switch id="approval-edit" checked={formData.requiresApproval} onCheckedChange={c => setFormData({...formData, requiresApproval: c})} />
                  <Label htmlFor="approval-edit">Requer Aprovação?</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateStructure.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures?.length ? structures.map(structure => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.name}</TableCell>
                    <TableCell>{{ court: 'Quadra', pool: 'Piscina', room: 'Salão', field: 'Campo', gym: 'Academia', other: 'Outro' }[structure.type] ?? structure.type}</TableCell>
                    <TableCell>{structure.capacity} pessoas</TableCell>
                    <TableCell>{structure.openTime || '--'} às {structure.closeTime || '--'}</TableCell>
                    <TableCell>
                      <Badge variant={structure.status === 'active' ? 'default' : 'secondary'}>
                        {{ active: 'Ativa', inactive: 'Inativa', maintenance: 'Manutenção' }[structure.status] ?? structure.status}
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
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(structure)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(structure.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma estrutura encontrada.
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
