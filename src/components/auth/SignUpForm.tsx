
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(8, {
    message: "A senha deve ter pelo menos 8 caracteres.",
  }),
})

interface SignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SignUpForm: React.FC<SignUpFormProps> = React.forwardRef<HTMLDivElement, SignUpFormProps>(({ className, ...props }, ref) => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signUp(values.email, values.password);
      toast.success("Conta criada com sucesso!");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error("Erro ao criar conta.", {
        description: error.message || "Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props} ref={ref}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seu-email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isLoading}>
            {isLoading && (
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            Criar conta
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou
          </span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4"
        >
          <path d="M9 19c-1.38 0-2.74-.5-3.88-1.4C3.16 15.17 1 12.28 1 9c0-3.87 3.13-7 7-7 3.36 0 6.24 2.27 6.84 5.48L13 13l-4 6z" />
          <path d="M22.14 18.56l-5.14-4.5L14 19l5 5 .14-3.44z" />
          <circle cx="18" cy="7" r="3" />
        </svg>
        Continuar com Google (Em breve)
      </Button>
      <div className="text-sm text-muted-foreground">
        Ao continuar, você concorda com nossos{" "}
        <Link to="/terms" className="underline underline-offset-4">
          Termos de Serviço
        </Link>{" "}
        e{" "}
        <Link to="/privacy" className="underline underline-offset-4">
          Política de Privacidade
        </Link>.
      </div>
      <div className="text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link to="/auth" className="text-[#3B82F6] hover:text-[#2563EB] underline font-medium">
          Entrar
        </Link>
      </div>
      <div className="text-sm text-muted-foreground">
        Ou, para ter acesso imediato:{" "}
        <a 
          href="https://clkdmg.site/subscribe/iacopychief-assinatura-mensal"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#3B82F6] hover:text-[#2563EB] underline font-medium"
        >
          Clique aqui para assinar
        </a>
      </div>
    </div>
  )
})
SignUpForm.displayName = "SignUpForm"
