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

  // Extended common UI strings (used by DOM auto-translate layer for instant swaps)
  'ui.signOut': 'Sign Out',
  'ui.logOut': 'Log Out',
  'ui.signIn': 'Sign In',
  'ui.signUp': 'Sign Up',
  'ui.confirm': 'Confirm',
  'ui.submit': 'Submit',
  'ui.send': 'Send',
  'ui.share': 'Share',
  'ui.retry': 'Retry',
  'ui.refresh': 'Refresh',
  'ui.update': 'Update',
  'ui.create': 'Create',
  'ui.add': 'Add',
  'ui.remove': 'Remove',
  'ui.skip': 'Skip',
  'ui.done': 'Done',
  'ui.start': 'Start',
  'ui.finish': 'Finish',
  'ui.success': 'Success',
  'ui.error': 'Error',
  'ui.warning': 'Warning',
  'ui.info': 'Information',
  'ui.tryAgain': 'Try again',
  'ui.somethingWrong': 'Something went wrong',
  'ui.copied': 'Copied!',
  'ui.copy': 'Copy',
  'ui.areYouSure': 'Are you sure?',
  'ui.thisCantBeUndone': "This action can't be undone.",
  'ui.welcome': 'Welcome',
  'ui.welcomeBack': 'Welcome back',
  'ui.account': 'Account',
  'ui.preferences': 'Preferences',
  'ui.notifications': 'Notifications',
  'ui.privacy': 'Privacy',
  'ui.security': 'Security',
  'ui.help': 'Help',
  'ui.support': 'Support',
  'ui.contact': 'Contact',
  'ui.about': 'About',
  'ui.version': 'Version',
  'ui.upgrade': 'Upgrade',
  'ui.premium': 'Premium',
  'ui.locked': 'Locked',
  'ui.unlocked': 'Unlocked',
  'ui.new': 'New',
  'ui.popular': 'Popular',
  'ui.featured': 'Featured',
  'ui.recommended': 'Recommended',
  'ui.today': 'Today',
  'ui.yesterday': 'Yesterday',
  'ui.tomorrow': 'Tomorrow',
  'ui.thisWeek': 'This week',
  'ui.thisMonth': 'This month',
  'ui.minutes': 'minutes',
  'ui.hours': 'hours',
  'ui.days': 'days',
  'ui.weeks': 'weeks',
  'ui.months': 'months',
  'ui.morning': 'Morning',
  'ui.afternoon': 'Afternoon',
  'ui.evening': 'Evening',
  'ui.night': 'Night',
  'ui.goodMorning': 'Good morning',
  'ui.goodAfternoon': 'Good afternoon',
  'ui.goodEvening': 'Good evening',
  'ui.points': 'points',
  'ui.streak': 'streak',
  'ui.dayStreak': 'day streak',
  'ui.badges': 'Badges',
  'ui.achievements': 'Achievements',
  'ui.level': 'Level',
  'ui.progress': 'Progress',
  'ui.completed': 'Completed',
  'ui.inProgress': 'In progress',
  'ui.pending': 'Pending',
  'ui.viewAll': 'View all',
  'ui.viewMore': 'View more',
  'ui.showLess': 'Show less',
  'ui.seeMore': 'See more',
  'ui.learnMore': 'Learn more',
  'ui.readMore': 'Read more',
  'ui.getStarted': 'Get started',
  'ui.continue': 'Continue',
  'ui.maybeLater': 'Maybe later',
  'ui.notNow': 'Not now',
  'ui.dismiss': 'Dismiss',
  'ui.gotIt': 'Got it',
  'ui.understood': 'Understood',
  'ui.allow': 'Allow',
  'ui.deny': 'Deny',
  'ui.enable': 'Enable',
  'ui.disable': 'Disable',
  'ui.optional': 'Optional',
  'ui.required': 'Required',
  'ui.recipe': 'Recipe',
  'ui.ingredient': 'Ingredient',
  'ui.servings': 'Servings',
  'ui.prepTime': 'Prep time',
  'ui.cookTime': 'Cook time',
  'ui.totalTime': 'Total time',
  'ui.difficulty': 'Difficulty',
  'ui.easy': 'Easy',
  'ui.medium': 'Medium',
  'ui.hard': 'Hard',
  'ui.calories': 'Calories',
  'ui.protein': 'Protein',
  'ui.carbs': 'Carbs',
  'ui.fat': 'Fat',
  'ui.fiber': 'Fiber',
  'ui.baby': 'Baby',
  'ui.mother': 'Mother',
  'ui.age': 'Age',
  'ui.weight': 'Weight',
  'ui.height': 'Height',
  'ui.allergy': 'Allergy',
  'ui.allergies': 'Allergies',
  'ui.dietary': 'Dietary',
  'ui.restrictions': 'Restrictions',
  'ui.vegetarian': 'Vegetarian',
  'ui.vegan': 'Vegan',
  'ui.glutenFree': 'Gluten-free',
  'ui.dairyFree': 'Dairy-free',
  'ui.eggFree': 'Egg-free',
  'ui.nutFree': 'Nut-free',
  'ui.favorites': 'Favorites',
  'ui.favorite': 'Favorite',
  'ui.addToFavorites': 'Add to favorites',
  'ui.removeFromFavorites': 'Remove from favorites',
  'ui.addedToFavorites': 'Added to favorites',
  'ui.removedFromFavorites': 'Removed from favorites',
  'ui.shoppingList': 'Shopping list',
  'ui.addToShoppingList': 'Add to shopping list',
  'ui.mealPlan': 'Meal plan',
  'ui.weeklyPlan': 'Weekly plan',
  'ui.generatePlan': 'Generate plan',
  'ui.regenerate': 'Regenerate',
  'ui.scanFood': 'Scan food',
  'ui.analyzeFood': 'Analyze food',
  'ui.takePhoto': 'Take photo',
  'ui.choosePhoto': 'Choose photo',
  'ui.fromGallery': 'From gallery',
  'ui.fromCamera': 'From camera',
  'ui.uploading': 'Uploading...',
  'ui.analyzing': 'Analyzing...',
  'ui.generating': 'Generating...',
  'ui.processing': 'Processing...',
  'ui.installApp': 'Install app',
  'ui.installNow': 'Install now',
  'ui.appInstalled': 'App installed',
  'ui.networkError': 'Network error. Please check your connection.',
  'ui.offline': 'You are offline',
  'ui.online': 'Back online',
  'ui.password': 'Password',
  'ui.confirmPassword': 'Confirm password',
  'ui.currentPassword': 'Current password',
  'ui.newPassword': 'New password',
  'ui.forgotPassword': 'Forgot password?',
  'ui.resetPassword': 'Reset password',
  'ui.changePassword': 'Change password',
  'ui.passwordChanged': 'Password changed successfully',
  'ui.invalidEmail': 'Invalid email address',
  'ui.passwordTooShort': 'Password is too short',
  'ui.passwordsDontMatch': "Passwords don't match",
  'ui.fieldRequired': 'This field is required',
  'ui.invalidCredentials': 'Invalid email or password',
  'ui.checkEmail': 'Check your email',
  'ui.emailSent': 'Email sent',
  'ui.signOutConfirm': 'Are you sure you want to sign out?',
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

const esFallbackTranslations: Record<string, string> = {
  'common.loading': 'Cargando...',
  'common.back': 'Atrás',
  'common.next': 'Siguiente',
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.continue': 'Continuar',
  'common.close': 'Cerrar',
  'common.yes': 'Sí',
  'common.no': 'No',
  'common.search': 'Buscar',
  'nav.home': 'Inicio',
  'nav.recipes': 'Recetas',
  'nav.planner': 'Plan semanal',
  'nav.growth': 'Crecimiento',
  'nav.scanner': 'Escáner',
  'nav.progressReports': 'Informes de progreso',
  'nav.shoppingList': 'Lista de compras',
  'nav.advice': 'Consejos',
  'nav.bonus': 'Bonos',
  'nav.settings': 'Ajustes',
  'nav.favorites': 'Favoritos',
  'nav.profile': 'Perfil',
  'nav.diary': 'Diario alimentario',
  'nav.achievements': 'Logros',
  'home.hero.title': 'Nutrición saludable para tu bebé',
  'home.hero.subtitle': 'Guía experta, recetas y herramientas de seguimiento para la nutrición de tu pequeño',
  'home.hero.getStarted': 'Comenzar',
  'home.stats.recipes': 'Recetas',
  'home.stats.parents': 'Familias felices',
  'home.stats.experts': 'Consejos expertos',
  'home.floating.ageAppropriate': 'Comidas adecuadas por edad',
  'home.floating.nutritionTracking': 'Seguimiento nutricional',
  'home.features.title': 'Todo lo que necesitas',
  'home.features.recipes': 'Recetas saludables',
  'home.features.recipesDesc': 'Ideas de comidas adecuadas por edad',
  'home.features.growth': 'Seguimiento de crecimiento',
  'home.features.growthDesc': 'Monitorea el desarrollo de tu bebé',
  'home.features.scanner': 'Escáner de alimentos',
  'home.features.scannerDesc': 'Comprueba la seguridad alimentaria al instante',
  'home.features.community': 'Comunidad',
  'home.features.communityDesc': 'Conecta con otras madres',
  'home.cta.title': 'Empieza hoy tu camino',
  'home.cta.subtitle': 'Únete a miles de familias que ofrecen la mejor nutrición a sus bebés',
  'home.cta.button': 'Comenzar ahora',
  'settings.title': 'Ajustes',
  'settings.language': 'Idioma',
  'settings.languageDesc': 'Elige tu idioma preferido',
  'settings.changeLanguage': 'Cambiar idioma',
  'settings.currentLanguage': 'Idioma actual',
  'settings.save': 'Guardar cambios',
  'settings.saving': 'Guardando...',
  'settings.saved': '¡Ajustes guardados correctamente!',
  'language.choose': 'Elige tu idioma',
  'language.chooseDesc': 'Selecciona el idioma que prefieres usar en BabyBites',
  'language.english': 'Inglés',
  'language.spanish': 'Español',
  'language.continue': 'Continuar',
  'language.translating': 'Preparando tu idioma...',
  'auth.signIn': 'Iniciar sesión',
  'auth.signUp': 'Crear cuenta',
  'auth.signUpDescription': 'Crea una cuenta para empezar',
  'auth.signInDescription': '¡Bienvenida de nuevo! Inicia sesión para continuar',
  'auth.email': 'Correo electrónico',
  'auth.password': 'Contraseña',
  'auth.fullName': 'Nombre completo',
  'auth.loading': 'Cargando...',
  'auth.orContinueWith': 'O continúa con',
  'auth.continueWithGoogle': 'Continuar con Google',
  'auth.haveAccount': '¿Ya tienes una cuenta?',
  'auth.noAccount': '¿No tienes una cuenta?',
  'auth.signUpSuccess': '¡Cuenta creada correctamente!',
  'auth.signInSuccess': '¡Sesión iniciada correctamente!',
  'auth.error': 'Ocurrió un error',
  'auth.googleError': 'No se pudo iniciar sesión con Google',
  'recipes.title': 'Biblioteca de recetas',
  'recipes.subtitle': 'Explora recetas aprobadas por pediatras para bebés de 6 a 24 meses',
  'recipes.search': 'Buscar recetas...',
  'recipes.viewRecipe': 'Ver receta',
  'recipes.ingredients': 'Ingredientes',
  'recipes.instructions': 'Instrucciones',
  'recipes.nutrition': 'Información nutricional',
  'recipes.addToPlanner': 'Añadir al plan semanal',
  'recipes.backToRecipes': 'Volver a recetas',
  'recipes.noResults': 'No se encontraron recetas',
  'recipes.clearFilters': 'Limpiar filtros',
  'planner.title': 'Plan semanal de comidas',
  'planner.subtitle': 'Planifica las comidas de tu bebé para la semana',
  'planner.breakfast': 'Desayuno',
  'planner.lunch': 'Almuerzo',
  'planner.dinner': 'Cena',
  'planner.snack': 'Merienda',
  'planner.monday': 'Lunes',
  'planner.tuesday': 'Martes',
  'planner.wednesday': 'Miércoles',
  'planner.thursday': 'Jueves',
  'planner.friday': 'Viernes',
  'planner.saturday': 'Sábado',
  'planner.sunday': 'Domingo',
  'ui.signOut': 'Cerrar sesión',
  'ui.logOut': 'Salir',
  'ui.signIn': 'Iniciar sesión',
  'ui.signUp': 'Crear cuenta',
  'ui.confirm': 'Confirmar',
  'ui.submit': 'Enviar',
  'ui.share': 'Compartir',
  'ui.retry': 'Reintentar',
  'ui.refresh': 'Actualizar',
  'ui.add': 'Añadir',
  'ui.remove': 'Eliminar',
  'ui.done': 'Listo',
  'ui.start': 'Iniciar',
  'ui.finish': 'Finalizar',
  'ui.success': 'Éxito',
  'ui.error': 'Error',
  'ui.tryAgain': 'Inténtalo de nuevo',
  'ui.somethingWrong': 'Algo salió mal',
  'ui.welcome': 'Bienvenida',
  'ui.account': 'Cuenta',
  'ui.preferences': 'Preferencias',
  'ui.notifications': 'Notificaciones',
  'ui.help': 'Ayuda',
  'ui.support': 'Soporte',
  'ui.premium': 'Premium',
  'ui.today': 'Hoy',
  'ui.tomorrow': 'Mañana',
  'ui.minutes': 'minutos',
  'ui.hours': 'horas',
  'ui.days': 'días',
  'ui.weeks': 'semanas',
  'ui.months': 'meses',
  'ui.points': 'puntos',
  'ui.badges': 'Insignias',
  'ui.achievements': 'Logros',
  'ui.progress': 'Progreso',
  'ui.completed': 'Completado',
  'ui.viewAll': 'Ver todo',
  'ui.learnMore': 'Saber más',
  'ui.getStarted': 'Comenzar',
  'ui.continue': 'Continuar',
  'ui.notNow': 'Ahora no',
  'ui.gotIt': 'Entendido',
  'ui.recipe': 'Receta',
  'ui.ingredient': 'Ingrediente',
  'ui.servings': 'Porciones',
  'ui.prepTime': 'Tiempo de preparación',
  'ui.difficulty': 'Dificultad',
  'ui.easy': 'Fácil',
  'ui.medium': 'Media',
  'ui.hard': 'Difícil',
  'ui.calories': 'Calorías',
  'ui.protein': 'Proteína',
  'ui.carbs': 'Carbohidratos',
  'ui.fat': 'Grasa',
  'ui.fiber': 'Fibra',
  'ui.baby': 'Bebé',
  'ui.mother': 'Madre',
  'ui.age': 'Edad',
  'ui.weight': 'Peso',
  'ui.height': 'Altura',
  'ui.allergy': 'Alergia',
  'ui.allergies': 'Alergias',
  'ui.dietary': 'Alimentación',
  'ui.restrictions': 'Restricciones',
  'ui.favorites': 'Favoritos',
  'ui.addToFavorites': 'Añadir a favoritos',
  'ui.removeFromFavorites': 'Quitar de favoritos',
  'ui.shoppingList': 'Lista de compras',
  'ui.addToShoppingList': 'Añadir a la lista de compras',
  'ui.mealPlan': 'Plan de comidas',
  'ui.weeklyPlan': 'Plan semanal',
  'ui.generatePlan': 'Generar plan',
  'ui.scanFood': 'Escanear alimento',
  'ui.analyzeFood': 'Analizar alimento',
  'ui.takePhoto': 'Tomar foto',
  'ui.choosePhoto': 'Elegir foto',
  'ui.uploading': 'Subiendo...',
  'ui.analyzing': 'Analizando...',
  'ui.generating': 'Generando...',
  'ui.processing': 'Procesando...',
  'ui.installApp': 'Instalar app',
  'ui.installNow': 'Instalar ahora',
  'ui.offline': 'Estás sin conexión',
  'ui.online': 'Conectada de nuevo',
  'ui.confirmPassword': 'Confirmar contraseña',
  'ui.forgotPassword': '¿Olvidaste tu contraseña?',
  'ui.resetPassword': 'Restablecer contraseña',
  'ui.changePassword': 'Cambiar contraseña',
  'ui.invalidEmail': 'Correo electrónico inválido',
  'ui.fieldRequired': 'Este campo es obligatorio',
  'ui.invalidCredentials': 'Correo o contraseña inválidos',
};

const seedSourceMap = (translations: Record<string, string>) => {
  try {
    const raw = localStorage.getItem('i18n_source_map_es');
    const sourceMap: Record<string, string> = raw ? JSON.parse(raw) : {};
    Object.keys(enTranslations).forEach(k => {
      const src = enTranslations[k];
      const tx = translations[k] ?? esFallbackTranslations[k];
      if (src && tx) sourceMap[src] = tx;
    });
    localStorage.setItem('i18n_source_map_es', JSON.stringify(sourceMap));
    window.dispatchEvent(new Event('i18n-source-updated'));
  } catch {}
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
    seedSourceMap({ ...esFallbackTranslations, ...cached });
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
      seedSourceMap({ ...esFallbackTranslations, ...next });
      // Also write a source-text → translation map so the DOM AutoTranslateLayer
      // can apply these translations to ANY matching text node anywhere in the app.
      try {
        const sourceMap: Record<string, string> = {};
        Object.keys(next).forEach(k => {
          const src = enTranslations[k];
          if (src && next[k]) sourceMap[src] = next[k];
        });
        localStorage.setItem('i18n_source_map_es', JSON.stringify(sourceMap));
        window.dispatchEvent(new Event('i18n-source-updated'));
      } catch {}
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
      raw = esCache[key] ?? esFallbackTranslations[key] ?? enTranslations[key] ?? key;
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
