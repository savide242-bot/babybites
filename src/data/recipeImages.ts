// Import all recipe images
import avocadoPuree from "@/assets/recipes/avocado-puree.jpg";
import sweetPotatoCarrot from "@/assets/recipes/sweet-potato-carrot.jpg";
import blueberryOatmeal from "@/assets/recipes/blueberry-oatmeal.jpg";
import eggMuffins from "@/assets/recipes/egg-muffins.jpg";
import bananaPancakes from "@/assets/recipes/banana-pancakes.jpg";
import chickenPatties from "@/assets/recipes/chicken-patties.jpg";
import peaPuree from "@/assets/recipes/pea-puree.jpg";
import appleSauce from "@/assets/recipes/apple-sauce.jpg";
import pastaTomato from "@/assets/recipes/pasta-tomato.jpg";
import yogurtBerries from "@/assets/recipes/yogurt-berries.jpg";
import quinoaVeggies from "@/assets/recipes/quinoa-veggies.jpg";
import broccoliTots from "@/assets/recipes/broccoli-tots.jpg";
import salmonSweetPotato from "@/assets/recipes/salmon-sweet-potato.jpg";
import riceBanana from "@/assets/recipes/rice-banana.jpg";
import lentilSoup from "@/assets/recipes/lentil-soup.jpg";
import mangoPuree from "@/assets/recipes/mango-puree.jpg";
import beefStew from "@/assets/recipes/beef-stew.jpg";
import spinachQuesadilla from "@/assets/recipes/spinach-quesadilla.jpg";
import butternutSquash from "@/assets/recipes/butternut-squash.jpg";
import turkeyMeatballs from "@/assets/recipes/turkey-meatballs.jpg";

export const recipeImages = {
  avocadoPuree,
  sweetPotatoCarrot,
  blueberryOatmeal,
  eggMuffins,
  bananaPancakes,
  chickenPatties,
  peaPuree,
  appleSauce,
  pastaTomato,
  yogurtBerries,
  quinoaVeggies,
  broccoliTots,
  salmonSweetPotato,
  riceBanana,
  lentilSoup,
  mangoPuree,
  beefStew,
  spinachQuesadilla,
  butternutSquash,
  turkeyMeatballs,
};

// Helper function to get appropriate image based on recipe type
export const getRecipeImage = (keywords: string[]): string => {
  const keywordString = keywords.join(" ").toLowerCase();
  
  if (keywordString.includes("avocado")) return avocadoPuree;
  if (keywordString.includes("sweet potato") || keywordString.includes("carrot")) return sweetPotatoCarrot;
  if (keywordString.includes("blueberry") || keywordString.includes("oatmeal")) return blueberryOatmeal;
  if (keywordString.includes("egg") || keywordString.includes("muffin")) return eggMuffins;
  if (keywordString.includes("pancake") || keywordString.includes("banana")) return bananaPancakes;
  if (keywordString.includes("chicken") || keywordString.includes("patty")) return chickenPatties;
  if (keywordString.includes("pea") || keywordString.includes("green")) return peaPuree;
  if (keywordString.includes("apple") || keywordString.includes("pear")) return appleSauce;
  if (keywordString.includes("pasta") || keywordString.includes("tomato")) return pastaTomato;
  if (keywordString.includes("yogurt") || keywordString.includes("berry")) return yogurtBerries;
  if (keywordString.includes("quinoa") || keywordString.includes("grain")) return quinoaVeggies;
  if (keywordString.includes("broccoli") || keywordString.includes("tot")) return broccoliTots;
  if (keywordString.includes("salmon") || keywordString.includes("fish")) return salmonSweetPotato;
  if (keywordString.includes("rice") || keywordString.includes("cereal")) return riceBanana;
  if (keywordString.includes("lentil") || keywordString.includes("soup")) return lentilSoup;
  if (keywordString.includes("mango") || keywordString.includes("tropical")) return mangoPuree;
  if (keywordString.includes("beef") || keywordString.includes("stew")) return beefStew;
  if (keywordString.includes("quesadilla") || keywordString.includes("spinach")) return spinachQuesadilla;
  if (keywordString.includes("squash") || keywordString.includes("butternut")) return butternutSquash;
  if (keywordString.includes("turkey") || keywordString.includes("meatball")) return turkeyMeatballs;
  
  // Default fallbacks based on category
  if (keywordString.includes("puree")) return avocadoPuree;
  if (keywordString.includes("finger food")) return chickenPatties;
  if (keywordString.includes("breakfast")) return bananaPancakes;
  if (keywordString.includes("snack")) return blueberryOatmeal;
  
  return sweetPotatoCarrot; // Default image
};
