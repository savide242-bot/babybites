import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, Baby, Moon, Utensils, AlertCircle, Sparkles,
  Droplets, Scale, BookOpen, Apple, Brain, ShieldCheck,
  Clock, Leaf, HandHeart, Stethoscope
} from "lucide-react";

const adviceArticles = [
  {
    id: 1,
    title: "Starting Solids: A Complete Guide",
    description: "Everything you need to know about introducing your baby to solid foods at 6 months",
    category: "Feeding",
    icon: Utensils,
    color: "from-pink-500 to-rose-500",
    content: [
      "Signs your baby is ready for solids include sitting up with support, showing interest in food, and losing the tongue-thrust reflex.",
      "Start with single-ingredient purees like sweet potato, avocado, or banana to identify any allergies.",
      "Offer one new food at a time and wait 3-5 days before introducing another to watch for reactions.",
      "Let baby set the pace - never force-feed. Babies know when they're full.",
      "Make mealtime fun and social by eating together as a family when possible.",
    ],
  },
  {
    id: 2,
    title: "Common Food Allergies in Babies",
    description: "How to identify and safely introduce common allergens to your baby",
    category: "Health",
    icon: AlertCircle,
    color: "from-red-500 to-orange-500",
    content: [
      "The 'Big 9' allergens are milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, and sesame.",
      "Current guidelines recommend introducing allergens early (around 6 months) rather than delaying them.",
      "Start with small amounts and watch for signs like hives, vomiting, difficulty breathing, or swelling.",
      "If there's a family history of allergies, consult your pediatrician before introducing high-risk foods.",
      "Keep antihistamines and your pediatrician's number handy when introducing new allergens.",
    ],
  },
  {
    id: 3,
    title: "Sleep and Feeding Schedules",
    description: "How nutrition affects your baby's sleep patterns and establishing healthy routines",
    category: "Sleep",
    icon: Moon,
    color: "from-indigo-500 to-purple-500",
    content: [
      "A consistent bedtime routine that includes a final feeding can help signal sleep time.",
      "Avoid feeding right before sleep after 6 months to prevent sleep associations.",
      "Babies who eat well during the day often sleep better at night.",
      "Growth spurts (around 6, 9, and 12 months) may temporarily disrupt sleep and increase hunger.",
      "Consult your pediatrician if you suspect feeding issues are affecting sleep quality.",
    ],
  },
  {
    id: 4,
    title: "Finger Foods and Self-Feeding",
    description: "Encouraging independence and developing fine motor skills through food",
    category: "Development",
    icon: Baby,
    color: "from-cyan-500 to-teal-500",
    content: [
      "Around 9 months, babies develop the pincer grasp and can start picking up small foods.",
      "Soft, easy-to-hold foods like steamed vegetable sticks and ripe fruit are perfect first finger foods.",
      "Cut food into appropriate sizes - too small and it's hard to grasp, too large is a choking hazard.",
      "Expect mess! Self-feeding is a learning process that builds confidence and coordination.",
      "Always supervise mealtimes and know infant CPR and choking first aid.",
    ],
  },
  {
    id: 5,
    title: "Nutrition for Brain Development",
    description: "Key nutrients that support cognitive growth in the first two years",
    category: "Nutrition",
    icon: Brain,
    color: "from-violet-500 to-purple-500",
    content: [
      "Omega-3 fatty acids (from fish, chia seeds, walnuts) are crucial for brain development.",
      "Iron-rich foods support cognitive function - offer meats, beans, and fortified cereals.",
      "Choline (found in eggs) aids memory and learning development.",
      "Colorful fruits and vegetables provide antioxidants that protect developing brain cells.",
      "Healthy fats from avocado, olive oil, and nut butters support brain growth.",
    ],
  },
  {
    id: 6,
    title: "Dealing with Picky Eaters",
    description: "Strategies for handling food refusal and expanding your toddler's palate",
    category: "Behavior",
    icon: Heart,
    color: "from-pink-500 to-red-500",
    content: [
      "It can take 10-15 exposures to a new food before a child accepts it. Keep offering!",
      "Model healthy eating - children mimic what they see parents doing.",
      "Make food fun with colorful plates, creative shapes, and involving them in preparation.",
      "Don't use food as a reward or punishment - this creates unhealthy associations.",
      "Offer choices between two healthy options to give them a sense of control.",
    ],
  },
  {
    id: 7,
    title: "Iron Deficiency: Signs & Prevention",
    description: "Why iron is crucial and how to ensure your baby gets enough",
    category: "Health",
    icon: ShieldCheck,
    color: "from-emerald-500 to-green-500",
    content: [
      "Iron stores from birth deplete around 6 months, making dietary iron essential.",
      "Signs of deficiency include pale skin, fatigue, poor appetite, and delayed development.",
      "Best sources: red meat, fortified cereals, lentils, spinach, and beans.",
      "Vitamin C enhances iron absorption - pair iron-rich foods with citrus or tomatoes.",
      "Avoid giving milk with iron-rich meals as calcium inhibits iron absorption.",
    ],
  },
  {
    id: 8,
    title: "Hydration Guide for Babies",
    description: "When and how much water your baby needs at different stages",
    category: "Nutrition",
    icon: Droplets,
    color: "from-blue-500 to-cyan-500",
    content: [
      "Babies under 6 months get all hydration from breast milk or formula - no water needed.",
      "At 6 months, offer small sips of water (2-4 oz daily) with solid foods.",
      "By 12 months, babies can drink about 8 oz of water daily alongside milk.",
      "Signs of dehydration: fewer wet diapers, dark urine, dry lips, lethargy.",
      "Avoid juice before 12 months; after that, limit to 4 oz of 100% juice daily.",
    ],
  },
  {
    id: 9,
    title: "Understanding Food Textures",
    description: "Progressing from purees to solids - a timeline guide",
    category: "Feeding",
    icon: Apple,
    color: "from-green-500 to-lime-500",
    content: [
      "6 months: Smooth, thin purees (single ingredients).",
      "7-8 months: Thicker purees with soft lumps, mashed foods.",
      "9-10 months: Minced or finely chopped foods, soft finger foods.",
      "11-12 months: Chopped table foods, varied textures.",
      "Don't rush - every baby progresses at their own pace based on readiness cues.",
    ],
  },
  {
    id: 10,
    title: "Baby-Led Weaning vs Traditional",
    description: "Comparing feeding approaches to find what works for your family",
    category: "Feeding",
    icon: HandHeart,
    color: "from-amber-500 to-orange-500",
    content: [
      "Baby-Led Weaning (BLW): Baby feeds themselves soft finger foods from the start.",
      "Traditional: Parent spoon-feeds purees, gradually introducing textures.",
      "BLW benefits: Promotes independence, may reduce picky eating, develops motor skills.",
      "Traditional benefits: Less mess, easier to track intake, can be faster.",
      "Many parents successfully combine both approaches - do what works for you!",
    ],
  },
  {
    id: 11,
    title: "Homemade vs Store-Bought Baby Food",
    description: "Pros, cons, and how to make the best choice for your family",
    category: "Nutrition",
    icon: Leaf,
    color: "from-teal-500 to-emerald-500",
    content: [
      "Homemade: Control ingredients, fresher, often cheaper, customizable flavors.",
      "Store-bought: Convenient, consistent texture, fortified with vitamins, longer shelf life.",
      "Quality store brands can be just as nutritious as homemade.",
      "For homemade: steam vegetables, blend smooth, freeze in portions.",
      "Always check store-bought labels for added sugars, salt, and preservatives.",
    ],
  },
  {
    id: 12,
    title: "Healthy Weight Gain Guidelines",
    description: "Understanding normal growth patterns and when to be concerned",
    category: "Health",
    icon: Scale,
    color: "from-purple-500 to-pink-500",
    content: [
      "Babies typically double birth weight by 5 months and triple it by 12 months.",
      "Growth charts show percentiles - staying on a consistent curve is more important than the specific percentile.",
      "Breastfed and formula-fed babies may have different growth patterns - both can be healthy.",
      "Slow weight gain may indicate feeding issues, illness, or need for more calories.",
      "Excessive rapid gain can happen - discuss with your pediatrician if concerned.",
    ],
  },
  {
    id: 13,
    title: "Managing Reflux & Digestive Issues",
    description: "Dietary strategies for common tummy troubles in infants",
    category: "Health",
    icon: Stethoscope,
    color: "from-rose-500 to-red-500",
    content: [
      "Keep baby upright for 30 minutes after feeding to reduce reflux.",
      "Smaller, more frequent feedings can help with both reflux and gas.",
      "For constipation: offer prunes, pears, and increase fluid intake.",
      "For diarrhea: BRAT diet (bananas, rice, applesauce, toast) can help.",
      "Persistent digestive issues may indicate allergies or intolerances - consult your doctor.",
    ],
  },
  {
    id: 14,
    title: "Introducing Meat & Fish Safely",
    description: "When and how to add animal proteins to your baby's diet",
    category: "Feeding",
    icon: Utensils,
    color: "from-orange-500 to-amber-500",
    content: [
      "Meat can be introduced as early as 6 months - it's an excellent iron source.",
      "Start with pureed or finely minced chicken, turkey, or beef.",
      "Fish provides omega-3s crucial for brain development - salmon is ideal.",
      "Avoid high-mercury fish: shark, swordfish, king mackerel, tilefish.",
      "Always ensure meat and fish are thoroughly cooked and age-appropriately prepared.",
    ],
  },
  {
    id: 15,
    title: "Creating Positive Mealtime Habits",
    description: "Building a healthy relationship with food from the start",
    category: "Behavior",
    icon: Sparkles,
    color: "from-yellow-500 to-amber-500",
    content: [
      "Eat together as a family when possible - babies learn by watching.",
      "Keep mealtimes calm and positive, even when baby refuses food.",
      "Let baby explore food with all senses - touching, smelling, and playing is learning.",
      "Establish consistent meal and snack times to create a routine.",
      "Turn off screens during meals to encourage mindful eating habits.",
    ],
  },
  {
    id: 16,
    title: "Meal Planning for Busy Parents",
    description: "Practical tips for preparing nutritious baby food with limited time",
    category: "Tips",
    icon: Clock,
    color: "from-slate-500 to-gray-500",
    content: [
      "Batch cook on weekends: prepare a week's worth of purees and freeze in portions.",
      "Use ice cube trays for perfect single-serving frozen portions.",
      "Prep ingredients while baby naps - wash, chop, and store in containers.",
      "Cook once, serve twice: make adult meals baby-friendly (before adding salt/spices).",
      "Keep emergency healthy options: pouches, frozen veggies, quick oats.",
    ],
  },
];

const Advice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 py-12 pt-24">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Expert Advice & Tips
              </h1>
              <p className="text-muted-foreground">
                Essential guides for your baby's nutrition journey
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', 'Feeding', 'Health', 'Nutrition', 'Development', 'Behavior', 'Tips'].map(cat => (
            <Badge 
              key={cat} 
              variant="secondary" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-1.5"
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {adviceArticles.map((article) => {
            const Icon = article.icon;
            return (
              <Card 
                key={article.id} 
                className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${article.color} shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {article.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">{article.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5 bg-muted/30 rounded-xl p-4">
                    {article.content.map((point, index) => (
                      <div key={index} className="flex gap-3">
                        <span className={`inline-block h-2 w-2 rounded-full bg-gradient-to-br ${article.color} mt-2 flex-shrink-0`} />
                        <p className="text-sm leading-relaxed text-muted-foreground">{point}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Disclaimer */}
        <Card className="mt-10 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Always consult your pediatrician for personalized guidance about your baby's nutrition and health.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Advice;