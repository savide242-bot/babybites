import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/hooks/useLanguage';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const LanguageChoice = () => {
  const navigate = useNavigate();
  const { setLanguage } = useLanguage();
  const [busy, setBusy] = useState<Language | null>(null);

  const choose = async (lang: Language) => {
    setBusy(lang);
    await setLanguage(lang);
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-200 to-cyan-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-white/50 shadow-2xl">
        <CardContent className="p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-mint bg-clip-text text-transparent">
              BabyBites
            </h1>
            <p className="text-muted-foreground">Choose your language / Elige tu idioma</p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => choose('en')}
              disabled={busy !== null}
              size="lg"
              className="w-full h-14 text-lg justify-start gap-4"
              variant="outline"
            >
              <span className="text-2xl">🇺🇸</span>
              <span className="flex-1 text-left">English</span>
              {busy === 'en' && <Loader2 className="h-5 w-5 animate-spin" />}
            </Button>

            <Button
              onClick={() => choose('es')}
              disabled={busy !== null}
              size="lg"
              className="w-full h-14 text-lg justify-start gap-4"
              variant="outline"
            >
              <span className="text-2xl">🇪🇸</span>
              <span className="flex-1 text-left">Español</span>
              {busy === 'es' && <Loader2 className="h-5 w-5 animate-spin" />}
            </Button>
          </div>

          {busy === 'es' && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Preparando tu idioma...
            </p>
          )}

          <p className="text-xs text-muted-foreground pt-2">
            You can change this later in Settings · Puedes cambiarlo después en Ajustes
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageChoice;
