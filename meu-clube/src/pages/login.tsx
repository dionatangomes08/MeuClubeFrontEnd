import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const login = useLogin();
  
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe seu telefone e senha.",
        variant: "destructive",
      });
      return;
    }

    login.mutate({ data: { phone, password } }, {
      onSuccess: async () => {
        await queryClient.refetchQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        const msg = err?.data?.error;
        toast({
          title: "Falha no acesso",
          description: msg === "Entre em contato com a Administração"
            ? msg
            : "Telefone ou senha inválidos. Tente novamente.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Meu Clube</h1>
          <p className="text-muted-foreground mt-2">Plataforma de gestão de clubes e condomínios</p>
        </div>
        
        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Acessar conta</CardTitle>
            <CardDescription>
              Informe seu telefone e senha para entrar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="(00) 00000-0000" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={login.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={login.isPending}
                />
              </div>
              
              <Button type="submit" className="w-full mt-6" disabled={login.isPending}>
                {login.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-8">
          &copy; {new Date().getFullYear()} Meu Clube. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
