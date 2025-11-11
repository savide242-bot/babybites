import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const { t } = useLanguage();

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
            <CardTitle>Language</CardTitle>
            <CardDescription>
              Application language settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div>
                  <p className="font-medium">Current Language</p>
                  <p className="text-sm text-muted-foreground">The app is available in English</p>
                </div>
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                  English
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
