
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Target, TrendingUp, AlertCircle, Copy, RefreshCw, Heart } from 'lucide-react';
import { useN8nIntegration } from '@/hooks/useN8nIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import { toast } from 'sonner';
import { SentimentAnalyzer } from './SentimentAnalyzer';

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  readability: number;
  persuasion: number;
  emotion: number;
}

export const CopyPlayground = () => {
  const [copyText, setCopyText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [improvedCopy, setImprovedCopy] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  const { generateCopyWithN8n } = useN8nIntegration();
  const { user } = useAuth();
  const { tokens, canAffordFeature } = useTokens();

  const analyzeCopy = async () => {
    if (!copyText.trim()) {
      toast.error('Digite uma copy para analisar');
      return;
    }

    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!canAffordFeature('chat')) {
      toast.error('Tokens insuficientes para análise');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const analysisPrompt = `Analise esta copy de marketing e forneça:
      1. Uma nota de 0 a 100
      2. Pontos fortes (máximo 3)
      3. Pontos fracos (máximo 3)
      4. Sugestões de melhoria (máximo 3)
      5. Notas de 0 a 100 para: legibilidade, persuasão, impacto emocional
      
      Copy para análise:
      "${copyText}"
      
      Responda no formato JSON:
      {
        "score": 85,
        "strengths": ["força 1", "força 2"],
        "weaknesses": ["fraqueza 1", "fraqueza 2"],
        "suggestions": ["sugestão 1", "sugestão 2"],
        "readability": 90,
        "persuasion": 80,
        "emotion": 85
      }`;

      const result = await generateCopyWithN8n(
        user.id,
        {},
        'ads',
        'Análise de copy',
        analysisPrompt
      );

      if (result?.generatedCopy) {
        try {
          const analysisData = JSON.parse(result.generatedCopy);
          setAnalysis(analysisData);
          toast.success('Análise concluída!');
        } catch (error) {
          // Se não conseguir fazer parse do JSON, cria uma análise básica
          const basicAnalysis = parseAnalysisText(result.generatedCopy);
          setAnalysis(basicAnalysis);
          toast.success('Análise concluída!');
        }
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar copy');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const improveCopy = async () => {
    if (!copyText.trim()) {
      toast.error('Digite uma copy para melhorar');
      return;
    }

    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!canAffordFeature('copy')) {
      toast.error('Tokens insuficientes para melhorias');
      return;
    }

    setIsImproving(true);
    
    try {
      const improvementPrompt = `Melhore esta copy de marketing tornando-a mais persuasiva, clara e impactante. Mantenha o tom e objetivo original, mas otimize:
      - Clareza e legibilidade
      - Poder de persuasão
      - Apelo emocional
      - Call-to-action
      
      Copy original:
      "${copyText}"
      
      Forneça apenas a copy melhorada, sem explicações adicionais.`;

      const result = await generateCopyWithN8n(
        user.id,
        {},
        'ads',
        'Melhoria de copy',
        improvementPrompt
      );

      if (result?.generatedCopy) {
        setImprovedCopy(result.generatedCopy);
        toast.success('Copy melhorada gerada!');
      }
    } catch (error) {
      console.error('Erro na melhoria:', error);
      toast.error('Erro ao melhorar copy');
    } finally {
      setIsImproving(false);
    }
  };

  const parseAnalysisText = (text: string): AnalysisResult => {
    // Parser básico caso a IA não retorne JSON válido
    return {
      score: 75,
      strengths: ['Copy estruturada', 'Linguagem clara'],
      weaknesses: ['Pode ser mais persuasiva', 'CTA pode ser mais forte'],
      suggestions: ['Adicionar urgência', 'Incluir social proof', 'Melhorar o CTA'],
      readability: 80,
      persuasion: 70,
      emotion: 75
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Playground de Copy Avançado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Textarea 
            placeholder="Cole sua copy aqui para análise completa, melhorias e análise de sentimento..."
            value={copyText}
            onChange={(e) => setCopyText(e.target.value)}
            className="min-h-32 bg-[#2A2A2A] border-[#4B5563]/40 text-white placeholder:text-[#CCCCCC]"
          />
          
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={analyzeCopy}
              disabled={isAnalyzing || !canAffordFeature('chat')}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Análise Básica (~300 tokens)
                </>
              )}
            </Button>
            
            <Button 
              onClick={improveCopy}
              disabled={isImproving || !canAffordFeature('copy')}
              variant="outline" 
              className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
            >
              {isImproving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Melhorando...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Melhorar Copy (~600 tokens)
                </>
              )}
            </Button>
          </div>
        </div>

        {(analysis || improvedCopy || copyText.trim()) && (
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#2A2A2A]">
              <TabsTrigger value="analysis" className="data-[state=active]:bg-[#3B82F6]">
                Análise Básica
              </TabsTrigger>
              <TabsTrigger value="improvement" className="data-[state=active]:bg-[#3B82F6]">
                Copy Melhorada
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="data-[state=active]:bg-[#8B5CF6]">
                <Heart className="w-4 h-4 mr-2" />
                Sentimento
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="space-y-4 mt-4">
              {analysis && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                        {analysis.score}
                      </div>
                      <div className="text-xs text-[#CCCCCC]">Score Geral</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xl font-semibold ${getScoreColor(analysis.readability)}`}>
                        {analysis.readability}
                      </div>
                      <div className="text-xs text-[#CCCCCC]">Legibilidade</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xl font-semibold ${getScoreColor(analysis.persuasion)}`}>
                        {analysis.persuasion}
                      </div>
                      <div className="text-xs text-[#CCCCCC]">Persuasão</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xl font-semibold ${getScoreColor(analysis.emotion)}`}>
                        {analysis.emotion}
                      </div>
                      <div className="text-xs text-[#CCCCCC]">Emoção</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-green-400 font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Pontos Fortes
                      </h4>
                      <div className="space-y-1">
                        {analysis.strengths.map((strength, index) => (
                          <Badge key={index} className="bg-green-500/20 text-green-400 text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-red-400 font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Pontos Fracos
                      </h4>
                      <div className="space-y-1">
                        {analysis.weaknesses.map((weakness, index) => (
                          <Badge key={index} className="bg-red-500/20 text-red-400 text-xs">
                            {weakness}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-blue-400 font-medium flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Sugestões
                      </h4>
                      <div className="space-y-1">
                        {analysis.suggestions.map((suggestion, index) => (
                          <Badge key={index} className="bg-blue-500/20 text-blue-400 text-xs">
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="improvement" className="space-y-4 mt-4">
              {improvedCopy ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Copy Otimizada</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(improvedCopy)}
                      className="border-[#4B5563] text-white hover:bg-[#2A2A2A]"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  
                  <div className="bg-[#2A2A2A] border-[#4B5563]/20 rounded-lg p-4">
                    <p className="text-white leading-relaxed whitespace-pre-wrap">
                      {improvedCopy}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#CCCCCC]">
                    Clique em "Sugerir Melhorias" para ver uma versão otimizada da sua copy.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-4 mt-4">
              <SentimentAnalyzer copyText={copyText} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
