import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, Baby, Moon, Utensils, AlertCircle, Sparkles,
  Droplets, Scale, BookOpen, Apple, Brain, ShieldCheck,
  Clock, Leaf, HandHeart, Stethoscope, ThermometerSun,
  Pill, Milk, Wheat, Snowflake, Plane, Users, DollarSign,
  Calendar, Dumbbell, Eye, Smile
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
  // NEW ARTICLES
  {
    id: 17,
    title: "Vitamin D: The Sunshine Vitamin",
    description: "Why vitamin D is critical for bone health and immune function in babies",
    category: "Nutrition",
    icon: ThermometerSun,
    color: "from-yellow-400 to-orange-500",
    content: [
      "Vitamin D helps babies absorb calcium for strong bones and teeth development.",
      "Breastfed babies need 400 IU vitamin D supplement daily from birth - formula is usually fortified.",
      "Limited sun exposure means dietary sources become more important: fatty fish, fortified cereals, egg yolks.",
      "Deficiency can lead to rickets (soft bones), delayed motor development, and weakened immunity.",
      "Ask your pediatrician about vitamin D drops and when to start them.",
    ],
  },
  {
    id: 18,
    title: "Weaning from Breast or Bottle",
    description: "Gentle transition strategies for moving away from milk feeds",
    category: "Feeding",
    icon: Milk,
    color: "from-sky-400 to-blue-500",
    content: [
      "WHO recommends breastfeeding until age 2 or beyond, alongside solid foods from 6 months.",
      "Night weaning can begin around 6-12 months when baby gets adequate daytime nutrition.",
      "Gradual reduction works better than abrupt stopping - drop one feed at a time over weeks.",
      "Introduce cup drinking early (around 6 months) to ease bottle-to-cup transition by 12-18 months.",
      "Comfort nursing is natural - offer extra cuddles and attention during weaning.",
    ],
  },
  {
    id: 19,
    title: "Reading Baby Food Labels",
    description: "How to decode nutrition labels and ingredient lists on baby food products",
    category: "Tips",
    icon: Eye,
    color: "from-indigo-400 to-violet-500",
    content: [
      "Ingredients are listed by weight - the first ingredient makes up the largest portion.",
      "Avoid added sugars (including fruit juice concentrates, corn syrup, honey) before 12 months.",
      "Watch for hidden sodium - babies need less than 1g salt per day before 12 months.",
      "'Natural flavors' and 'organic' don't always mean healthier - check the full ingredient list.",
      "Compare per-serving sizes - some products use smaller servings to make nutrition look better.",
    ],
  },
  {
    id: 20,
    title: "Freezing & Storing Baby Food Safely",
    description: "Best practices for preserving homemade baby food nutrition and safety",
    category: "Tips",
    icon: Snowflake,
    color: "from-cyan-400 to-blue-500",
    content: [
      "Freeze purees in ice cube trays, then transfer to freezer bags labeled with date and contents.",
      "Most homemade baby food stays fresh frozen for 1-3 months at 0°F (-18°C) or below.",
      "Thaw overnight in refrigerator or use warm water bath - never microwave directly.",
      "Once thawed, use within 24-48 hours and never refreeze previously frozen food.",
      "Fresh purees can be refrigerated for 2-3 days in airtight containers.",
    ],
  },
  {
    id: 21,
    title: "Traveling with Baby: Feeding Tips",
    description: "How to maintain nutrition and safety when traveling with your infant",
    category: "Tips",
    icon: Plane,
    color: "from-blue-400 to-indigo-500",
    content: [
      "Pack shelf-stable food pouches and jars for flights - TSA allows baby food in reasonable quantities.",
      "Bring familiar foods to maintain routine and reduce feeding refusal in new environments.",
      "Portable insulated bags with ice packs keep perishables safe for several hours.",
      "Request baby-friendly meals from airlines 24 hours in advance - most accommodate special requests.",
      "In new destinations, stick to cooked foods, bottled water for mixing, and wash fresh produce thoroughly.",
    ],
  },
  {
    id: 22,
    title: "Feeding Twins & Multiples",
    description: "Practical strategies for feeding multiple babies efficiently",
    category: "Tips",
    icon: Users,
    color: "from-pink-400 to-rose-500",
    content: [
      "Synchronized feeding schedules help manage time - feed both at once when possible.",
      "Invest in double feeding equipment: twin nursing pillow, multiple high chairs, divided plates.",
      "Each baby may have different preferences and pace - that's normal and okay.",
      "Batch cooking becomes essential - prepare larger quantities and freeze individual portions.",
      "Accept help! Feeding multiples is demanding; having an extra pair of hands makes a difference.",
    ],
  },
  {
    id: 23,
    title: "Organic vs Conventional Baby Food",
    description: "Understanding the real differences and making informed choices",
    category: "Nutrition",
    icon: Leaf,
    color: "from-green-400 to-emerald-500",
    content: [
      "Organic foods have lower pesticide residues, but conventional foods are also safe within regulations.",
      "The 'Dirty Dozen' (strawberries, spinach, apples) have higher pesticide residues - prioritize organic here.",
      "The 'Clean Fifteen' (avocados, bananas, peas) have low residues - conventional is often fine.",
      "Organic doesn't automatically mean more nutritious - nutrition depends on the food itself.",
      "If budget is tight, focus on organic for frequently-eaten foods and those with edible skins.",
    ],
  },
  {
    id: 24,
    title: "Sugar & Salt: Hidden Dangers",
    description: "Why to avoid added salt and sugar and where they hide in baby foods",
    category: "Health",
    icon: AlertCircle,
    color: "from-red-400 to-rose-500",
    content: [
      "Babies' kidneys can't process excess salt - limit to under 1g per day before 12 months.",
      "Added sugar trains taste preferences toward sweet foods and contributes to tooth decay.",
      "Hidden sources: bread, cereals, yogurt, sauces, canned vegetables - always check labels.",
      "Natural sugars in fruits are fine - it's added sugars (in processed foods) to avoid.",
      "Herbs and spices (without salt) can make food tasty without sodium.",
    ],
  },
  {
    id: 25,
    title: "Building Immune System Through Nutrition",
    description: "Foods that strengthen your baby's natural defenses",
    category: "Health",
    icon: ShieldCheck,
    color: "from-emerald-400 to-teal-500",
    content: [
      "Vitamin C (citrus, berries, peppers) supports immune cell function and wound healing.",
      "Zinc (meat, beans, dairy) is crucial for immune development - babies are often deficient.",
      "Probiotics (yogurt, fermented foods) support gut health where 70% of immune cells reside.",
      "Vitamin A (sweet potatoes, carrots) maintains healthy mucous membranes - first defense against germs.",
      "Diverse diet = diverse gut bacteria = stronger immune system.",
    ],
  },
  {
    id: 26,
    title: "Seasonal Eating for Babies",
    description: "Benefits of feeding seasonal produce and what's in season when",
    category: "Nutrition",
    icon: Calendar,
    color: "from-amber-400 to-yellow-500",
    content: [
      "Spring: peas, asparagus, strawberries, artichokes - fresh and tender for purees.",
      "Summer: berries, peaches, zucchini, tomatoes - peak nutrition and natural sweetness.",
      "Fall: squash, apples, pears, sweet potatoes - perfect for warming purees.",
      "Winter: citrus, root vegetables, brussels sprouts - vitamin C and fiber-rich.",
      "Seasonal produce is fresher, more nutritious, often cheaper, and better for the environment.",
    ],
  },
  {
    id: 27,
    title: "Budget-Friendly Baby Nutrition",
    description: "How to feed your baby well without breaking the bank",
    category: "Tips",
    icon: DollarSign,
    color: "from-green-400 to-lime-500",
    content: [
      "Homemade baby food costs 50-80% less than store-bought when using whole ingredients.",
      "Buy frozen fruits and vegetables - equally nutritious and much cheaper than fresh.",
      "Beans, lentils, and eggs are affordable protein sources with excellent nutrition.",
      "Buy in bulk and freeze: sweet potatoes, bananas, oats, and seasonal produce.",
      "Generic/store brands are often identical to name brands at lower prices.",
    ],
  },
  {
    id: 28,
    title: "Introducing Gluten & Grains",
    description: "When and how to safely introduce wheat, oats, and other grains",
    category: "Feeding",
    icon: Wheat,
    color: "from-amber-500 to-orange-500",
    content: [
      "Introduce gluten-containing grains (wheat, barley, rye) around 6 months alongside other solids.",
      "Start with single-grain cereals: rice, oat, or barley mixed with breast milk or formula.",
      "Early introduction (before 12 months) may actually reduce celiac disease risk.",
      "Watch for signs of intolerance: bloating, diarrhea, rash, poor weight gain - consult your doctor.",
      "Variety matters: rotate between different grains (quinoa, millet, oats) for diverse nutrients.",
    ],
  },
  {
    id: 29,
    title: "Supplements: What Babies Need",
    description: "Essential supplements and when your baby might need them",
    category: "Health",
    icon: Pill,
    color: "from-violet-400 to-purple-500",
    content: [
      "Vitamin D (400 IU daily): All breastfed babies need this; formula is usually fortified.",
      "Iron: Breastfed babies may need supplements from 4 months; consult your pediatrician.",
      "Vitamin K: Given at birth to prevent bleeding disorders - a one-time injection.",
      "DHA/Omega-3: Consider if baby doesn't eat fish regularly - supports brain development.",
      "Always consult your pediatrician before starting any supplement.",
    ],
  },
  {
    id: 30,
    title: "Physical Activity & Appetite",
    description: "How movement affects your baby's hunger and eating patterns",
    category: "Development",
    icon: Dumbbell,
    color: "from-blue-400 to-cyan-500",
    content: [
      "Active babies often have bigger appetites - tummy time and crawling burn energy.",
      "Movement before meals can stimulate appetite in reluctant eaters.",
      "Avoid feeding immediately after vigorous activity - wait 15-20 minutes.",
      "Outdoor play increases appetite and helps regulate eating schedules.",
      "As babies become mobile (crawling, walking), calorie needs increase significantly.",
    ],
  },
  {
    id: 31,
    title: "Teething & Feeding Challenges",
    description: "How teething affects appetite and what foods help soothe sore gums",
    category: "Feeding",
    icon: Smile,
    color: "from-pink-400 to-rose-500",
    content: [
      "Teething often causes temporary appetite loss - don't worry if baby eats less for a few days.",
      "Cold foods soothe gums: frozen fruit in mesh feeders, chilled purees, cold teething biscuits.",
      "Soft, smooth textures are easier when gums are sore - offer purees even if baby usually eats solids.",
      "Avoid acidic foods (citrus, tomatoes) which can irritate sensitive gums.",
      "Extra breastfeeding or bottle feeds may be needed for comfort during teething.",
    ],
  },
];

const Advice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 pt-24 pb-24 lg:pb-8">
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
                {adviceArticles.length} essential guides for your baby's nutrition journey
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