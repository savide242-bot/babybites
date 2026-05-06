import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/hooks/useLanguage';
import { Loader2 } from 'lucide-react';

const LanguageCard = () => {
  const { language, setLanguage, isLoading } = useLanguage();

  const choose = (lang: Language) => {
    if (lang === language || isLoading) return;
    setLanguage(lang);
  };

  return (
    <Card className="border border-border/50 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-mint/5 pb-4">
        <CardTitle className="text-base">🌐 Language / Idioma</CardTitle>
        <CardDescription>
          {language === 'es' ? 'Elige el idioma de la app' : 'Choose the app language'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        <Button
          onClick={() => choose('en')}
          variant={language === 'en' ? 'default' : 'outline'}
          className="w-full justify-start gap-3 h-12"
          disabled={isLoading}
        >
          <span className="text-xl">🇺🇸</span>
          <span className="flex-1 text-left">English</span>
          {language === 'en' && <span className="text-xs">✓</span>}
        </Button>
        <Button
          onClick={() => choose('es')}
          variant={language === 'es' ? 'default' : 'outline'}
          className="w-full justify-start gap-3 h-12"
          disabled={isLoading}
        >
          <span className="text-xl">🇪🇸</span>
          <span className="flex-1 text-left">Español</span>
          {isLoading && language !== 'es' ? <Loader2 className="h-4 w-4 animate-spin" /> : language === 'es' && <span className="text-xs">✓</span>}
        </Button>
        {isLoading && (
          <p className="text-xs text-muted-foreground text-center pt-1 animate-pulse">
            Preparing translations…
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default LanguageCard;
