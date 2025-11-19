import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { useDietaryPreferences, DIETARY_OPTIONS } from '@/hooks/useDietaryPreferences';
import { Settings as SettingsIcon, RefreshCw, Salad, Check } from 'lucide-react';

const Settings = () => {
  const { t } = useLanguage();
  const { forceUpdate } = useServiceWorkerUpdate();
  const { preferences, togglePreference, hasPreference, loading } = useDietaryPreferences();

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
              <CardTitle className="flex items-center gap-2">
                <Salad className="h-5 w-5" />
                Dietary Preferences
              </CardTitle>
              <CardDescription>
                Set your dietary restrictions to get personalized recipe recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {DIETARY_OPTIONS.map((option) => {
                      const isSelected = hasPreference(option.value);
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => togglePreference(option.value)}
                          className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                            isSelected
                              ? option.color + " border-2"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {isSelected && <Check className="h-4 w-4 text-white" />}
                            </div>
                            <span className="font-medium">{option.label}</span>
                          </div>
                          {isSelected && (
                            <Badge variant="default" className="rounded-full">
                              Active
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {preferences.length > 0 && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium mb-2">Your Preferences:</p>
                      <div className="flex flex-wrap gap-2">
                        {preferences.map((pref) => {
                          const option = DIETARY_OPTIONS.find((o) => o.value === pref);
                          return (
                            <Badge
                              key={pref}
                              variant="secondary"
                              className={option?.color || ''}
                            >
                              {option?.label}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Recipes matching your preferences will be highlighted with a "Perfect Match" badge
                      </p>
                    </div>
                  )}
                  
                  {preferences.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No dietary preferences selected. Select your restrictions above to get personalized recommendations.
                    </p>
                  )}
                </>
              )}
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
