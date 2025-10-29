import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

type Language = 'en' | 'fr' | 'es' | 'de' | 'pt';

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

interface LanguageSelectorProps {
  onComplete: () => void;
}

const LanguageSelector = ({ onComplete }: LanguageSelectorProps) => {
  const { setLanguage, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    await setLanguage(selectedLanguage);
    setIsLoading(false);
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-2xl border-2 shadow-elegant">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
              {t('language.title')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('language.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {languages.map((lang) => (
              <Card
                key={lang.code}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                  selectedLanguage === lang.code
                    ? 'border-primary bg-primary/5 shadow-glow'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedLanguage(lang.code)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{lang.nativeName}</h3>
                    <p className="text-sm text-muted-foreground">{lang.name}</p>
                  </div>
                  {selectedLanguage === lang.code && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full h-12 text-lg rounded-full shadow-glow"
            size="lg"
          >
            {isLoading ? 'Loading...' : t('language.continue')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelector;
