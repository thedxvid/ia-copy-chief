
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Heart, Zap, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { useN8nIntegration } from '@/hooks/useN8nIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import { toast } from 'sonner';

interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  emotional_triggers: string[];
  persuasion_elements: {
    urgency: number;
    scarcity: number;
    social_proof: number;
    authority: number;
    reciprocity: number;
    commitment: number;
  };
  readability: {
    score: number;
    grade_level: string;
    avg_words_per_sentence: number;
  };
  psychological_hooks: string[];
  improvement_suggestions: string[];
  target_emotions: string[];
  conversion_indicators: {
    cta_strength: number;
    benefit_clarity: number;
    pain_point_emphasis: number;
    trust_signals: number;
  };
}

interface SentimentAnalyzerProps {
  copyText: string;
}

export const SentimentAnalyzer = ({ copyText }: SentimentAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<SentimentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { generateCopyWithN8n } = useN8nIntegration();
  const { user } = useAuth();
  const { canAffordFeature } = useTokens();

  const analyzeSentiment = async () => {
    if (!copyText.trim()) {
      toast.error('Digite uma copy para analisar o sentimento');
      return;
    }

    if (!user?.id) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!canAffordFeature('copy')) {
      toast.error('Tokens insuficientes para análise avançada');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const analysisPrompt = `Faça uma análise avançada de sentimento e persuasão desta copy de marketing. Retorne um JSON com a seguinte estrutura:

{
  "overall_sentiment": "positive|negative|neutral",
  "sentiment_score": 85,
  "emotional_triggers": ["urgência", "medo de perder", "aspiração"],
  "persuasion_elements": {
    "urgency": 90,
    "scarcity": 75,
    "social_proof": 60,
    "authority": 80,
    "reciprocity": 40,
    "commitment": 70
  },
  "readability": {
    "score": 85,
    "grade_level": "8ª série",
    "avg_words_per_sentence": 12
  },
  "psychological_hooks": ["escassez", "prova social", "autoridade"],
  "improvement_suggestions": ["Adicionar mais urgência", "Incluir depoimentos"],
  "target_emotions": ["desejo", "urgência", "confiança"],
  "conversion_indicators": {
    "cta_strength": 80,
    "benefit_clarity": 90,
    "pain_point_emphasis": 75,
    "trust_signals": 60
  }
}

Copy para análise:
"${copyText}"

Analise todos os aspectos psicológicos, emocionais e de persuasão. Seja preciso nas métricas (0-100).`;

      const result = await generateCopyWithN8n(
        user.id,
        {},
        'ads',
        'Análise de sentimento avançada',
        analysisPrompt
      );

      if (result?.generatedCopy) {
        try {
          const analysisData = JSON.parse(result.generatedCopy);
          setAnalysis(analysisData);
          toast.success('Análise de sentimento concluída!');
        } catch (error) {
          console.error('Erro ao fazer parse da análise:', error);
          toast.error('Erro ao processar análise');
        }
      }
    } catch (error) {
      console.error('Erro na análise de sentimento:', error);
      toast.error('Erro ao analisar sentimento');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Análise de Sentimento Avançada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={analyzeSentiment}
            disabled={isAnalyzing || !canAffordFeature('copy')}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
          >
            {isAnalyzing ? 'Analisando sentimento...' : 'Analisar Sentimento (~800 tokens)'}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid gap-6">
          {/* Sentimento Geral */}
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Sentimento Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSentimentIcon(analysis.overall_sentiment)}</span>
                  <div>
                    <div className={`text-lg font-semibold ${getSentimentColor(analysis.overall_sentiment)}`}>
                      {analysis.overall_sentiment.toUpperCase()}
                    </div>
                    <div className="text-sm text-[#CCCCCC]">Score: {analysis.sentiment_score}/100</div>
                  </div>
                </div>
                <Progress value={analysis.sentiment_score} className="w-32" />
              </div>
            </CardContent>
          </Card>

          {/* Elementos de Persuasão */}
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Elementos de Persuasão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(analysis.persuasion_elements).map(([element, score]) => (
                  <div key={element} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white capitalize">
                        {element.replace('_', ' ')}
                      </span>
                      <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Indicadores de Conversão */}
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Indicadores de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(analysis.conversion_indicators).map(([indicator, score]) => (
                  <div key={indicator} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white capitalize">
                        {indicator.replace('_', ' ')}
                      </span>
                      <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gatilhos Emocionais */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Gatilhos Emocionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.emotional_triggers.map((trigger, index) => (
                    <Badge key={index} className="bg-yellow-500/20 text-yellow-400">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Hooks Psicológicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.psychological_hooks.map((hook, index) => (
                    <Badge key={index} className="bg-purple-500/20 text-purple-400">
                      {hook}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sugestões de Melhoria */}
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Sugestões de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.improvement_suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-[#2A2A2A] rounded-lg">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-white text-sm">{suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legibilidade */}
          <Card className="bg-[#1E1E1E] border-[#4B5563]/20">
            <CardHeader>
              <CardTitle className="text-white">Legibilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.readability.score)}`}>
                    {analysis.readability.score}
                  </div>
                  <div className="text-xs text-[#CCCCCC]">Score</div>
                </div>
                <div>
                  <div className="text-lg text-white">{analysis.readability.grade_level}</div>
                  <div className="text-xs text-[#CCCCCC]">Nível</div>
                </div>
                <div>
                  <div className="text-lg text-white">{analysis.readability.avg_words_per_sentence}</div>
                  <div className="text-xs text-[#CCCCCC]">Palavras/Frase</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
