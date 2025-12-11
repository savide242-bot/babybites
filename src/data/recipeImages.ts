// Import all NEW recipe images (HD professional quality)
import avocadoPuree from "@/assets/recipes/avocado-puree-new.jpg";
import sweetPotatoCarrot from "@/assets/recipes/sweet-potato-carrot-new.jpg";
import blueberryOatmeal from "@/assets/recipes/blueberry-oatmeal-new.jpg";
import eggMuffins from "@/assets/recipes/egg-muffins-new.jpg";
import bananaPancakes from "@/assets/recipes/banana-pancakes-new.jpg";
import chickenPatties from "@/assets/recipes/chicken-patties-new.jpg";
import peaPuree from "@/assets/recipes/pea-puree-new.jpg";
import appleSauce from "@/assets/recipes/apple-sauce-new.jpg";
import pastaTomato from "@/assets/recipes/pasta-tomato-new.jpg";
import yogurtBerries from "@/assets/recipes/yogurt-berries-new.jpg";
import quinoaVeggies from "@/assets/recipes/quinoa-veggies-new.jpg";
import broccoliTots from "@/assets/recipes/broccoli-tots-new.jpg";
import salmonSweetPotato from "@/assets/recipes/salmon-sweet-potato-new.jpg";
import riceBanana from "@/assets/recipes/rice-banana-new.jpg";
import lentilSoup from "@/assets/recipes/lentil-soup-new.jpg";
import mangoPuree from "@/assets/recipes/mango-puree-new.jpg";
import beefStew from "@/assets/recipes/beef-stew-new.jpg";
import spinachQuesadilla from "@/assets/recipes/spinach-quesadilla-new.jpg";
import butternutSquash from "@/assets/recipes/butternut-squash-new.jpg";
import turkeyMeatballs from "@/assets/recipes/turkey-meatballs-new.jpg";

// New recipes for 12-18 months
import vegetableRisotto from "@/assets/recipes/vegetable-risotto.jpg";
import miniFishFingers from "@/assets/recipes/mini-fish-fingers.jpg";
import chickpeaCarrotPatties from "@/assets/recipes/chickpea-carrot-patties.jpg";
import creamySpinachPasta from "@/assets/recipes/creamy-spinach-pasta.jpg";
import bananaOatCookies from "@/assets/recipes/banana-oat-cookies.jpg";

// New user-provided recipe images
import spinachAppleSurprise from "@/assets/recipes/spinach-apple-surprise.png";
import pearPruneBlend from "@/assets/recipes/pear-prune-blend.png";
import greenPeaPuree from "@/assets/recipes/green-pea-puree.png";
import pumpkinAppleMash from "@/assets/recipes/pumpkin-apple-mash.png";
import cottageCheesePoachBowl from "@/assets/recipes/cottage-cheese-peach-bowl.png";
import appleCinnamonSauce from "@/assets/recipes/apple-cinnamon-sauce.png";
import appleCinnamonOatmeal from "@/assets/recipes/apple-cinnamon-oatmeal.png";

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
  vegetableRisotto,
  miniFishFingers,
  chickpeaCarrotPatties,
  creamySpinachPasta,
  bananaOatCookies,
  spinachAppleSurprise,
  pearPruneBlend,
  greenPeaPuree,
  pumpkinAppleMash,
  cottageCheesePoachBowl,
  appleCinnamonSauce,
  appleCinnamonOatmeal,
};

// Helper function to get appropriate image based on recipe type
export const getRecipeImage = (keywords: string[]): string => {
  const keywordString = keywords.join(" ").toLowerCase();
  
  // New user-provided recipe images - EXACT MATCHES FIRST
  if (keywordString.includes("spinach") && keywordString.includes("apple") && keywordString.includes("surprise")) return spinachAppleSurprise;
  if (keywordString.includes("pear") && keywordString.includes("prune") && keywordString.includes("blend")) return pearPruneBlend;
  if (keywordString.includes("green") && keywordString.includes("pea") && keywordString.includes("puree")) return greenPeaPuree;
  if (keywordString.includes("pumpkin") && keywordString.includes("apple") && keywordString.includes("mash")) return pumpkinAppleMash;
  if (keywordString.includes("cottage") && keywordString.includes("cheese") && keywordString.includes("peach")) return cottageCheesePoachBowl;
  if (keywordString.includes("apple") && keywordString.includes("cinnamon") && keywordString.includes("sauce")) return appleCinnamonSauce;
  if (keywordString.includes("apple") && keywordString.includes("cinnamon") && keywordString.includes("oatmeal")) return appleCinnamonOatmeal;
  
  // New recipes matching
  if (keywordString.includes("vegetable") && keywordString.includes("risotto")) return vegetableRisotto;
  if (keywordString.includes("fish") && keywordString.includes("fingers")) return miniFishFingers;
  if (keywordString.includes("chickpea") && keywordString.includes("carrot")) return chickpeaCarrotPatties;
  if (keywordString.includes("spinach") && keywordString.includes("pasta")) return creamySpinachPasta;
  if (keywordString.includes("oat") && keywordString.includes("cookies")) return bananaOatCookies;
  
  // More specific matching first
  if (keywordString.includes("avocado") && keywordString.includes("puree")) return avocadoPuree;
  if (keywordString.includes("sweet potato") && keywordString.includes("carrot")) return sweetPotatoCarrot;
  if (keywordString.includes("blueberry") && keywordString.includes("oatmeal")) return blueberryOatmeal;
  if (keywordString.includes("egg") && keywordString.includes("muffin")) return eggMuffins;
  if (keywordString.includes("banana") && keywordString.includes("pancake")) return bananaPancakes;
  if (keywordString.includes("chicken") && (keywordString.includes("patty") || keywordString.includes("patties"))) return chickenPatties;
  if (keywordString.includes("pea") && keywordString.includes("puree")) return peaPuree;
  if (keywordString.includes("apple") && keywordString.includes("sauce")) return appleSauce;
  if (keywordString.includes("pasta") && keywordString.includes("tomato")) return pastaTomato;
  if (keywordString.includes("yogurt") && keywordString.includes("berries")) return yogurtBerries;
  if (keywordString.includes("quinoa") && keywordString.includes("veggie")) return quinoaVeggies;
  if (keywordString.includes("broccoli") && keywordString.includes("tot")) return broccoliTots;
  if (keywordString.includes("salmon") && keywordString.includes("sweet potato")) return salmonSweetPotato;
  if (keywordString.includes("rice") && keywordString.includes("banana")) return riceBanana;
  if (keywordString.includes("lentil") && keywordString.includes("soup")) return lentilSoup;
  if (keywordString.includes("mango") && (keywordString.includes("puree") || keywordString.includes("tropical"))) return mangoPuree;
  if (keywordString.includes("beef") && keywordString.includes("stew")) return beefStew;
  if (keywordString.includes("spinach") && keywordString.includes("quesadilla")) return spinachQuesadilla;
  if (keywordString.includes("butternut") && keywordString.includes("squash")) return butternutSquash;
  if (keywordString.includes("turkey") && keywordString.includes("meatball")) return turkeyMeatballs;
  
  // Single keyword matches
  if (keywordString.includes("risotto")) return vegetableRisotto;
  if (keywordString.includes("avocado")) return avocadoPuree;
  if (keywordString.includes("sweet potato")) return sweetPotatoCarrot;
  if (keywordString.includes("blueberry")) return blueberryOatmeal;
  if (keywordString.includes("egg")) return eggMuffins;
  if (keywordString.includes("banana") && keywordString.includes("cookie")) return bananaOatCookies;
  if (keywordString.includes("banana")) return bananaPancakes;
  if (keywordString.includes("chicken")) return chickenPatties;
  if (keywordString.includes("pea") || keywordString.includes("green")) return peaPuree;
  if (keywordString.includes("apple") || keywordString.includes("pear")) return appleSauce;
  if (keywordString.includes("pasta")) return pastaTomato;
  if (keywordString.includes("yogurt") || keywordString.includes("berry")) return yogurtBerries;
  if (keywordString.includes("quinoa") || keywordString.includes("grain")) return quinoaVeggies;
  if (keywordString.includes("broccoli")) return broccoliTots;
  if (keywordString.includes("salmon") || keywordString.includes("fish")) return salmonSweetPotato;
  if (keywordString.includes("rice") || keywordString.includes("cereal")) return riceBanana;
  if (keywordString.includes("lentil") || keywordString.includes("soup")) return lentilSoup;
  if (keywordString.includes("mango") || keywordString.includes("tropical")) return mangoPuree;
  if (keywordString.includes("beef")) return beefStew;
  if (keywordString.includes("quesadilla") || keywordString.includes("spinach")) return spinachQuesadilla;
  if (keywordString.includes("squash") || keywordString.includes("butternut")) return butternutSquash;
  if (keywordString.includes("turkey") || keywordString.includes("meatball")) return turkeyMeatballs;
  if (keywordString.includes("chickpea") || keywordString.includes("patties")) return chickpeaCarrotPatties;
  if (keywordString.includes("cookie")) return bananaOatCookies;
  
  // Category-based fallbacks
  if (keywordString.includes("puree")) return avocadoPuree;
  if (keywordString.includes("finger food")) return chickenPatties;
  if (keywordString.includes("breakfast")) return bananaPancakes;
  if (keywordString.includes("snack")) return blueberryOatmeal;
  if (keywordString.includes("lunch") || keywordString.includes("dinner")) return chickenPatties;
  
  return sweetPotatoCarrot; // Default image
};
