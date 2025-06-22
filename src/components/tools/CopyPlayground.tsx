
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTokens } from '@/hooks/useTokens';
import { TokenUpgradeModal } from '@/components/tokens/TokenUpgradeModal';
import { toast } from 'sonner';
import { 
  Wand2, 
  Copy, 
  RefreshCw, 
  AlertCircle,
  Sparkles,
  FileText,
  Target,
  Settings
} from 'lucide-react';

export const CopyPlayground = () => {
  const { tokens, requireTokens, showUpgradeModal, setShowUpgradeModal } = useTokens();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [copyType, setCopyType] = useState('improve');
  const [tone, setTone] = useState('professional');
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenUpgrade, setShowTokenUpgrade] = useState(false);

  const copyTypes = {
    improve: { label: 'Melhorar Copy', tokens: 150, icon: Wand2 },
    rewrite: { label: 'Reescrever', tokens: 200, icon: RefreshCw },
    persuasive: { label: 'Tornar Persuasivo', tokens: 180, icon: Target },
    headlines: { label: 'Criar Headlines', tokens: 120, icon: Sparkles },
    social: { label: 'Adaptar para Redes Sociais', tokens: 100, icon: FileText }
  };

  const tones = {
    professional: 'Profissional',
    casual: 'Casual',
    friendly: 'Amigável',
    urgent: 'Urgente',
    authoritative: 'Autoritário',
    emotional: 'Emocional'
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast.error('Digite um texto para processar');
      return;
    }

    const selectedType = copyTypes[copyType as keyof typeof copyTypes];
    const requiredTokens = selectedType.tokens;

    // VERIFICAÇÃO CRÍTICA: Bloquear se não há tokens suficientes
    if (!requireTokens(requiredTokens, `ferramenta de ${selectedType.label.toLowerCase()}`)) {
      console.error('🚫 [CopyPlayground] Bloqueado - tokens insuficientes');
      setShowTokenUpgrade(true);
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 [CopyPlayground] Iniciando processamento com tokens suficientes');
      
      // Simulação de processamento (substitua pela sua implementação real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui você faria a chamada real para a API
      const processedText = `[${selectedType.label}] Texto processado em tom ${tones[tone as keyof typeof tones].toLowerCase()}:\n\n${inputText}\n\n--- Esta é uma simulação. Implemente sua lógica de processamento aqui. ---`;
      
      setOutputText(processedText);
      
      toast.success('Copy processado com sucesso!', {
        description: `${requiredTokens} tokens foram consumidos.`
      });

    } catch (error: any) {
      console.error('❌ [CopyPlayground] Erro no processamento:', error);
      
      if (error.message?.includes('token') || error.message?.includes('crédito')) {
        setShowTokenUpgrade(true);
        toast.error('Tokens insuficientes', {
          description: 'Você não possui tokens suficientes para esta operação.'
        });
      } else {
        toast.error('Erro no processamento', {
          description: error.message || 'Tente novamente em alguns instantes.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      toast.success('Texto copiado para a área de transferência!');
    }
  };

  const selectedTypeData = copyTypes[copyType as keyof typeof copyTypes];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Playground de Copy</h2>
        <p className="text-muted-foreground">
          Transforme e otimize seus textos com inteligência artificial
        </p>
        
        {/* AVISO DE TOKENS */}
        {tokens && tokens.total_available < 300 && (
          <Card className="mt-4 border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">
                  Você possui {tokens.total_available.toLocaleString()} tokens. 
                  As ferramentas consomem entre 100-200 tokens cada.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Texto Original
            </CardTitle>
            <CardDescription>
              Digite ou cole o texto que você deseja processar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Cole aqui o seu texto para ser processado..."
              className="min-h-[200px] resize-none"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="copyType">Tipo de Processamento</Label>
                <Select value={copyType} onValueChange={setCopyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(copyTypes).map(([key, type]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                          <Badge variant="secondary" className="ml-auto">
                            {type.tokens} tokens
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tom da Comunicação</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tones).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!inputText.trim() || isLoading || !tokens || tokens.total_available < selectedTypeData.tokens}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <selectedTypeData.icon className="h-4 w-4 mr-2" />
                  {selectedTypeData.label} ({selectedTypeData.tokens} tokens)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Resultado Processado
            </CardTitle>
            <CardDescription>
              Seu texto otimizado aparecerá aqui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={outputText}
              readOnly
              placeholder="O resultado do processamento aparecerá aqui..."
              className="min-h-[200px] resize-none bg-muted/50"
            />

            {outputText && (
              <Button onClick={handleCopy} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Resultado
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Token upgrade modal */}
      <TokenUpgradeModal
        isOpen={showUpgradeModal || showTokenUpgrade}
        onClose={() => {
          setShowUpgradeModal(false);
          setShowTokenUpgrade(false);
        }}
        tokensRemaining={tokens?.total_available || 0}
        isOutOfTokens={!tokens || tokens.total_available <= 0}
      />
    </div>
  );
};
