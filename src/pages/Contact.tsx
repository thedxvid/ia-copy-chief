
import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { FadeInSection } from '@/components/ui/fade-in-section';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MessageCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envio do formulário
    setTimeout(() => {
      toast.success('Mensagem enviada com sucesso! Retornaremos em breve.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-[#121212] font-inter">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white">
                Entre em
                <span className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent"> Contato</span>
              </h1>
              <p className="text-xl text-[#CCCCCC] max-w-3xl mx-auto">
                Estamos aqui para ajudar você a revolucionar suas vendas com copywriting inteligente
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <FadeInSection delay={100}>
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Fale Conosco</h2>
                  <p className="text-lg text-[#CCCCCC] mb-8">
                    Tem dúvidas sobre nossa plataforma? Precisa de suporte técnico? 
                    Nossa equipe está pronta para ajudar você a alcançar seus objetivos.
                  </p>
                </div>

                <div className="space-y-6">
                  <ModernCard className="p-6 bg-[#1E1E1E] border border-[#4B5563]/30">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Email</h3>
                        <p className="text-[#CCCCCC]">contato@copychief.com.br</p>
                      </div>
                    </div>
                  </ModernCard>

                  <ModernCard className="p-6 bg-[#1E1E1E] border border-[#4B5563]/30">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Suporte</h3>
                        <p className="text-[#CCCCCC]">Atendimento personalizado via chat</p>
                      </div>
                    </div>
                  </ModernCard>

                  <ModernCard className="p-6 bg-[#1E1E1E] border border-[#4B5563]/30">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Horário</h3>
                        <p className="text-[#CCCCCC]">Segunda a Sexta, 9h às 18h</p>
                      </div>
                    </div>
                  </ModernCard>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={200}>
              <ModernCard className="p-8 bg-[#1E1E1E] border border-[#4B5563]/30">
                <h3 className="text-2xl font-bold text-white mb-6">Envie sua Mensagem</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-[#CCCCCC] mb-2">
                        Nome
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[#CCCCCC] mb-2">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-[#2A2A2A] border-[#4B5563] text-white"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-[#CCCCCC] mb-2">
                      Assunto
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="bg-[#2A2A2A] border-[#4B5563] text-white"
                      placeholder="Como podemos ajudar?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-[#CCCCCC] mb-2">
                      Mensagem
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="bg-[#2A2A2A] border-[#4B5563] text-white resize-none"
                      placeholder="Descreva sua dúvida ou necessidade..."
                    />
                  </div>

                  <ModernButton
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E40AF] text-white font-semibold py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </ModernButton>
                </form>
              </ModernCard>
            </FadeInSection>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
