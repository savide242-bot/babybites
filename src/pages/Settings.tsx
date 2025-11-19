import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { Settings as SettingsIcon, RefreshCw } from 'lucide-react';

const Settings = () => {
  const { t } = useLanguage();
  const { forceUpdate } = useServiceWorkerUpdate();

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            {t('settings.title')}
          </h1>
        </div>

        <div className="space-y-6">
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

          <Card className="border-2 shadow-elegant">
            <CardHeader>
              <CardTitle>App Updates</CardTitle>
              <CardDescription>
                Check for the latest version of BabyBites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={forceUpdate} className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Check for Updates
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                Updates are applied automatically when available. Use this button to manually check for new versions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
