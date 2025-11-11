import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<string, string> = {
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
  
  // Header
  'nav.home': 'Home',
  'nav.recipes': 'Recipes',
  'nav.planner': 'Meal Planner',
  'nav.growth': 'Growth',
  'nav.scanner': 'Scanner',
  'nav.progressReports': 'Progress Reports',
  'nav.shoppingList': 'Shopping List',
  'nav.community': 'Community',
  'nav.advice': 'Advice',
  'nav.chat': 'Chat',
  'nav.settings': 'Settings',
  
  // Progress Reports
  'progressReports.title': 'Progress Reports',
  'progressReports.subtitle': 'Track your baby\'s nutritional evolution and growth',
  'progressReports.exportPDF': 'Export PDF',
  'progressReports.share': 'Share',
  'progressReports.growthEvolution': 'Growth Evolution',
  'progressReports.nutritionalDistribution': 'Nutritional Distribution (Last 30 days)',
  'progressReports.currentWeight': 'Current Weight',
  'progressReports.currentHeight': 'Current Height',
  'progressReports.mealsThisMonth': 'Meals This Month',
  'progressReports.noData': 'No Data Available',
  'progressReports.noDataDescription': 'Start tracking your baby\'s growth and meals to see detailed reports',
  'progressReports.addData': 'Add Data',
  'progressReports.weightKg': 'Weight (kg)',
  'progressReports.heightCm': 'Height (cm)',
  'progressReports.mealCount': 'Number of meals',
  'progressReports.reportExported': 'Report Exported',
  'progressReports.reportExportedDesc': 'The report was successfully exported to PDF format!',
  'progressReports.shareReport': 'Share Report',
  'progressReports.shareReportDesc': 'You can share this report with your pediatrician or nutritionist',
  'progressReports.insightWeightGain': 'Excellent progress! Baby gained {weight}kg since last record',
  'progressReports.insightMealsWeek': '{count} meals recorded this week - great consistency!',
  'progressReports.insightVeggies': 'Fantastic! {percentage}% of meals include vegetables',
  'progressReports.insightProtein': 'Excellent average protein intake: {amount}g per meal',
  'progressReports.insightVariety': 'Great variety! {count} different recipes this month',
  'progressReports.insightDefault1': 'Keep logging meals to generate personalized insights!',
  'progressReports.insightDefault2': 'Track your baby\'s growth regularly for better results',
  
  // Shopping List
  'shoppingList.title': 'Smart Shopping List',
  'shoppingList.subtitle': 'Automatically generated based on your weekly planner',
  'shoppingList.progress': 'Shopping Progress',
  'shoppingList.exportPDF': 'Export PDF',
  'shoppingList.shareWhatsApp': 'Share WhatsApp',
  'shoppingList.emptyList': 'Empty List',
  'shoppingList.emptyListDesc': 'Add recipes to your weekly planner to automatically generate the shopping list',
  'shoppingList.goToPlanner': 'Go to Planner',
  'shoppingList.from': 'From:',
  'shoppingList.substitute': 'Substitute',
  'shoppingList.tipsTitle': 'Shopping Tips',
  'shoppingList.tip1': 'Buy organic products whenever possible for babies',
  'shoppingList.tip2': 'Always check expiration dates',
  'shoppingList.tip3': 'Prefer seasonal fruits and vegetables',
  'shoppingList.tip4': 'Use the \'Substitute\' function for healthier alternatives',
  'shoppingList.tip5': 'Freeze extra portions to save time',
  'shoppingList.listExported': 'List Exported',
  'shoppingList.listExportedDesc': 'The shopping list was successfully exported to PDF format!',
  'shoppingList.substitutions': 'Suggested Substitutions',
  'shoppingList.substitutionsFor': 'For {ingredient}: {subs}',
  'shoppingList.noSubstitutions': 'No Substitutions',
  'shoppingList.noSubstitutionsDesc': 'No common substitutions found for this ingredient',
  'shoppingList.categories.vegetables': 'Vegetables',
  'shoppingList.categories.fruits': 'Fruits',
  'shoppingList.categories.proteins': 'Proteins',
  'shoppingList.categories.cereals': 'Cereals',
  'shoppingList.categories.dairy': 'Dairy',
  'shoppingList.categories.others': 'Others',
  
  // Settings
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.changeLanguage': 'Change Language',
  'settings.currentLanguage': 'Current Language',
  'settings.save': 'Save Changes',
  'settings.saving': 'Saving...',
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
  
  // Recipes
  'recipes.title': 'Recipe Library',
  'recipes.subtitle': 'Browse our collection of pediatrician-approved recipes designed for babies aged 6-24 months',
  'recipes.search': 'Search recipes...',
  'recipes.selectAge': 'Select age group',
  'recipes.selectCategory': 'Select category',
  'recipes.showing': 'Showing',
  'recipes.recipe': 'recipe',
  'recipes.recipes': 'recipes',
  'recipes.viewRecipe': 'View Recipe',
  'recipes.noResults': 'No recipes found',
  'recipes.noResultsDesc': 'Try adjusting your filters or search query',
  'recipes.clearFilters': 'Clear Filters',
  'recipes.backToRecipes': 'Back to Recipes',
  'recipes.recipeNotFound': 'Recipe not found',
  'recipes.addToPlanner': 'Add to Meal Planner',
  'recipes.ingredients': 'Ingredients',
  'recipes.instructions': 'Instructions',
  'recipes.nutrition': 'Nutrition Information',
  'recipes.calories': 'Calories',
  'recipes.protein': 'Protein',
  'recipes.carbs': 'Carbs',
  'recipes.fat': 'Fat',
  'recipes.fiber': 'Fiber',
  'recipes.vitamins': 'Key Vitamins & Minerals',
  'recipes.allergens': 'Allergen Information',
  'recipes.allergensDesc': 'This recipe contains the following common allergens:',
  'recipes.storage': 'Storage Tips',
  'recipes.addedToPlanner': 'Added to meal planner!',
  'recipes.addedToPlannerDesc': 'has been added to your meal planner.',
  'recipes.healthBenefits': 'Health Benefits',
  'recipes.servingGuidance': 'Serving Recommendations',
  
  // Scanner
  'scanner.title': 'Barcode Scanner',
  'scanner.subtitle': 'Scan products to check if they\'re safe for your baby',
  'scanner.barcode': 'Product Barcode',
  'scanner.enterBarcode': 'Enter barcode number',
  'scanner.scan': 'Scan',
  'scanner.scanning': 'Scanning...',
  'scanner.useCamera': 'Use Camera to Scan',
  'scanner.cameraDesc': 'Point your camera at the barcode',
  'scanner.cameraScanning': 'Camera Scanning',
  'scanner.positionBarcode': 'Position the barcode within the highlighted area',
  'scanner.safe': 'Safe for Babies',
  'scanner.caution': 'Use with Caution',
  'scanner.safetyInfo': 'Safety Information',
  'scanner.suggested': 'Suggested Recipes',
  'scanner.howItWorks': 'How it works',
  'scanner.step1': 'Enter or scan the barcode of any grocery product',
  'scanner.step2': 'Our system checks the ingredients against baby safety guidelines',
  'scanner.step3': 'Get instant feedback on safety and allergen information',
  'scanner.step4': 'Discover recipes that use safe ingredients',
  'scanner.missingBarcode': 'Missing barcode',
  'scanner.enterBarcodeError': 'Please enter a barcode',
  'scanner.cameraError': 'Camera Error',
  'scanner.cameraErrorDesc': 'Could not access camera. Please check permissions.',
  
  // Community
  'community.title': 'Parent Community',
  'community.subtitle': 'Share experiences, ask questions, and connect with other parents',
  'community.newPost': 'New Post',
  'community.createPost': 'Create New Post',
  'community.postTitle': 'Post title...',
  'community.postContent': 'Share your thoughts, questions, or experiences...',
  'community.post': 'Post',
  'community.cancel': 'Cancel',
  'community.anonymous': 'Anonymous',
  'community.verifiedPediatrician': 'Verified Pediatrician',
  'community.signInRequired': 'Sign in required',
  'community.signInToPost': 'Please sign in to create posts',
  'community.signInToLike': 'Please sign in to like posts',
  'community.validationError': 'Validation Error',
  'community.error': 'Error',
  'community.postError': 'Failed to create post',
  'community.success': 'Success',
  'community.postSuccess': 'Post created successfully!',
  'community.signInToComment': 'Please sign in to comment on posts',
  'community.addComment': 'Add a comment...',
  
  // Advice
  'advice.title': 'Parents\' Advice Hub',
  'advice.subtitle': 'Expert guidance from pediatricians and nutritionists to support your baby\'s feeding journey',
  'advice.disclaimer': 'Medical Disclaimer:',
  'advice.disclaimerText': 'The information provided in this advice hub is for educational purposes only and should not replace professional medical advice. Always consult with your pediatrician or healthcare provider before making decisions about your baby\'s nutrition and health.',
  
  // Chat
  'chat.title': 'Chat with Bibi',
  'chat.subtitle': 'Your warm and intelligent baby nutrition assistant',
  'chat.welcome': 'Hey Mom! 👋 I\'m Bibi, your baby nutrition assistant! I\'m here to help you with recipes, meal planning, parenting advice, and everything about feeding your little one. What can I help you with today?',
  'chat.placeholder': 'Ask me about recipes, nutrition, parenting advice...',
  'chat.tryAsking': '💡 Try asking: "What\'s a good breakfast for my 8-month-old?" or "My baby won\'t eat vegetables"',
  'chat.signInRequired': 'Sign in required',
  'chat.signInToChat': 'Please sign in to chat with Bibi',
  'chat.error': 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment!',
  'chat.notAuthenticated': 'Please sign in to continue chatting.',
  
  // Install PWA
  'install.title': 'Install BabyBites',
  'install.description': 'Get the best experience with our mobile app',
  'install.nativeExperience': 'Native App Experience',
  'install.nativeExperienceDesc': 'Full-screen mode with smooth transitions and mobile-optimized interface',
  'install.offlineAccess': 'Offline Access',
  'install.offlineAccessDesc': 'Access recipes and key features even without internet connection',
  'install.fastLoading': 'Lightning Fast',
  'install.fastLoadingDesc': 'Instant loading with smart caching for better performance',
  'install.installNow': 'Install Now',
  'install.manualInstall': 'Manual Installation',
  'install.iosInstructions': 'Tap the Share button in Safari, then tap \'Add to Home Screen\'',
  'install.androidInstructions': 'Tap the menu (three dots) in your browser, then tap \'Install app\' or \'Add to Home screen\'',

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
  'auth.noAccount': 'Don\'t have an account?',
  'auth.signUpSuccess': 'Account created successfully!',
  'auth.signInSuccess': 'Signed in successfully!',
  'auth.error': 'An error occurred',
  'auth.googleError': 'Failed to sign in with Google',
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language] = useState<Language>('en');
  const [isLoading] = useState(false);

  const setLanguage = async () => {
    // App is English-only, no-op
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
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
