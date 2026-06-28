import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  useListReservations, 
  useCreateReservation, 
  useUpdateReservationStatus,
  useListStructures,
  getListReservationsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, Check, X, Info } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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

export default function Reservations() {
  const { user } = useAuth();
  const companyId = user?.companyId as number;
  const isMember = user?.companyRole === "member";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: reservations, isLoading } = useListReservations(companyId, {
    query: { enabled: !!companyId, queryKey: getListReservationsQueryKey(companyId) }
  });

  const { data: structures } = useListStructures(companyId, {
    query: { enabled: !!companyId }
  });
  
  const createReservation = useCreateReservation();
  const updateStatus = useUpdateReservationStatus();

  const [formData, setFormData] = useState({
    structureId: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "10:00",
    endTime: "11:00",
    notes: ""
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createReservation.mutate({ companyId, data: { ...formData, structureId: Number(formData.structureId) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey(companyId) });
        setIsCreateOpen(false);
        setFormData({ structureId: "", date: new Date().toISOString().split('T')[0], startTime: "10:00", endTime: "11:00", notes: "" });
        toast({ title: "Reserva criada com sucesso!" });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Erro ao criar reserva";
        toast({ title: msg, variant: "destructive" });
      }
    });
  };

  const handleStatusChange = (reservationId: number, status: string) => {
    updateStatus.mutate({ companyId, reservationId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey(companyId) });
        toast({ title: "Status atualizado!" });
      },
      onError: () => {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge variant="default">Confirmada</Badge>;
      case 'requested': return <Badge variant="secondary">Solicitada</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelada</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeitada</Badge>;
      case 'completed': return <Badge variant="outline">Concluída</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!companyId) return null;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
          <p className="text-muted-foreground mt-2">Gerencie as reservas das estruturas.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Reserva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Reserva</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="structure">Estrutura *</Label>
                <Select value={formData.structureId} onValueChange={v => setFormData({...formData, structureId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione a estrutura" /></SelectTrigger>
                  <SelectContent>
                    {structures?.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="date">Data *</Label>
                  <Input id="date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Início *</Label>
                  <Input id="startTime" type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Fim *</Label>
                  <Input id="endTime" type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createReservation.isPending || !formData.structureId}>Salvar</Button>
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
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Estrutura</TableHead>
                  {!isMember && <TableHead>Usuário</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations?.length ? reservations.map(res => {
                  const isOwn = res.userId === user?.id;
                  const canCancel = (res.status === 'requested' || res.status === 'confirmed') && (!isMember || isOwn);

                  return (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">{new Date(res.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{res.startTime} - {res.endTime}</TableCell>
                      <TableCell>{res.structureName}</TableCell>
                      {!isMember && <TableCell>{res.userName}</TableCell>}
                      <TableCell>{getStatusBadge(res.status)}</TableCell>
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
                            {!isMember && res.status === 'requested' && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(res.id, 'confirmed')}>
                                  <Check className="mr-2 h-4 w-4 text-green-500" /> Confirmar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(res.id, 'rejected')}>
                                  <X className="mr-2 h-4 w-4 text-red-500" /> Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            {canCancel && (
                              <DropdownMenuItem onClick={() => handleStatusChange(res.id, 'cancelled')}>
                                <X className="mr-2 h-4 w-4 text-red-500" /> Cancelar
                              </DropdownMenuItem>
                            )}
                            {!isMember && (
                              <DropdownMenuItem onClick={() => handleStatusChange(res.id, 'completed')}>
                                <Check className="mr-2 h-4 w-4" /> Marcar Concluída
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={isMember ? 5 : 6} className="text-center py-8 text-muted-foreground">
                      Nenhuma reserva encontrada.
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
