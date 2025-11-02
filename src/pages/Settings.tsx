import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { Settings as SettingsIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

type Language = 'en' | 'fr' | 'es' | 'de' | 'pt';

const languages: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
];

const Settings = () => {
  const { language, setLanguage, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = selectedLanguage !== language;

  const handleSaveLanguage = async () => {
    setIsSaving(true);
    try {
      await setLanguage(selectedLanguage);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error('Error saving language');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            {t('settings.title')}
          </h1>
        </div>

        <Card className="border-2 shadow-elegant">
          <CardHeader>
            <CardTitle>{t('settings.language')}</CardTitle>
            <CardDescription>
              {t('settings.changeLanguage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="language">{t('settings.currentLanguage')}</Label>
              <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as Language)}>
                <SelectTrigger id="language" className="rounded-xl bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-2 z-50">
                  {languages.map((lang) => (
                    <SelectItem 
                      key={lang.code} 
                      value={lang.code}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{lang.name}</span>
                        {selectedLanguage === lang.code && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {hasChanges && (
                <Button
                  onClick={handleSaveLanguage}
                  disabled={isSaving}
                  size="lg"
                  className="w-full rounded-xl"
                >
                  {isSaving ? t('settings.saving') : t('settings.save')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
