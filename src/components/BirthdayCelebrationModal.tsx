import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { Cake, Gift, Heart, Share2, Sparkles, X } from "lucide-react";
import ShareAchievementModal from "./ShareAchievementModal";

interface BirthdayNotification {
  id: string;
  baby_age_months: number;
  insight_text: string | null;
  seen: boolean;
}

// Insights de desenvolvimento por idade
const getDevelopmentInsights = (months: number): string => {
  const insights: { [key: number]: string } = {
    1: "Com 1 mês, o bebé começa a focar objetos a 20-30cm de distância e reconhece a voz da mãe. É uma fase de muito sono e crescimento rápido!",
    2: "Aos 2 meses, o bebé já sorri socialmente e começa a seguir objetos com os olhos. Pode começar a fazer sons de 'gugu'!",
    3: "Com 3 meses, o bebé sustenta melhor a cabeça e adora olhar para as próprias mãos. Os músculos estão a ficar mais fortes!",
    4: "Aos 4 meses, muitos bebés começam a rolar e a rir alto. A coordenação mão-olho está a desenvolver-se rapidamente!",
    5: "Com 5 meses, o bebé pode começar a sentar-se com apoio e demonstra interesse em brinquedos. A personalidade começa a mostrar-se!",
    6: "🎉 6 meses! Marco importante! O bebé pode começar a introdução alimentar. Começa a sentar-se sozinho e mostra interesse em comida sólida. É hora de experimentar purês!",
    7: "Aos 7 meses, o bebé pode começar a gatinhar e adora explorar texturas. Bom momento para variar os purês e introduzir novos sabores!",
    8: "Com 8 meses, muitos bebés já gatinham bem e começam a pegar objetos com o movimento de pinça. Pode experimentar alimentos mais texturizados!",
    9: "Aos 9 meses, o bebé pode começar a ficar de pé com apoio. A alimentação pode incluir pequenos pedaços macios. O paladar está a diversificar!",
    10: "Com 10 meses, o bebé adora imitar sons e gestos. Pode comer muitos alimentos da família, adaptados em textura e tempero!",
    11: "Aos 11 meses, o bebé pode dar os primeiros passos com apoio. A alimentação está cada vez mais variada e independente!",
    12: "🎂 1 ANINHO! Parabéns! O bebé já pode comer a maioria dos alimentos da família. Muitos já dizem 'mamã' e 'papá' e dão os primeiros passos sozinhos!",
    13: "Com 13 meses, a marcha está a desenvolver-se e o vocabulário começa a expandir. A alimentação pode ser cada vez mais autónoma!",
    14: "Aos 14 meses, o bebé adora explorar e já tem preferências alimentares definidas. Continue a oferecer variedade!",
    15: "Com 15 meses, a criança comunica-se melhor e pode ajudar a alimentar-se sozinha. É uma fase de grande independência!",
    16: "Aos 16 meses, a criança adora imitar adultos. Comer em família é uma ótima forma de ensinar bons hábitos!",
    17: "Com 17 meses, a criança já corre e sobe escadas. Precisa de muita energia - refeições nutritivas são essenciais!",
    18: "Aos 18 meses, a criança já tem vocabulário de 10-20 palavras e come de forma mais independente. Continue a oferecer refeições equilibradas!",
    24: "🎂 2 ANINHOS! A criança já fala frases curtas e come praticamente tudo! É importante manter rotinas alimentares saudáveis!",
    36: "🎂 3 ANINHOS! A criança já é muito independente e tem opiniões fortes sobre comida. Continue a ser um modelo de alimentação saudável!",
  };

  // Encontrar o insight mais próximo
  if (insights[months]) return insights[months];
  
  // Para idades não mapeadas, gerar texto genérico
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years >= 1) {
    return `Com ${years} ano${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `e ${remainingMonths} meses` : ''}, a criança continua a desenvolver-se rapidamente! Continue a oferecer uma alimentação variada e nutritiva para apoiar o crescimento saudável.`;
  }
  
  return `Com ${months} meses, o bebé está numa fase de grande desenvolvimento! Continue a acompanhar o crescimento com amor e atenção à nutrição.`;
};

const BirthdayCelebrationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState<BirthdayNotification | null>(null);
  const [babyName, setBabyName] = useState<string>("");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    checkBirthdayNotification();
  }, []);

  const checkBirthdayNotification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Buscar notificação não vista
      const { data: notifications } = await supabase
        .from('baby_birthday_notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('seen', false)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (notifications && notifications.length > 0) {
        setNotification(notifications[0]);
        
        // Buscar nome do bebé
        const { data: profile } = await supabase
          .from('profiles')
          .select('baby_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.baby_name) {
          setBabyName(profile.baby_name);
        }

        setIsOpen(true);
        
        // Confetti!
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.4 },
            colors: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399', '#FBBF24']
          });
        }, 300);
      }
    } catch (error) {
      console.error('Error checking birthday notification:', error);
    }
  };

  const handleClose = async () => {
    if (notification) {
      // Marcar como visto
      await supabase
        .from('baby_birthday_notifications')
        .update({ seen: true })
        .eq('id', notification.id);
    }
    setIsOpen(false);
  };

  const formatAge = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    }
    return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
  };

  if (!notification) return null;

  const ageText = formatAge(notification.baby_age_months);
  const insight = notification.insight_text || getDevelopmentInsights(notification.baby_age_months);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary via-pink-400 to-accent p-6 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative z-10 space-y-3">
              <div className="flex justify-center gap-2">
                <Cake className="h-12 w-12 animate-bounce" />
                <Gift className="h-12 w-12 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <Sparkles className="h-12 w-12 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              
              <h2 className="text-3xl font-bold">
                Parabéns, {babyName || 'Bebé'}! 🎉
              </h2>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                <p className="text-xl font-semibold">
                  {ageText}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-mint/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    O que esperar nesta fase
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShareOpen(true)}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Partilhar
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-primary to-mint text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareAchievementModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        achievement={{
          type: 'badge',
          title: `${babyName || 'Bebé'} faz ${ageText}!`,
          icon: '🎂',
          value: ageText
        }}
      />
    </>
  );
};

export default BirthdayCelebrationModal;
