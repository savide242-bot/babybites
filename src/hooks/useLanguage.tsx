import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isLoading: boolean;
  translateMany: (items: { key: string; text: string }[]) => Promise<Record<string, string>>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const enTranslations: Record<string, string> = {
  // Home
  'home.hero.title': 'Healthy Nutrition for Your Baby',
  'home.hero.subtitle': "Expert guidance, recipes, and tracking tools for your little one's nutrition journey",
  'home.hero.getStarted': 'Get Started',
  'home.stats.recipes': 'Recipes',
  'home.stats.parents': 'Happy Parents',
  'home.stats.experts': 'Expert Tips',
  'home.floating.ageAppropriate': 'Age-Appropriate Meals',
  'home.floating.nutritionTracking': 'Nutrition Tracking',
  'home.features.title': 'Everything You Need',
  'home.features.recipes': 'Healthy Recipes',
  'home.features.recipesDesc': 'Age-appropriate meal ideas',
  'home.features.growth': 'Growth Tracker',
  'home.features.growthDesc': "Monitor your baby's development",
  'home.features.scanner': 'Food Scanner',
  'home.features.scannerDesc': 'Check food safety instantly',
  'home.features.community': 'Community',
  'home.features.communityDesc': 'Connect with other parents',
  'home.cta.title': 'Start Your Journey Today',
  'home.cta.subtitle': 'Join thousands of parents providing the best nutrition for their babies',
  'home.cta.button': 'Get Started Now',

  // Header / Nav
  'nav.home': 'Home',
  'nav.recipes': 'Recipes',
  'nav.planner': 'Meal Planner',
  'nav.growth': 'Growth',
  'nav.scanner': 'Scanner',
  'nav.progressReports': 'Progress Reports',
  'nav.shoppingList': 'Shopping List',
  'nav.community': 'Community',
  'nav.advice': 'Advice',
  'nav.bonus': 'Bonus',
  'nav.chat': 'Chat',
  'nav.settings': 'Settings',
  'nav.favorites': 'Favorites',
  'nav.profile': 'Profile',
  'nav.diary': 'Food Diary',
  'nav.achievements': 'Achievements',

  // Common
  'common.back': 'Back',
  'common.next': 'Next',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.loading': 'Loading...',
  'common.continue': 'Continue',
  'common.close': 'Close',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.search': 'Search',

  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.languageDesc': 'Choose your preferred language',
  'settings.changeLanguage': 'Change Language',
  'settings.currentLanguage': 'Current Language',
  'settings.save': 'Save Changes',
  'settings.saving': 'Saving...',
  'settings.saved': 'Settings saved successfully!',

  // Language picker
  'language.choose': 'Choose your language',
  'language.chooseDesc': 'Select the language you prefer to use BabyBites',
  'language.english': 'English',
  'language.spanish': 'Spanish',
  'language.continue': 'Continue',
  'language.translating': 'Preparing your language...',

  // Auth
  'auth.signIn': 'Sign In',
  'auth.signUp': 'Sign Up',
  'auth.signUpDescription': 'Create an account to get started',
  'auth.signInDescription': 'Welcome back! Sign in to continue',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.fullName': 'Full Name',
  'auth.loading': 'Loading...',
  'auth.orContinueWith': 'Or continue with',
  'auth.continueWithGoogle': 'Continue with Google',
  'auth.haveAccount': 'Already have an account?',
  'auth.noAccount': "Don't have an account?",
  'auth.signUpSuccess': 'Account created successfully!',
  'auth.signInSuccess': 'Signed in successfully!',
  'auth.error': 'An error occurred',
  'auth.googleError': 'Failed to sign in with Google',

  // Recipes
  'recipes.title': 'Recipe Library',
  'recipes.subtitle': 'Browse our collection of pediatrician-approved recipes for babies aged 6-24 months',
  'recipes.search': 'Search recipes...',
  'recipes.viewRecipe': 'View Recipe',
  'recipes.ingredients': 'Ingredients',
  'recipes.instructions': 'Instructions',
  'recipes.nutrition': 'Nutrition Information',
  'recipes.addToPlanner': 'Add to Meal Planner',
  'recipes.backToRecipes': 'Back to Recipes',
  'recipes.noResults': 'No recipes found',
  'recipes.clearFilters': 'Clear Filters',

  // Meal Planner
  'planner.title': 'Weekly Meal Planner',
  'planner.subtitle': "Plan your baby's meals for the week",
  'planner.breakfast': 'Breakfast',
  'planner.lunch': 'Lunch',
  'planner.dinner': 'Dinner',
  'planner.snack': 'Snack',
  'planner.monday': 'Monday',
  'planner.tuesday': 'Tuesday',
  'planner.wednesday': 'Wednesday',
  'planner.thursday': 'Thursday',
  'planner.friday': 'Friday',
  'planner.saturday': 'Saturday',
  'planner.sunday': 'Sunday',

  // Welcome modal
  'welcome.title': 'Welcome to BabyBites, {name}!',
  'welcome.subtitle': "I'm Emily Harter, pediatric nutritionist. Let's start your baby's nutrition journey — the right way.",
  'welcome.starterKit': 'Your starter kit:',
  'welcome.feature1': '300+ recipes built with smart food combinations',
  'welcome.feature2': 'Weekly meal planner — no more guessing',
  'welcome.feature3': 'Food safety scanner & growth tracker',
  'welcome.feature4': 'Direct support from me & my team',
  'welcome.start': 'Start Exploring',
};

const STORAGE_KEY = 'app_language';
const CACHE_PREFIX = 'i18n_cache_v1_';

const getCache = (lang: Language): Record<string, string> => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + lang);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};
const setCache = (lang: Language, data: Record<string, string>) => {
  try { localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(data)); } catch {}
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as Language | null;
    return saved === 'es' || saved === 'en' ? saved : 'en';
  });
  const [esCache, setEsCache] = useState<Record<string, string>>(() => getCache('es'));
  const [isLoading, setIsLoading] = useState(false);

  // Pre-translate UI dictionary on first switch to es
  const ensureUITranslated = useCallback(async (lang: Language) => {
    if (lang === 'en') return;
    const cached = getCache(lang);
    const missingKeys = Object.keys(enTranslations).filter(k => !cached[k]);
    if (missingKeys.length === 0) {
      setEsCache(cached);
      return;
    }
    setIsLoading(true);
    try {
      const items = missingKeys.map(k => ({ key: `ui:${k}`, text: enTranslations[k] }));
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { items, targetLanguage: lang },
      });
      if (error) throw error;
      const next = { ...cached };
      missingKeys.forEach(k => {
        const tx = data?.translations?.[`ui:${k}`];
        if (tx) next[k] = tx;
      });
      setCache(lang, next);
      setEsCache(next);
    } catch (e) {
      console.error('UI translation failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (language === 'es') ensureUITranslated('es');
  }, [language, ensureUITranslated]);

  // Sync language from logged-in user preferences (existing users)
  useEffect(() => {
    const sync = async (userId: string) => {
      const { data } = await supabase
        .from('user_preferences')
        .select('language')
        .eq('user_id', userId)
        .maybeSingle();
      const dbLang = (data?.language === 'es' || data?.language === 'en') ? data.language as Language : null;
      if (dbLang) {
        setLanguageState(dbLang);
        try {
          localStorage.setItem(STORAGE_KEY, dbLang);
        } catch {}
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) sync(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) sync(s.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
    // Persist to user prefs if signed in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('user_preferences').upsert(
          { user_id: session.user.id, language: lang },
          { onConflict: 'user_id' }
        );
      }
    } catch (e) { console.error(e); }
    if (lang === 'es') await ensureUITranslated('es');
  }, [ensureUITranslated]);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    let raw: string;
    if (language === 'es') {
      raw = esCache[key] ?? enTranslations[key] ?? key;
    } else {
      raw = enTranslations[key] ?? key;
    }
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        raw = raw.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return raw;
  }, [language, esCache]);

  const translateMany = useCallback(async (items: { key: string; text: string }[]): Promise<Record<string, string>> => {
    if (language === 'en' || items.length === 0) {
      const out: Record<string, string> = {};
      items.forEach(i => out[i.key] = i.text);
      return out;
    }
    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { items, targetLanguage: language },
      });
      if (error) throw error;
      return data?.translations ?? {};
    } catch (e) {
      console.error('translateMany failed', e);
      const out: Record<string, string> = {};
      items.forEach(i => out[i.key] = i.text);
      return out;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading, translateMany }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
