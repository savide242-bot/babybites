export const isSpanish = (language: string) => language === 'es';

export const tr = (language: string, en: string, es: string) => isSpanish(language) ? es : en;

export const translatePrepTime = (value: string, language: string) => {
  if (!isSpanish(language)) return value;
  return value
    .replace(/minutes?/gi, 'minutos')
    .replace(/hours?/gi, 'horas')
    .replace(/overnight/gi, 'durante la noche')
    .replace(/freezing/gi, 'congelación');
};

export const translateAgeGroup = (value: string, language: string) => {
  if (!isSpanish(language)) return value;
  if (value === 'All Ages') return 'Todas las edades';
  return value.replace(/months/gi, 'meses');
};

const CATEGORY_ES: Record<string, string> = {
  'All Categories': 'Todas las categorías',
  Puree: 'Puré',
  Mash: 'Machacado',
  Soup: 'Sopa',
  'Finger Food': 'Comida para comer con la mano',
  Porridge: 'Papilla',
  Pancakes: 'Panqueques',
  Pasta: 'Pasta',
  Bowl: 'Bowl',
  Bites: 'Bocaditos',
  Smoothie: 'Batido',
};

export const translateCategory = (value: string, language: string) => isSpanish(language) ? (CATEGORY_ES[value] || value) : value;

const DIETARY_ES: Record<string, string> = {
  vegetarian: 'Vegetariano',
  vegan: 'Vegano',
  'gluten-free': 'Sin gluten',
  'dairy-free': 'Sin lácteos',
  'egg-free': 'Sin huevo',
  'nut-free': 'Sin frutos secos',
  'soy-free': 'Sin soja',
};

export const translateDietaryLabel = (value: string | undefined, language: string) => {
  if (!value || !isSpanish(language)) return value || '';
  return DIETARY_ES[value.toLowerCase()] || value;
};