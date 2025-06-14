
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePerformanceAnalytics } from '@/hooks/usePerformanceAnalytics';

const metricsSchema = z.object({
  product_id: z.string().min(1, 'Produto é obrigatório'),
  conversion_rate: z.number().min(0).max(100).optional(),
  ctr: z.number().min(0).max(100).optional(),
  sales_generated: z.number().min(0).optional(),
  engagement_rate: z.number().min(0).max(100).optional(),
  roi_real: z.number().optional(),
  impressions: z.number().min(0).optional(),
  campaign_start: z.string().optional(),
  campaign_end: z.string().optional(),
  notes: z.string().optional(),
});

type MetricsFormData = z.infer<typeof metricsSchema>;

interface AddMetricsModalProps {
  products: Array<{ id: string; name: string }>;
  trigger?: React.ReactNode;
}

export const AddMetricsModal: React.FC<AddMetricsModalProps> = ({ 
  products, 
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addMetrics } = usePerformanceAnalytics();

  const form = useForm<MetricsFormData>({
    resolver: zodResolver(metricsSchema),
    defaultValues: {
      product_id: '',
      conversion_rate: undefined,
      ctr: undefined,
      sales_generated: undefined,
      engagement_rate: undefined,
      roi_real: undefined,
      impressions: undefined,
      campaign_start: '',
      campaign_end: '',
      notes: '',
    },
  });

  const onSubmit = async (data: MetricsFormData) => {
    setLoading(true);
    
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined && value !== '')
    );

    const success = await addMetrics(cleanData);
    
    if (success) {
      setOpen(false);
      form.reset();
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB]">
            Adicionar Métricas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Adicionar Métricas de Performance</DialogTitle>
          <DialogDescription className="text-[#CCCCCC]">
            Registre os resultados reais da sua campanha para análise de performance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Produto</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#4B5563] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                      <option value="">Selecione um produto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conversion_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Taxa de Conversão (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ctr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">CTR (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sales_generated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Vendas Geradas (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roi_real"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">ROI (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="engagement_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Taxa de Engajamento (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impressions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Impressões</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="campaign_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Data de Início</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaign_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Data de Término</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre a campanha..."
                      {...field}
                      className="bg-[#2A2A2A] border-[#4B5563] text-white"
                    />
                  </FormControl>
                  <FormDescription className="text-[#888888]">
                    Informações extras sobre a performance da campanha
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-[#3B82F6] hover:bg-[#2563EB]"
              >
                {loading ? 'Salvando...' : 'Salvar Métricas'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
