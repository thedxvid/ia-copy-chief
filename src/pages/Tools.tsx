
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Star, 
  Mail, 
  ArrowRight, 
  Search, 
  Book,
  Zap,
  TrendingUp,
  Users,
  MessageCircle,
  Eye,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Tools = () => {
  const { toast } = useToast();
  const [headlineInput, setHeadlineInput] = React.useState('');
  const [generatedHeadlines, setGeneratedHeadlines] = React.useState<string[]>([]);
  const [ctaInput, setCtaInput] = React.useState('');
  const [generatedCtas, setGeneratedCtas] = React.useState<string[]>([]);

  const gatilhosMentais = [
    {
      categoria: 'Escassez',
      icon: Clock,
      gatilhos: [
        'Últimas 24 horas',
        'Apenas 10 vagas restantes',
        'Promoção por tempo limitado',
        'Estoque limitado',
        'Oferta exclusiva'
      ]
    },
    {
      categoria: 'Urgência',
      icon: Zap,
      gatilhos: [
        'AGORA ou NUNCA',
        'Não perca essa oportunidade',
        'Ação necessária hoje',
        'Prazo final: meia-noite',
        'Últimas horas'
      ]
    },
    {
      categoria: 'Autoridade',
      icon: Star,
      gatilhos: [
        'Recomendado por especialistas',
        'Usado por mais de 10.000 pessoas',
        'Método aprovado por médicos',
        'Certificado internacionalmente',
        'Líder de mercado'
      ]
    },
    {
      categoria: 'Prova Social',
      icon: Users,
      gatilhos: [
        'Mais de 5.000 clientes satisfeitos',
        'Nota 4.9/5 no Google',
        'Recomendado por influenciadores',
        'Case de sucesso comprovado',
        'Depoimentos reais'
      ]
    },
    {
      categoria: 'Curiosidade',
      icon: Eye,
      gatilhos: [
        'O segredo que ninguém conta',
        'Descoberta revolucionária',
        'Método secreto revelado',
        'O que os experts escondem',
        'Verdade por trás dos resultados'
      ]
    },
    {
      categoria: 'Benefício',
      icon: Heart,
      gatilhos: [
        'Resultado em 30 dias',
        'Garantia de satisfação',
        'Sem risco, sem compromisso',
        'Dinheiro de volta se não funcionar',
        'Acesso vitalício'
      ]
    }
  ];

  const emailTemplates = [
    {
      titulo: 'Welcome Series - Email 1',
      assunto: 'Bem-vindo(a)! Sua jornada começa agora 🎉',
      corpo: `Olá [NOME],

Seja muito bem-vindo(a) à nossa comunidade!

Estou [SEU NOME], e vou te acompanhar nesta jornada de transformação.

Nos próximos dias, você vai receber:

📧 Dia 1 (hoje): Boas-vindas + primeiro passo
📧 Dia 3: Estratégias comprovadas
📧 Dia 7: Case de sucesso real
📧 Dia 14: Oferta especial

Sua primeira missão é simples:
[PRIMEIRA AÇÃO ESPECÍFICA]

Qualquer dúvida, responda este email.

Um abraço,
[SEU NOME]

P.S.: Salve meu contato para não perder nenhuma mensagem importante!`
    },
    {
      titulo: 'Reativação de Lead',
      assunto: 'Sentimos sua falta... 💔',
      corpo: `Oi [NOME],

Notei que você se afastou um pouco...

E isso me preocupa porque sei do seu potencial para [OBJETIVO/BENEFÍCIO].

Talvez você esteja pensando:
"Não é para mim..."
"Não tenho tempo..."
"Não vai funcionar..."

Eu entendo. Já estive no seu lugar.

Mas e se eu te contasse que [ESTATÍSTICA/PROVA]?

Dê uma nova chance para si mesmo(a).

Clique aqui e vamos conversar: [LINK]

Acredito em você,
[SEU NOME]

P.S.: Esta pode ser sua última oportunidade de [BENEFÍCIO].`
    }
  ];

  const generateHeadlines = () => {
    if (!headlineInput.trim()) {
      toast({
        title: 'Digite seu produto',
        description: 'Preciso saber sobre o que você vende para gerar headlines.',
        variant: 'destructive'
      });
      return;
    }

    const headlines = [
      `Como ${headlineInput} Pode Transformar Sua Vida em 30 Dias`,
      `O Segredo Por Trás do Sucesso com ${headlineInput}`,
      `REVELADO: O Método Definitivo de ${headlineInput}`,
      `Por Que ${headlineInput} É a Chave Para Seu Sucesso`,
      `${headlineInput}: O Que Ninguém Te Conta (Mas Deveria)`,
      `A Verdade Sobre ${headlineInput} Que Vai Te Surpreender`,
      `Como Dominar ${headlineInput} Mesmo Sendo Iniciante`,
      `O Guia Completo de ${headlineInput} Para Resultados Rápidos`
    ];

    setGeneratedHeadlines(headlines);
    toast({
      title: 'Headlines geradas!',
      description: 'Veja as opções abaixo e escolha a que mais combina.',
    });
  };

  const generateCtas = () => {
    if (!ctaInput.trim()) {
      toast({
        title: 'Digite sua oferta',
        description: 'Preciso saber o que você está oferecendo para gerar CTAs.',
        variant: 'destructive'
      });
      return;
    }

    const ctas = [
      `QUERO ${ctaInput.toUpperCase()} AGORA →`,
      `SIM! Quero Garantir Meu ${ctaInput}`,
      `Começar Minha Transformação →`,
      `CLIQUE AQUI e Garanta Seu ${ctaInput}`,
      `Não Quero Perder Esta Oportunidade →`,
      `QUERO ACESSO IMEDIATO →`,
      `Fazer Parte Agora →`,
      `GARANTIR MINHA VAGA →`
    ];

    setGeneratedCtas(ctas);
    toast({
      title: 'CTAs gerados!',
      description: 'Escolha o call-to-action que mais converte.',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Ferramentas <span className="text-gradient">Criativas</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Acelere sua criação de conteúdo com nossas ferramentas especializadas
          </p>
        </div>

        <Tabs defaultValue="headlines" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="headlines">Headlines</TabsTrigger>
            <TabsTrigger value="gatilhos">Gatilhos</TabsTrigger>
            <TabsTrigger value="ctas">CTAs</TabsTrigger>
            <TabsTrigger value="emails">E-mails</TabsTrigger>
          </TabsList>

          {/* Headlines Generator */}
          <TabsContent value="headlines">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Gerador de Headlines
                </CardTitle>
                <CardDescription>
                  Crie títulos impactantes que capturam atenção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="headline-input">Seu produto/serviço:</Label>
                  <Input
                    id="headline-input"
                    placeholder="Ex: Curso de Marketing Digital"
                    value={headlineInput}
                    onChange={(e) => setHeadlineInput(e.target.value)}
                  />
                </div>
                
                <Button onClick={generateHeadlines} className="w-full md:w-auto">
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Headlines
                </Button>

                {generatedHeadlines.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Headlines Geradas:</h3>
                    {generatedHeadlines.map((headline, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-lg flex justify-between items-center"
                      >
                        <span className="flex-1">{headline}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(headline)}
                        >
                          Copiar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gatilhos Mentais */}
          <TabsContent value="gatilhos">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gatilhosMentais.map((categoria, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <categoria.icon className="w-5 h-5 mr-2" />
                      {categoria.categoria}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoria.gatilhos.map((gatilho, gIndex) => (
                        <div
                          key={gIndex}
                          className="p-2 bg-muted rounded cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => copyToClipboard(gatilho)}
                        >
                          <span className="text-sm">{gatilho}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* CTA Generator */}
          <TabsContent value="ctas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Gerador de CTAs
                </CardTitle>
                <CardDescription>
                  Crie call-to-actions que convertem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="cta-input">Sua oferta:</Label>
                  <Input
                    id="cta-input"
                    placeholder="Ex: Acesso ao Curso"
                    value={ctaInput}
                    onChange={(e) => setCtaInput(e.target.value)}
                  />
                </div>
                
                <Button onClick={generateCtas} className="w-full md:w-auto">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Gerar CTAs
                </Button>

                {generatedCtas.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">CTAs Gerados:</h3>
                    {generatedCtas.map((cta, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted rounded-lg flex justify-between items-center"
                      >
                        <span className="flex-1 font-medium">{cta}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(cta)}
                        >
                          Copiar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates */}
          <TabsContent value="emails">
            <div className="space-y-6">
              {emailTemplates.map((template, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      {template.titulo}
                    </CardTitle>
                    <CardDescription>
                      <strong>Assunto:</strong> {template.assunto}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        value={template.corpo}
                        readOnly
                        className="min-h-[300px] font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(template.corpo)}
                        className="w-full md:w-auto"
                      >
                        Copiar Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Continue otimizando suas campanhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto p-4 text-left" asChild>
                <Link to="/quiz">
                  <div>
                    <h4 className="font-semibold mb-1">Criar Novo Projeto</h4>
                    <p className="text-sm text-muted-foreground">
                      Comece um novo questionário estratégico
                    </p>
                  </div>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 text-left" asChild>
                <Link to="/dashboard">
                  <div>
                    <h4 className="font-semibold mb-1">Ver Dashboard</h4>
                    <p className="text-sm text-muted-foreground">
                      Acesse suas copies já criadas
                    </p>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Clock icon component
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

export default Tools;
