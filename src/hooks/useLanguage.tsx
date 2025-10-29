import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Language = 'en' | 'fr' | 'es' | 'de' | 'pt';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Home
    'home.hero.title': 'Healthy Nutrition for Your Baby',
    'home.hero.subtitle': 'Expert guidance, recipes, and tracking tools for your little one\'s nutrition journey',
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
    'home.features.growthDesc': 'Monitor your baby\'s development',
    'home.features.scanner': 'Food Scanner',
    'home.features.scannerDesc': 'Check food safety instantly',
    'home.features.community': 'Community',
    'home.features.communityDesc': 'Connect with other parents',
    'home.cta.title': 'Start Your Journey Today',
    'home.cta.subtitle': 'Join thousands of parents providing the best nutrition for their babies',
    'home.cta.button': 'Get Started Now',
    
    // Language Selector
    'language.title': 'Choose Your Language',
    'language.subtitle': 'Select your preferred language to continue',
    'language.continue': 'Continue',
    'language.en': 'English',
    'language.fr': 'French',
    'language.es': 'Spanish',
    'language.de': 'German',
    'language.pt': 'Portuguese',
    
    // Header
    'nav.home': 'Home',
    'nav.recipes': 'Recipes',
    'nav.planner': 'Meal Planner',
    'nav.growth': 'Growth',
    'nav.scanner': 'Scanner',
    'nav.community': 'Community',
    'nav.advice': 'Advice',
    'nav.chat': 'Chat',
    'nav.settings': 'Settings',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.changeLanguage': 'Change Language',
    'settings.currentLanguage': 'Current Language',
    'settings.save': 'Save Changes',
    'settings.saved': 'Settings saved successfully!',
    
    // Meal Planner
    'planner.title': 'Weekly Meal Planner',
    'planner.subtitle': 'Plan your baby\'s meals for the week',
    'planner.suggestions': 'AI Suggestions',
    'planner.custom': 'Custom Plan',
    'planner.generateSuggestions': 'Generate 7-Day Plan',
    'planner.breakfast': 'Breakfast',
    'planner.lunch': 'Lunch',
    'planner.dinner': 'Dinner',
    'planner.snack': 'Snack',
    'planner.addMeal': 'Add meal',
    'planner.monday': 'Monday',
    'planner.tuesday': 'Tuesday',
    'planner.wednesday': 'Wednesday',
    'planner.thursday': 'Thursday',
    'planner.friday': 'Friday',
    'planner.saturday': 'Saturday',
    'planner.sunday': 'Sunday',
    
    // Growth Tracker
    'growth.title': 'Growth Tracker',
    'growth.babyName': 'Baby Name',
    'growth.weight': 'Weight (kg)',
    'growth.height': 'Height (cm)',
    'growth.milestone': 'Milestone',
    'growth.notes': 'Notes',
    'growth.addRecord': 'Add Growth Record',
    'growth.mealType': 'Meal Type',
    'growth.recipeTitle': 'Recipe',
    'growth.calories': 'Calories',
    'growth.addMeal': 'Add Meal Log',
    'growth.chart': 'Growth Chart',
  },
  fr: {
    // Home
    'home.hero.title': 'Nutrition Saine pour Votre Bébé',
    'home.hero.subtitle': 'Conseils d\'experts, recettes et outils de suivi pour le parcours nutritionnel de votre petit',
    'home.hero.getStarted': 'Commencer',
    'home.stats.recipes': 'Recettes',
    'home.stats.parents': 'Parents Heureux',
    'home.stats.experts': 'Conseils d\'Experts',
    'home.floating.ageAppropriate': 'Repas Adaptés à l\'Âge',
    'home.floating.nutritionTracking': 'Suivi Nutritionnel',
    'home.features.title': 'Tout ce dont Vous Avez Besoin',
    'home.features.recipes': 'Recettes Saines',
    'home.features.recipesDesc': 'Idées de repas adaptées à l\'âge',
    'home.features.growth': 'Suivi de Croissance',
    'home.features.growthDesc': 'Surveillez le développement de votre bébé',
    'home.features.scanner': 'Scanner Alimentaire',
    'home.features.scannerDesc': 'Vérifiez la sécurité alimentaire instantanément',
    'home.features.community': 'Communauté',
    'home.features.communityDesc': 'Connectez-vous avec d\'autres parents',
    'home.cta.title': 'Commencez Votre Voyage Aujourd\'hui',
    'home.cta.subtitle': 'Rejoignez des milliers de parents offrant la meilleure nutrition à leurs bébés',
    'home.cta.button': 'Commencer Maintenant',
    
    'language.title': 'Choisissez Votre Langue',
    'language.subtitle': 'Sélectionnez votre langue préférée pour continuer',
    'language.continue': 'Continuer',
    'language.en': 'Anglais',
    'language.fr': 'Français',
    'language.es': 'Espagnol',
    'language.de': 'Allemand',
    'language.pt': 'Portugais',
    
    'nav.home': 'Accueil',
    'nav.recipes': 'Recettes',
    'nav.planner': 'Planificateur',
    'nav.growth': 'Croissance',
    'nav.scanner': 'Scanner',
    'nav.community': 'Communauté',
    'nav.advice': 'Conseils',
    'nav.chat': 'Chat',
    'nav.settings': 'Paramètres',
    
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.changeLanguage': 'Changer de Langue',
    'settings.currentLanguage': 'Langue Actuelle',
    'settings.save': 'Enregistrer',
    'settings.saved': 'Paramètres enregistrés avec succès!',
    
    'planner.title': 'Planificateur de Repas Hebdomadaire',
    'planner.subtitle': 'Planifiez les repas de votre bébé pour la semaine',
    'planner.suggestions': 'Suggestions IA',
    'planner.custom': 'Plan Personnalisé',
    'planner.generateSuggestions': 'Générer un Plan de 7 Jours',
    'planner.breakfast': 'Petit-déjeuner',
    'planner.lunch': 'Déjeuner',
    'planner.dinner': 'Dîner',
    'planner.snack': 'Collation',
    'planner.addMeal': 'Ajouter un repas',
    'planner.monday': 'Lundi',
    'planner.tuesday': 'Mardi',
    'planner.wednesday': 'Mercredi',
    'planner.thursday': 'Jeudi',
    'planner.friday': 'Vendredi',
    'planner.saturday': 'Samedi',
    'planner.sunday': 'Dimanche',
    
    'growth.title': 'Suivi de Croissance',
    'growth.babyName': 'Nom du Bébé',
    'growth.weight': 'Poids (kg)',
    'growth.height': 'Taille (cm)',
    'growth.milestone': 'Étape',
    'growth.notes': 'Notes',
    'growth.addRecord': 'Ajouter un Enregistrement',
    'growth.mealType': 'Type de Repas',
    'growth.recipeTitle': 'Recette',
    'growth.calories': 'Calories',
    'growth.addMeal': 'Ajouter un Repas',
    'growth.chart': 'Graphique de Croissance',
  },
  es: {
    'home.hero.title': 'Nutrición Saludable para Tu Bebé',
    'home.hero.subtitle': 'Orientación experta, recetas y herramientas de seguimiento para el viaje nutricional de tu pequeño',
    'home.hero.getStarted': 'Comenzar',
    'home.stats.recipes': 'Recetas',
    'home.stats.parents': 'Padres Felices',
    'home.stats.experts': 'Consejos de Expertos',
    'home.floating.ageAppropriate': 'Comidas Apropiadas para la Edad',
    'home.floating.nutritionTracking': 'Seguimiento Nutricional',
    'home.features.title': 'Todo lo que Necesitas',
    'home.features.recipes': 'Recetas Saludables',
    'home.features.recipesDesc': 'Ideas de comidas apropiadas para la edad',
    'home.features.growth': 'Seguimiento de Crecimiento',
    'home.features.growthDesc': 'Monitorea el desarrollo de tu bebé',
    'home.features.scanner': 'Escáner de Alimentos',
    'home.features.scannerDesc': 'Verifica la seguridad alimentaria al instante',
    'home.features.community': 'Comunidad',
    'home.features.communityDesc': 'Conéctate con otros padres',
    'home.cta.title': 'Comienza Tu Viaje Hoy',
    'home.cta.subtitle': 'Únete a miles de padres que brindan la mejor nutrición a sus bebés',
    'home.cta.button': 'Comenzar Ahora',
    
    'language.title': 'Elige Tu Idioma',
    'language.subtitle': 'Selecciona tu idioma preferido para continuar',
    'language.continue': 'Continuar',
    'language.en': 'Inglés',
    'language.fr': 'Francés',
    'language.es': 'Español',
    'language.de': 'Alemán',
    'language.pt': 'Portugués',
    
    'nav.home': 'Inicio',
    'nav.recipes': 'Recetas',
    'nav.planner': 'Planificador',
    'nav.growth': 'Crecimiento',
    'nav.scanner': 'Escáner',
    'nav.community': 'Comunidad',
    'nav.advice': 'Consejos',
    'nav.chat': 'Chat',
    'nav.settings': 'Configuración',
    
    'settings.title': 'Configuración',
    'settings.language': 'Idioma',
    'settings.changeLanguage': 'Cambiar Idioma',
    'settings.currentLanguage': 'Idioma Actual',
    'settings.save': 'Guardar Cambios',
    'settings.saved': '¡Configuración guardada con éxito!',
    
    'planner.title': 'Planificador de Comidas Semanal',
    'planner.subtitle': 'Planifica las comidas de tu bebé para la semana',
    'planner.suggestions': 'Sugerencias IA',
    'planner.custom': 'Plan Personalizado',
    'planner.generateSuggestions': 'Generar Plan de 7 Días',
    'planner.breakfast': 'Desayuno',
    'planner.lunch': 'Almuerzo',
    'planner.dinner': 'Cena',
    'planner.snack': 'Merienda',
    'planner.addMeal': 'Agregar comida',
    'planner.monday': 'Lunes',
    'planner.tuesday': 'Martes',
    'planner.wednesday': 'Miércoles',
    'planner.thursday': 'Jueves',
    'planner.friday': 'Viernes',
    'planner.saturday': 'Sábado',
    'planner.sunday': 'Domingo',
    
    'growth.title': 'Seguimiento de Crecimiento',
    'growth.babyName': 'Nombre del Bebé',
    'growth.weight': 'Peso (kg)',
    'growth.height': 'Altura (cm)',
    'growth.milestone': 'Hito',
    'growth.notes': 'Notas',
    'growth.addRecord': 'Agregar Registro',
    'growth.mealType': 'Tipo de Comida',
    'growth.recipeTitle': 'Receta',
    'growth.calories': 'Calorías',
    'growth.addMeal': 'Agregar Registro de Comida',
    'growth.chart': 'Gráfico de Crecimiento',
  },
  de: {
    'home.hero.title': 'Gesunde Ernährung für Ihr Baby',
    'home.hero.subtitle': 'Expertenberatung, Rezepte und Tracking-Tools für die Ernährungsreise Ihres Kleinen',
    'home.hero.getStarted': 'Loslegen',
    'home.stats.recipes': 'Rezepte',
    'home.stats.parents': 'Glückliche Eltern',
    'home.stats.experts': 'Experten-Tipps',
    'home.floating.ageAppropriate': 'Altersgerechte Mahlzeiten',
    'home.floating.nutritionTracking': 'Ernährungs-Tracking',
    'home.features.title': 'Alles, was Sie Brauchen',
    'home.features.recipes': 'Gesunde Rezepte',
    'home.features.recipesDesc': 'Altersgerechte Mahlzeiten-Ideen',
    'home.features.growth': 'Wachstums-Tracker',
    'home.features.growthDesc': 'Überwachen Sie die Entwicklung Ihres Babys',
    'home.features.scanner': 'Lebensmittel-Scanner',
    'home.features.scannerDesc': 'Überprüfen Sie die Lebensmittelsicherheit sofort',
    'home.features.community': 'Gemeinschaft',
    'home.features.communityDesc': 'Verbinden Sie sich mit anderen Eltern',
    'home.cta.title': 'Starten Sie Ihre Reise Heute',
    'home.cta.subtitle': 'Schließen Sie sich Tausenden von Eltern an, die ihren Babys die beste Ernährung bieten',
    'home.cta.button': 'Jetzt Loslegen',
    
    'language.title': 'Wählen Sie Ihre Sprache',
    'language.subtitle': 'Wählen Sie Ihre bevorzugte Sprache, um fortzufahren',
    'language.continue': 'Weiter',
    'language.en': 'Englisch',
    'language.fr': 'Französisch',
    'language.es': 'Spanisch',
    'language.de': 'Deutsch',
    'language.pt': 'Portugiesisch',
    
    'nav.home': 'Startseite',
    'nav.recipes': 'Rezepte',
    'nav.planner': 'Essensplaner',
    'nav.growth': 'Wachstum',
    'nav.scanner': 'Scanner',
    'nav.community': 'Gemeinschaft',
    'nav.advice': 'Ratschläge',
    'nav.chat': 'Chat',
    'nav.settings': 'Einstellungen',
    
    'settings.title': 'Einstellungen',
    'settings.language': 'Sprache',
    'settings.changeLanguage': 'Sprache Ändern',
    'settings.currentLanguage': 'Aktuelle Sprache',
    'settings.save': 'Änderungen Speichern',
    'settings.saved': 'Einstellungen erfolgreich gespeichert!',
    
    'planner.title': 'Wöchentlicher Essensplaner',
    'planner.subtitle': 'Planen Sie die Mahlzeiten Ihres Babys für die Woche',
    'planner.suggestions': 'KI-Vorschläge',
    'planner.custom': 'Benutzerdefinierter Plan',
    'planner.generateSuggestions': '7-Tage-Plan Generieren',
    'planner.breakfast': 'Frühstück',
    'planner.lunch': 'Mittagessen',
    'planner.dinner': 'Abendessen',
    'planner.snack': 'Snack',
    'planner.addMeal': 'Mahlzeit hinzufügen',
    'planner.monday': 'Montag',
    'planner.tuesday': 'Dienstag',
    'planner.wednesday': 'Mittwoch',
    'planner.thursday': 'Donnerstag',
    'planner.friday': 'Freitag',
    'planner.saturday': 'Samstag',
    'planner.sunday': 'Sonntag',
    
    'growth.title': 'Wachstums-Tracker',
    'growth.babyName': 'Name des Babys',
    'growth.weight': 'Gewicht (kg)',
    'growth.height': 'Größe (cm)',
    'growth.milestone': 'Meilenstein',
    'growth.notes': 'Notizen',
    'growth.addRecord': 'Datensatz Hinzufügen',
    'growth.mealType': 'Mahlzeitentyp',
    'growth.recipeTitle': 'Rezept',
    'growth.calories': 'Kalorien',
    'growth.addMeal': 'Mahlzeit Hinzufügen',
    'growth.chart': 'Wachstumsdiagramm',
  },
  pt: {
    'home.hero.title': 'Nutrição Saudável para o Seu Bebé',
    'home.hero.subtitle': 'Orientação especializada, receitas e ferramentas de acompanhamento para a jornada nutricional do seu pequeno',
    'home.hero.getStarted': 'Começar',
    'home.stats.recipes': 'Receitas',
    'home.stats.parents': 'Pais Felizes',
    'home.stats.experts': 'Dicas de Especialistas',
    'home.floating.ageAppropriate': 'Refeições Adequadas à Idade',
    'home.floating.nutritionTracking': 'Acompanhamento Nutricional',
    'home.features.title': 'Tudo o que Você Precisa',
    'home.features.recipes': 'Receitas Saudáveis',
    'home.features.recipesDesc': 'Ideias de refeições adequadas à idade',
    'home.features.growth': 'Monitor de Crescimento',
    'home.features.growthDesc': 'Acompanhe o desenvolvimento do seu bebé',
    'home.features.scanner': 'Scanner de Alimentos',
    'home.features.scannerDesc': 'Verifique a segurança alimentar instantaneamente',
    'home.features.community': 'Comunidade',
    'home.features.communityDesc': 'Conecte-se com outros pais',
    'home.cta.title': 'Comece Sua Jornada Hoje',
    'home.cta.subtitle': 'Junte-se a milhares de pais que fornecem a melhor nutrição para seus bebés',
    'home.cta.button': 'Começar Agora',
    
    'language.title': 'Escolha o Seu Idioma',
    'language.subtitle': 'Selecione o seu idioma preferido para continuar',
    'language.continue': 'Continuar',
    'language.en': 'Inglês',
    'language.fr': 'Francês',
    'language.es': 'Espanhol',
    'language.de': 'Alemão',
    'language.pt': 'Português',
    
    'nav.home': 'Início',
    'nav.recipes': 'Receitas',
    'nav.planner': 'Planeador',
    'nav.growth': 'Crescimento',
    'nav.scanner': 'Scanner',
    'nav.community': 'Comunidade',
    'nav.advice': 'Conselhos',
    'nav.chat': 'Chat',
    'nav.settings': 'Configurações',
    
    'settings.title': 'Configurações',
    'settings.language': 'Idioma',
    'settings.changeLanguage': 'Mudar Idioma',
    'settings.currentLanguage': 'Idioma Atual',
    'settings.save': 'Guardar Alterações',
    'settings.saved': 'Configurações guardadas com sucesso!',
    
    'planner.title': 'Planeador de Refeições Semanal',
    'planner.subtitle': 'Planeie as refeições do seu bebé para a semana',
    'planner.suggestions': 'Sugestões IA',
    'planner.custom': 'Plano Personalizado',
    'planner.generateSuggestions': 'Gerar Plano de 7 Dias',
    'planner.breakfast': 'Pequeno-almoço',
    'planner.lunch': 'Almoço',
    'planner.dinner': 'Jantar',
    'planner.snack': 'Lanche',
    'planner.addMeal': 'Adicionar refeição',
    'planner.monday': 'Segunda-feira',
    'planner.tuesday': 'Terça-feira',
    'planner.wednesday': 'Quarta-feira',
    'planner.thursday': 'Quinta-feira',
    'planner.friday': 'Sexta-feira',
    'planner.saturday': 'Sábado',
    'planner.sunday': 'Domingo',
    
    'growth.title': 'Monitor de Crescimento',
    'growth.babyName': 'Nome do Bebé',
    'growth.weight': 'Peso (kg)',
    'growth.height': 'Altura (cm)',
    'growth.milestone': 'Marco',
    'growth.notes': 'Notas',
    'growth.addRecord': 'Adicionar Registo',
    'growth.mealType': 'Tipo de Refeição',
    'growth.recipeTitle': 'Receita',
    'growth.calories': 'Calorias',
    'growth.addMeal': 'Adicionar Registo de Refeição',
    'growth.chart': 'Gráfico de Crescimento',
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        
        if (data.session) {
          await loadUserPreferences(data.session.user.id);
        }
      } else {
        await loadUserPreferences(session.user.id);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('language')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.language) {
        setLanguageState(data.language as Language);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          language: lang,
        });

      if (error) throw error;
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
