import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, Baby, Moon, Utensils, AlertCircle, Sparkles,
  Droplets, Scale, BookOpen, Apple, Brain, ShieldCheck,
  Clock, Leaf, HandHeart, Stethoscope, ThermometerSun,
  Pill, Milk, Wheat, Snowflake, Plane, Users, DollarSign,
  Calendar, Dumbbell, Eye, Smile, GraduationCap, Download
} from "lucide-react";
import { motion } from "framer-motion";
import { exportAdvicePDF } from "@/utils/advicePDFExport";

const adviceArticles = [
  {
    id: 1,
    title: "Starting Solids: A Complete Guide",
    description: "Everything you need to know about introducing your baby to solid foods at 6 months",
    category: "Feeding",
    icon: Utensils,
    color: "from-pink-500 to-rose-500",
    content: [
      "Signs your baby is ready for solids include sitting up with support, showing interest in food, reaching for items on your plate, and losing the tongue-thrust reflex that automatically pushes food out of the mouth. Most babies show these signs around 6 months, though some may be ready slightly earlier or later.",
      "Start with single-ingredient purees like sweet potato, avocado, or banana to identify any allergies. These first foods should be smooth and thin, almost liquid consistency, gradually thickening as your baby becomes more comfortable with swallowing.",
      "Offer one new food at a time and wait 3-5 days before introducing another to watch for allergic reactions such as rashes, vomiting, diarrhea, or unusual fussiness. Keep a food diary to track what your baby has tried and any reactions observed.",
      "Let baby set the pace - never force-feed. Babies have an innate ability to regulate their intake and know when they're full. Signs of fullness include turning the head away, closing the mouth, pushing food away, or becoming distracted.",
      "Make mealtime fun and social by eating together as a family when possible. Babies learn eating behavior by observing others, and shared mealtimes create positive associations with food from the very beginning.",
      "Start with 1-2 tablespoons of food once daily, gradually increasing to 2-3 meals per day by 8-9 months. Breast milk or formula remains the primary nutrition source throughout the first year.",
      "Temperature matters - always test food temperature on your wrist before offering. Baby food should be lukewarm or at room temperature. Microwaved food can have hot spots, so stir thoroughly and test again.",
      "Keep mealtimes short (10-15 minutes) and stress-free. If baby isn't interested, try again later. Forcing the issue creates negative associations with eating that can persist into toddlerhood.",
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
      "The 'Big 9' allergens are milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, and sesame. These account for over 90% of all food allergic reactions in children and should be introduced thoughtfully.",
      "Current medical guidelines from the AAP and WHO recommend introducing common allergens early (around 6 months) rather than delaying them, as research shows early introduction may actually reduce the risk of developing allergies.",
      "Start with small amounts and watch for symptoms like hives, facial swelling, vomiting, difficulty breathing, wheezing, or unusual skin reactions. Mild reactions may include slight redness around the mouth or minor rash.",
      "If there's a family history of allergies or if your baby has eczema, consult your pediatrician before introducing high-risk foods. Your doctor may recommend allergy testing or a supervised introduction in a clinical setting.",
      "Introduce allergens one at a time during daytime hours (not before bed) so you can monitor for reactions. Wait 3-5 days between new allergens. Once tolerated, continue offering regularly to maintain tolerance.",
      "Know the difference between allergy and intolerance. Allergies involve the immune system and can be life-threatening (anaphylaxis), while intolerances cause digestive discomfort but are not dangerous.",
      "Keep antihistamines (as recommended by your pediatrician) and your doctor's emergency number accessible. Learn to recognize signs of anaphylaxis: difficulty breathing, swelling of tongue/throat, sudden paleness, loss of consciousness.",
      "Common ways to introduce allergens: thin peanut butter mixed into puree, well-cooked scrambled egg, yogurt, soft-cooked fish flaked into food, and tofu blended into meals.",
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
      "A consistent bedtime routine that includes a final feeding 30 minutes before sleep can help signal to your baby that it's time to wind down. This separation prevents a feed-to-sleep association while still ensuring baby is satisfied.",
      "Avoid feeding directly before sleep after 6 months to prevent sleep-onset associations. When babies learn to fall asleep only while eating, they may require a feed every time they wake during the night.",
      "Babies who eat well and frequently during the day often sleep better at night because their caloric needs are met. Focus on offering nutritious, calorie-dense foods at dinner like avocado, sweet potato with olive oil, or iron-enriched cereals.",
      "Growth spurts around 6, 9, and 12 months may temporarily disrupt sleep patterns and increase hunger. During these periods, your baby may wake more often or seem hungrier than usual - this is normal and typically lasts 3-7 days.",
      "A good feeding schedule for 6-9 month olds includes breast/bottle on waking, solid breakfast mid-morning, lunch midday, afternoon milk feed, solid dinner early evening, and a final milk feed before bed.",
      "Watch for hunger cues that may be confused with tiredness: if baby fusses 1-2 hours after eating, they may need a top-up feed. Undertired babies who are fed to sleep may also appear hungry when they simply need more awake time.",
      "Caffeine in breast milk from maternal consumption can affect baby's sleep. If you notice sleep disruptions, consider reducing coffee intake or timing it right after a feed to minimize transfer.",
      "By 12 months, most babies can sleep 10-12 hours at night without needing a feed, provided they eat well during the day with 3 meals and 2 snacks.",
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
      "Around 8-9 months, babies develop the pincer grasp (thumb and forefinger) and can start picking up small pieces of food. Before this, they use a palmar grasp, so offer stick-shaped foods they can hold in their fist.",
      "Ideal first finger foods include steamed broccoli florets, soft banana spears, avocado strips, cooked sweet potato sticks, ripe pear slices, and well-cooked pasta shapes. These should be soft enough to squish between your fingers.",
      "Cut food into appropriate sizes: for younger babies (6-8 months), offer stick shapes about the length of your finger; for older babies (9+ months), small pea-sized pieces work as they develop the pincer grasp.",
      "Expect mess - and embrace it! Self-feeding is a critical learning process that builds confidence, coordination, and sensory exploration. Use a large bib, place a mat under the high chair, and let your baby explore.",
      "Always supervise mealtimes closely and learn infant CPR before starting solids. Know the difference between gagging (normal, baby learns to manage food) and choking (silent, requires intervention).",
      "High choking-risk foods to avoid: whole grapes, whole cherry tomatoes, raw carrots, whole nuts, popcorn, chunks of hard cheese, and hot dog rounds. Always cut round foods lengthwise into quarters.",
      "Encourage self-feeding with pre-loaded spoons: load the spoon with puree and hand it to baby. This bridges the gap between spoon-feeding and full independence while developing coordination.",
      "By 12 months, most babies can eat a modified version of family meals. Continue to avoid honey, excess salt, and hard/round choking hazards, but otherwise your baby can enjoy what the family eats.",
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
      "Omega-3 fatty acids, particularly DHA, are crucial building blocks for brain cell membranes. The best sources include salmon, sardines, chia seeds, flaxseeds, and walnuts. DHA is especially critical during the first 2 years when the brain triples in size.",
      "Iron-rich foods are essential for cognitive function as iron helps carry oxygen to the brain. Excellent sources include red meat, poultry, beans, lentils, fortified cereals, and spinach. Iron deficiency is the most common nutritional deficiency worldwide.",
      "Choline, found abundantly in eggs (especially yolks), supports memory formation and learning capacity. One egg yolk provides about 40% of a baby's daily choline needs. This nutrient is critical for hippocampal development.",
      "Colorful fruits and vegetables provide antioxidants (vitamins A, C, E) that protect developing brain cells from oxidative damage. The variety of colors represents different protective compounds - aim for a rainbow on baby's plate.",
      "Healthy fats from avocado, olive oil, coconut oil, and nut butters provide the building blocks for myelin, the protective coating around nerve fibers that speeds up brain signal transmission.",
      "Zinc, found in meat, beans, and dairy, plays a vital role in neurotransmitter function and is essential for learning, attention, and memory. Even mild zinc deficiency can impair cognitive development.",
      "B vitamins (especially B6, B12, and folate) from whole grains, eggs, meat, and leafy greens support neurotransmitter synthesis and help maintain healthy nerve function throughout brain development.",
      "Protein provides amino acids that serve as precursors to neurotransmitters like serotonin and dopamine. Include protein at every meal from sources like yogurt, eggs, meat, fish, beans, or lentils.",
      "Iodine from dairy, fish, and iodized salt is critical for thyroid function, which directly influences brain development. Deficiency during infancy can cause irreversible cognitive impairment.",
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
      "Research shows it can take 10-15 exposures to a new food before a child accepts it. This doesn't mean 10 bites - even seeing, touching, or smelling the food counts as an exposure. Patience and persistence are key.",
      "Model healthy eating enthusiastically - children imitate what they see parents and siblings doing. Eat the same foods together and show genuine enjoyment. Avoid making negative comments about any foods.",
      "Make food visually appealing and fun with colorful plates, creative shapes, themed meals, and involving children in age-appropriate preparation tasks. A child who helps wash vegetables is more likely to eat them.",
      "Never use food as a reward ('eat your broccoli and you'll get dessert') or punishment. This creates unhealthy power dynamics around food and teaches children that healthy food is unpleasant while treats are the goal.",
      "Offer choices between two healthy options to give children a sense of control: 'Would you like carrots or peas with dinner?' This respects their autonomy while ensuring nutritious outcomes.",
      "Serve new foods alongside familiar favorites. The 'safe food' provides comfort while the new food creates a low-pressure opportunity for exploration. Don't make a big deal about whether they try the new food.",
      "Avoid becoming a short-order cook. Offer one balanced meal for everyone and let children choose what and how much to eat from what's provided. This is the foundation of the 'Division of Responsibility' feeding model.",
      "Food jags (wanting the same food repeatedly) are normal in toddlers and usually resolve within a few weeks. Continue offering variety alongside the preferred food without pressure.",
      "If picky eating is severe and affects growth, energy, or development, consult a pediatric feeding therapist who can assess for sensory processing issues or oral motor difficulties.",
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
      "Iron stores inherited from birth begin to deplete around 4-6 months of age, making dietary iron increasingly essential. By 6 months, babies need about 11mg of iron daily - more per kilogram than an adult male.",
      "Signs of iron deficiency include unusually pale skin, persistent fatigue, poor appetite, irritability, delayed motor development, frequent infections, and in severe cases, pica (craving non-food items like ice or dirt).",
      "The best dietary sources of heme iron (most easily absorbed): red meat, dark poultry meat, liver, and fish. Non-heme sources include fortified cereals, lentils, chickpeas, kidney beans, spinach, and tofu.",
      "Vitamin C dramatically enhances iron absorption - pair iron-rich foods with citrus fruits, strawberries, tomatoes, bell peppers, or broccoli. For example, serve lentil puree with a squeeze of lemon juice.",
      "Avoid giving cow's milk as a main drink before 12 months. Calcium in milk inhibits iron absorption, and excessive milk consumption is a leading cause of iron deficiency in toddlers. Limit to 16-20oz daily after 12 months.",
      "Tea and coffee (including decaf) contain tannins that significantly reduce iron absorption. These should never be given to babies and should be avoided near mealtimes for breastfeeding mothers.",
      "Cook in cast iron pans when possible - this can increase the iron content of acidic foods (like tomato sauce) by up to 20 times. It's a simple, inexpensive way to boost iron intake.",
      "Your pediatrician may recommend iron-fortified formula or iron supplements, especially for premature babies, low birth weight infants, or exclusively breastfed babies over 4 months. Always follow dosing instructions carefully.",
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
      "Babies under 6 months get all the hydration they need from breast milk or formula - offering water is unnecessary and can fill their tiny stomachs, reducing milk intake and potentially causing dangerous electrolyte imbalances.",
      "At 6 months when solids begin, offer small sips of water (60-120ml / 2-4 oz daily) from an open cup or straw cup during mealtimes. This helps wash down food and establishes healthy drinking habits.",
      "By 12 months, babies can drink about 240ml (8 oz) of water daily alongside breast milk or whole cow's milk. Water needs increase with activity, hot weather, and as solid food intake grows.",
      "Signs of dehydration to watch for: fewer than 6 wet diapers per day, dark yellow urine, dry lips and mouth, sunken fontanelle (soft spot), unusual sleepiness, crying without tears, and skin that doesn't spring back when pinched.",
      "Avoid juice entirely before 12 months. After 12 months, limit to a maximum of 120ml (4 oz) of 100% fruit juice daily, diluted with water. Whole fruit is always preferable as it provides fiber and is less likely to cause tooth decay.",
      "Introduce cup drinking early - offer an open cup or straw cup from 6 months. This supports oral motor development better than sippy cups and makes the eventual bottle transition easier.",
      "During illness (vomiting, diarrhea, fever), dehydration risk increases significantly. Offer frequent small sips of breast milk, formula, or oral rehydration solution. Contact your doctor if dehydration signs appear.",
      "Flavored water, sports drinks, herbal teas, and plant-based milks (unless fortified and recommended by your pediatrician) are not appropriate replacements for water or milk in the first year.",
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
      "6 months: Start with smooth, thin purees made from single ingredients like sweet potato, apple, pear, or carrot. The consistency should be almost liquid, easily falling off a tilted spoon.",
      "7-8 months: Gradually thicken purees and introduce soft lumps, mashed foods like banana or avocado, and combination flavors. Baby should be getting used to moving food around the mouth.",
      "9-10 months: Move to minced or finely chopped foods and soft finger foods. This is when most babies develop the pincer grasp and can pick up small pieces. Include foods with varying textures in the same meal.",
      "11-12 months: Offer chopped table foods with varied textures, soft cubes of cheese, small pasta shapes, bite-sized pieces of soft fruits and cooked vegetables, and modified family meals.",
      "Don't rush the progression - every baby moves at their own pace based on oral motor readiness, interest, and physical development. Some babies skip purees entirely (baby-led weaning), while others prefer a gradual approach.",
      "Gagging is a normal safety reflex that helps babies learn to manage food textures. It's different from choking (which is silent). Allow gagging to occur naturally while staying calm and attentive.",
      "If your baby consistently refuses lumpy textures past 9-10 months, they may have oral motor delays or sensory sensitivities. Consult your pediatrician or a pediatric speech therapist for evaluation.",
      "Mixing textures can help the transition: stir small soft lumps into familiar purees, gradually increasing lumpiness. This gentle approach helps babies who are texture-sensitive.",
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
      "Baby-Led Weaning (BLW) means offering appropriately-sized soft finger foods from the start at 6 months, allowing baby to feed themselves entirely. Baby controls what, how much, and how fast they eat.",
      "Traditional weaning involves parent-led spoon-feeding of purees, gradually progressing through textures from smooth to lumpy to finger foods over several months.",
      "BLW benefits include promoting independence, improving fine motor skills earlier, potentially reducing picky eating, encouraging self-regulation of appetite, and allowing the whole family to eat together more easily.",
      "Traditional benefits include less mess, easier tracking of food intake, potentially faster mealtimes, ability to ensure iron-rich foods are consumed, and more comfort for anxious parents.",
      "Many families successfully combine both approaches in what's called 'combination feeding' - offering some spoon-fed purees alongside soft finger foods. This flexible approach works well for many families.",
      "Safety considerations for BLW: baby must be able to sit upright independently, foods must be soft enough to squish between fingers, appropriate sizing (stick shapes for younger babies), and constant supervision.",
      "Research shows both approaches are equally safe when guidelines are followed. BLW does not increase choking risk when appropriate foods are offered and parents receive proper guidance.",
      "The best approach is whatever works for your family, your baby's temperament, your comfort level, and your lifestyle. There is no single 'right' way to introduce solids.",
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
      "Homemade advantages: complete control over ingredients and quality, fresher flavors, often more cost-effective long-term, customizable flavors and textures, and no preservatives or additives.",
      "Store-bought advantages: extreme convenience for busy parents, consistent texture and taste, often fortified with additional vitamins (especially iron), longer shelf life, portable for travel, and rigorously tested for safety.",
      "High-quality commercial baby food brands can be equally nutritious as homemade. The most important factor is that your baby is eating a variety of nutritious foods, regardless of who prepared them.",
      "For homemade preparation: steam vegetables until very soft, blend to desired consistency, portion into ice cube trays or small containers, and freeze. Each cube is roughly one tablespoon - a perfect serving size.",
      "Always check store-bought labels for added sugars (fructose, fruit juice concentrate, corn syrup), excess sodium, unnecessary thickeners, and ingredient order - the first ingredient should be the actual food, not water or filler.",
      "The best strategy for most families is a combination: homemade for routine meals when you have time, store-bought for convenience when busy, traveling, or as backup. Neither is inherently superior.",
      "When making homemade baby food, avoid adding salt, sugar, or honey (before 12 months). Use herbs and mild spices like cinnamon, cumin, or basil to introduce diverse flavors naturally.",
      "Food safety is critical: use fresh ingredients, cook thoroughly, cool quickly, refrigerate within 2 hours, and consume within 48 hours. Frozen homemade baby food is safe for 1-3 months.",
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
      "Babies typically double their birth weight by 4-5 months and triple it by 12 months. After the first year, growth rate slows significantly - this is normal and expected, not a cause for concern.",
      "Growth charts show percentiles - your baby's consistent position on their growth curve is more important than the specific percentile number. A baby consistently at the 15th percentile is likely perfectly healthy.",
      "Breastfed and formula-fed babies may follow different growth trajectories. Breastfed babies often gain weight faster initially (0-3 months) then slow down, while formula-fed babies may show steadier gains. Both patterns are normal.",
      "Red flags for inadequate weight gain include: crossing two or more percentile lines downward, consistently flat or declining weight curve, signs of hunger after feeding, reduced energy or alertness, and fewer than 6 wet diapers daily.",
      "Excessive rapid weight gain can occur with overfeeding (especially bottle-fed babies), early introduction of calorie-dense foods, or genetic factors. Discuss concerns with your pediatrician rather than restricting a baby's food.",
      "Regular check-ups (typically at 2, 4, 6, 9, and 12 months) include weight and length measurements that your doctor plots on growth charts. Bring your own records and track trends between visits.",
      "Length/height growth is equally important but harder to measure accurately in babies. Growth in length typically follows: 25cm in the first year, 12cm in the second year.",
      "Premature babies should be plotted on growth charts using their adjusted age (corrected for prematurity) until age 2, as their growth pattern differs from full-term babies.",
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
      "Keep baby upright for at least 30 minutes after feeding to reduce reflux episodes. Gravity helps keep stomach contents down. Use an inclined seat or hold baby in an upright position on your chest.",
      "Smaller, more frequent feedings put less pressure on the stomach and can significantly reduce both reflux and gas. Aim for shorter, more regular feeds rather than large, infrequent ones.",
      "For constipation relief, offer prune puree, pear puree, and increase fluid intake. The 'P fruits' (prunes, pears, peaches, plums) contain sorbitol, a natural stool softener. Gentle tummy massage can also help.",
      "For diarrhea management, focus on maintaining hydration with breast milk, formula, or oral rehydration solution. The BRAT diet (bananas, rice, applesauce, toast) can help firm stools but shouldn't replace regular nutrition.",
      "Gas in babies is common and usually harmless. Techniques to help: bicycle legs, tummy massage in clockwise direction, proper burping during and after feeds, and ensuring correct bottle positioning to minimize air intake.",
      "Persistent or severe digestive issues may indicate cow's milk protein allergy (CMPA) or other food intolerances. Symptoms include mucus or blood in stool, severe colic, eczema, and failure to thrive.",
      "Probiotics (found naturally in yogurt for babies over 6 months) can help establish healthy gut bacteria and may reduce colic, gas, and digestive discomfort. Discuss probiotic drops with your pediatrician for younger babies.",
      "Seek immediate medical attention if you notice: blood in vomit or stool, projectile vomiting, bilious (green) vomit, severe abdominal distension, high fever with digestive symptoms, or signs of dehydration.",
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
      "Meat can and should be introduced as early as 6 months - it's one of the best sources of bioavailable iron and zinc, two nutrients babies commonly lack. The WHO specifically recommends meat as an early complementary food.",
      "Start with pureed or very finely minced chicken, turkey, or beef. Slow-cooking or pressure-cooking meat makes it tender enough to puree smoothly. Mix with vegetable puree or breast milk for palatability.",
      "Fish provides omega-3 fatty acids (DHA and EPA) crucial for brain and eye development. Salmon, cod, and tilapia are excellent first fish choices due to mild flavor and low mercury content.",
      "Avoid high-mercury fish entirely: shark, swordfish, king mackerel, tilefish, and bigeye tuna. These accumulate methylmercury which can damage developing nervous systems. Canned light tuna is lower in mercury than albacore.",
      "Always ensure meat and fish are thoroughly cooked to safe internal temperatures: poultry to 74°C/165°F, ground meat to 71°C/160°F, fish to 63°C/145°F. Never serve raw or undercooked animal products to babies.",
      "For BLW, offer shredded or pulled meat in strips, well-cooked fish flaked into large pieces, or meat on the bone (like a drumstick with cartilage removed) for babies to gnaw.",
      "Organ meats like liver are nutritional powerhouses - extremely rich in iron, vitamin A, B12, and zinc. A small amount of chicken liver puree once a week provides exceptional nutritional value.",
      "If your family is vegetarian or vegan, ensure adequate protein, iron, zinc, B12, and omega-3 from plant sources and discuss supplementation with your pediatrician to prevent deficiencies.",
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
      "Eat together as a family whenever possible - research shows that shared family meals are associated with better nutrition, healthier weight, improved language development, and stronger family bonds even from infancy.",
      "Keep mealtimes calm and emotionally positive, even when baby refuses food, makes a mess, or throws food. Your emotional response shapes your baby's relationship with eating for years to come.",
      "Let baby explore food with all senses - touching, squishing, smelling, licking, and playing with food is an essential part of the learning process. Sensory exploration builds comfort and acceptance of diverse foods.",
      "Establish consistent meal and snack times to create a predictable routine. Babies thrive on routine, and regular meal times help regulate appetite and prevent constant grazing.",
      "Turn off screens (TV, tablets, phones) during meals to encourage mindful eating habits. Distracted eating reduces a baby's ability to recognize hunger and fullness cues and can lead to overeating.",
      "Use the 'Division of Responsibility' approach by feeding expert Ellyn Satter: parents decide what, when, and where to eat; the child decides whether and how much to eat. This reduces mealtime battles.",
      "Avoid labeling foods as 'good' or 'bad.' Instead, use neutral language like 'everyday foods' and 'sometimes foods.' This prevents guilt and shame associations that contribute to disordered eating later.",
      "Praise the process, not the consumption: 'You tried something new!' rather than 'Good job finishing your plate!' This encourages exploration rather than overeating to please parents.",
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
      "Batch cook on weekends or one evening per week: steam, roast, and blend a variety of vegetables, fruits, and proteins. One 2-hour session can produce enough baby food portions for the entire week.",
      "Use ice cube trays or silicone baby food molds for perfect single-serving frozen portions (each cube is about 1 tablespoon). Once frozen solid, transfer to labeled freezer bags with the date and contents.",
      "Prep ingredients during baby's nap times - wash, peel, chop, and store vegetables and fruits in containers ready to cook. This reduces cooking time dramatically when mealtime arrives.",
      "Cook once, serve twice: prepare adult meals that can be easily adapted for baby before adding salt, strong spices, or honey. Shepherd's pie, stews, risottos, and pasta sauces all work beautifully.",
      "Keep emergency healthy options stocked: commercial baby food pouches, frozen mixed vegetables, quick oats, bananas, avocados, eggs, and canned beans. These are nutritious backup meals for hectic days.",
      "Use a slow cooker or instant pot to batch-prepare tender meats and vegetable stews with minimal hands-on time. Set it up in the morning and have dinner ready with baby-friendly food by evening.",
      "Create a rotating 2-week meal plan so you don't reinvent meals daily. Once you find 10-14 meals your baby enjoys, cycle through them while gradually introducing new options.",
      "Involve older siblings or your partner in food prep - it distributes the workload and models positive food preparation behaviors. Even toddlers can help wash vegetables or stir ingredients.",
    ],
  },
  {
    id: 17,
    title: "Vitamin D: The Sunshine Vitamin",
    description: "Why vitamin D is critical for bone health and immune function in babies",
    category: "Nutrition",
    icon: ThermometerSun,
    color: "from-yellow-400 to-orange-500",
    content: [
      "Vitamin D is essential for calcium absorption and bone mineralization. Without adequate vitamin D, babies cannot build strong bones and teeth, increasing the risk of rickets and skeletal deformities.",
      "All exclusively breastfed babies need 400 IU (10 mcg) of vitamin D supplement daily from birth, as breast milk typically contains very little vitamin D regardless of the mother's status. Formula is usually fortified.",
      "Limited sun exposure (due to sunscreen use and indoor lifestyles) means dietary sources become increasingly important: fatty fish (salmon, sardines), fortified cereals, egg yolks, and vitamin D-fortified dairy products.",
      "Vitamin D deficiency can cause rickets (softening and weakening of bones), delayed motor development, muscle weakness, increased infection susceptibility, and poor dental development.",
      "Risk factors for deficiency include: dark skin pigmentation, living in northern latitudes, exclusive breastfeeding without supplementation, premature birth, maternal deficiency, and limited outdoor time.",
      "Vitamin D drops are the easiest supplementation method for babies. Place the drop directly on the nipple before breastfeeding, on a pacifier, or mix into a small amount of expressed milk. Most drops are flavorless.",
      "After 12 months, vitamin D needs increase to 600 IU daily. Most toddler diets don't provide this amount from food alone, so continued supplementation is often recommended.",
      "Your pediatrician may test vitamin D levels through a simple blood test if deficiency is suspected. Treatment for deficiency involves higher-dose supplementation under medical supervision.",
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
      "The WHO recommends breastfeeding until age 2 or beyond, alongside solid foods from 6 months. There is no 'right' time to wean - the decision depends on your family's needs, your baby's readiness, and your personal circumstances.",
      "Gradual reduction works better than abrupt stopping for both parent and child. Drop one feed at a time over 1-2 weeks, replacing it with a solid meal or cup of milk, allowing your body and baby to adjust.",
      "Night weaning can begin around 6-12 months when baby gets adequate daytime nutrition. Start by reducing the duration/volume of night feeds gradually, offer water instead, and increase daytime calories.",
      "Introduce cup drinking early (around 6 months) with water during meals. Open cups and straw cups support better oral motor development than sippy cups and make the bottle transition easier by 12-18 months.",
      "Comfort nursing is natural and valid - many babies nurse for emotional security rather than hunger. During weaning, offer extra cuddles, physical contact, a comfort object, and attention to meet emotional needs.",
      "The AAP recommends weaning from bottles by 12-15 months to prevent dental issues, iron deficiency (from excessive milk), and speech development delays. Transition to regular cups gradually.",
      "If weaning because of returning to work, maintain morning and evening feeds while replacing daytime feeds with expressed milk or formula in a cup. This preserves the nursing relationship while accommodating your schedule.",
      "Watch for signs baby is self-weaning: decreased interest in nursing, shortened feeds, easily distracted during feeds, and increased interest in solid foods. Most babies don't truly self-wean before 12 months.",
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
      "Ingredients are listed in descending order by weight - the first ingredient makes up the largest portion of the product. If water or apple puree is first, the named food may be a minor component.",
      "Avoid added sugars in all forms before 12 months: fruit juice concentrates, corn syrup, cane sugar, brown rice syrup, honey, and maltodextrin. Natural sugars from whole fruits are fine.",
      "Watch for hidden sodium - babies need less than 400mg of sodium per day before 12 months (equivalent to about 1g salt). Many commercial products contain more than you'd expect, especially in savory flavors.",
      "'Natural flavors,' 'organic,' and 'non-GMO' labels don't automatically mean healthier or more nutritious. Always read the complete ingredient list and nutrition panel rather than relying on front-label marketing.",
      "Compare per-serving sizes between products - some brands use smaller serving sizes to make calorie, sugar, and sodium numbers look better. Always compare using the same serving size.",
      "Look for products with short, recognizable ingredient lists. If you can't pronounce an ingredient or wouldn't use it in your own cooking, consider whether it belongs in your baby's food.",
      "Age recommendations on packaging are guidelines, not rules. A '6+ months' product may be appropriate for an older baby too. Focus on ingredients and texture rather than age labels.",
      "Heavy metal contamination in baby food has been documented. Choose brands that test for arsenic, lead, cadmium, and mercury. Vary rice-based products with alternatives like oat-based cereals.",
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
      "Freeze purees in ice cube trays, silicone molds, or small airtight containers, then transfer to freezer bags labeled clearly with the food name and date. Each ice cube is approximately 1 tablespoon.",
      "Most homemade baby food remains safe and nutritious frozen for 1-3 months at -18°C (0°F) or below. Meat-based purees are best used within 1-2 months, while fruit and vegetable purees last up to 3 months.",
      "Thaw frozen baby food safely: overnight in the refrigerator (safest method), in a warm water bath, or using the defrost setting on your microwave. Never leave baby food to thaw at room temperature.",
      "Once thawed, use within 24-48 hours and never refreeze previously frozen food. Bacteria can multiply rapidly in thawed food, so treat it like fresh food once defrosted.",
      "Fresh homemade purees can be refrigerated for 2-3 days maximum in airtight containers. Meat and fish purees should be used within 1-2 days due to higher bacterial risk.",
      "Flash-freezing preserves nutrients better than slow freezing. Spread puree flat in freezer bags or use shallow containers to freeze quickly. Most vitamins are well-preserved through freezing.",
      "When reheating, stir thoroughly to eliminate hot spots, especially after microwaving. Always test temperature on your inner wrist before serving. Food should be lukewarm, not hot.",
      "Glass containers and silicone molds are better for freezing than plastic, which can leach chemicals when exposed to temperature extremes. BPA-free plastic is acceptable for short-term storage.",
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
      "Pack shelf-stable food pouches, jars, and sealed snacks for flights and car trips. TSA and most airline security allow baby food, formula, and breast milk in reasonable quantities beyond normal liquid limits.",
      "Bring familiar foods to maintain routine and reduce feeding refusal in unfamiliar environments. Babies can become fussy eaters when their routine is disrupted, so familiar tastes provide comfort.",
      "Portable insulated bags with ice packs or frozen gel packs keep perishable foods safe for 4-6 hours. Pack pre-portioned meals in small containers to minimize waste and maximize convenience.",
      "Request baby-friendly or special meals from airlines at least 24-48 hours in advance. Many airlines accommodate pureed food, fruit plates, or bland options. Bring backup food regardless.",
      "In international destinations, stick to thoroughly cooked foods, use bottled water for mixing formula or cooking, and wash all fresh produce with purified water. Avoid raw foods and street vendors for babies.",
      "Bring essential feeding equipment: a portable high chair or clip-on seat, disposable bibs, a few familiar utensils, and a water bottle with sippy lid. These help maintain normalcy in new settings.",
      "For road trips, schedule stops around feeding times. Never feed a baby solid foods while the car is moving - choking risk increases when you can't supervise closely.",
      "Pack extra food for delays. Travel rarely goes exactly as planned, and a hungry, cranky baby in an airport or car makes everything harder. Always bring 50% more food than you think you'll need.",
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
      "Synchronized feeding schedules are essential for managing twins. When possible, feed both babies at the same time to create predictable routines and free up time between meals for other activities.",
      "Invest in efficient equipment: a twin nursing pillow, two high chairs positioned next to each other, divided plates for easy serving, and a large supply of bibs and burp cloths.",
      "Accept that each baby may have different food preferences, eating speeds, and appetite levels - and that's completely normal. Avoid comparing twins' intake or pressuring the lighter eater to match the other.",
      "Batch cooking becomes absolutely essential with multiples. Prepare large quantities on weekends and freeze in individual portions. Consider a chest freezer as an investment that pays for itself quickly.",
      "Accept every offer of help! Having an extra pair of hands for feeding time - whether a partner, grandparent, friend, or babysitter - makes an enormous difference in reducing stress.",
      "Use identical bowls, spoons, and cups in different colors to keep track of each baby's intake and preferences without cross-contamination if one is ill or has different dietary needs.",
      "If one twin has allergies or sensitivities, it's often simpler to feed both the same allergy-friendly diet rather than preparing completely separate meals, unless medically advised otherwise.",
      "Connect with local or online multiples groups for practical tips, moral support, and meal-swap ideas. Parents of twins and multiples have invaluable experience to share.",
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
      "Organic foods are grown without synthetic pesticides, herbicides, or fertilizers and have measurably lower pesticide residues. However, conventional foods are also rigorously tested and remain within safe regulatory limits.",
      "The EWG's 'Dirty Dozen' list identifies produce with highest pesticide residues (strawberries, spinach, kale, apples, grapes, peaches). Prioritize organic versions of these if budget allows.",
      "The 'Clean Fifteen' includes produce with naturally low pesticide residues even when conventionally grown: avocados, sweet corn, pineapple, onions, papaya, frozen peas, asparagus, and bananas.",
      "Nutritionally, organic and conventional foods are very similar. Studies show minimal differences in vitamin and mineral content. The primary benefit of organic is reduced chemical exposure, not superior nutrition.",
      "If budget is limited, focus organic spending on foods your baby eats most frequently and those with edible skins (apples, berries, peaches). Thick-skinned produce like bananas and avocados are lower priority.",
      "Organic doesn't mean pesticide-free - organic farming uses naturally-derived pesticides which, while generally less toxic, are still present. Washing all produce thoroughly is important regardless of growing method.",
      "For animal products (dairy, eggs, meat), organic often represents more meaningful differences: no antibiotics, no growth hormones, and requirements for animal welfare standards and outdoor access.",
      "The most important factor is that your baby eats a diverse variety of fruits, vegetables, proteins, and grains - whether organic or conventional. Don't let perfect be the enemy of good nutrition.",
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
      "Babies' immature kidneys cannot efficiently process excess sodium, making high salt intake potentially dangerous. Before 12 months, limit total sodium intake to under 400mg daily (less than 1g of salt).",
      "Added sugar trains developing taste preferences toward sweet foods, contributes to tooth decay even before teeth fully emerge, and can displace more nutritious foods from the diet. Avoid all added sugars before 12 months.",
      "Hidden salt sources that catch parents off-guard: bread (surprisingly high in sodium), breakfast cereals, cheese, canned vegetables, sauces and condiments, stock cubes, and processed deli meats.",
      "Hidden sugar sources: yogurts marketed for babies, fruit juices and smoothies, cereals, pasta sauces, crackers, and dried fruits. Natural sugars in whole fruits are fine - it's added sugars to avoid.",
      "Herbs and mild spices (cinnamon, cumin, basil, oregano, turmeric, mild curry) can make baby food delicious without adding sodium. Babies can handle and even enjoy well-seasoned food from 6 months.",
      "After 12 months, salt and sugar limits relax slightly but should still be minimal. Toddlers aged 1-3 need no more than 2g of salt per day. Continue minimizing added sugars through age 2.",
      "Read labels carefully: salt may appear as sodium, sodium chloride, monosodium glutamate, or baking soda. Sugar appears as sucrose, fructose, dextrose, maltose, corn syrup, agave nectar, and many other names.",
      "Cooking from scratch is the most reliable way to control salt and sugar intake. When using commercial products, choose specifically baby-targeted products (which have stricter regulations) or 'no added salt/sugar' versions.",
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
      "Vitamin C from citrus fruits, berries, bell peppers, broccoli, and kiwi supports immune cell function, wound healing, and enhances iron absorption. It's water-soluble and not stored, so daily intake is important.",
      "Zinc from meat, beans, dairy, and fortified cereals is crucial for immune cell development and function. Even mild zinc deficiency significantly impairs immune response. Red meat is the most bioavailable source.",
      "Probiotics from yogurt, kefir, and other fermented foods support gut health - and approximately 70% of the immune system resides in the gut. A healthy gut microbiome is essential for strong immunity.",
      "Vitamin A from sweet potatoes, carrots, mangoes, and dark leafy greens maintains healthy mucous membranes in the nose, throat, and gut - the body's first physical barrier against pathogens.",
      "A diverse diet creates diverse gut bacteria, which creates a stronger, more resilient immune system. Aim to offer 30+ different foods per week across all food groups for optimal microbiome diversity.",
      "Breast milk provides immunoglobulins, white blood cells, and prebiotics that directly support the baby's developing immune system. These benefits continue as long as breastfeeding continues alongside solids.",
      "Vitamin E from sunflower seeds, almonds (as butter), spinach, and avocado acts as a powerful antioxidant, protecting immune cells from damage and supporting their ability to fight infections.",
      "Adequate sleep and reduced stress also significantly impact immune function. A well-rested, emotionally secure baby with good nutrition has the strongest possible immune foundation.",
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
      "Spring produce perfect for babies: peas (sweet and easy to mash), asparagus (tender tips pureed), strawberries (rich in vitamin C), artichoke hearts (mild and nutritious), and new potatoes.",
      "Summer bounty: berries of all kinds (antioxidant powerhouses), peaches and nectarines (sweet and soft), zucchini (mild and easy to digest), tomatoes (rich in lycopene), and watermelon (hydrating).",
      "Fall harvest favorites: butternut squash (naturally sweet, packed with beta-carotene), apples (versatile in purees, sauces, and finger foods), pears (gentle on digestion), and sweet potatoes.",
      "Winter warmers: citrus fruits (vitamin C boost during cold season), root vegetables (carrots, parsnips, turnips for warming purees), Brussels sprouts, and kale (iron and vitamin K rich).",
      "Seasonal produce is harvested at peak ripeness, which means maximum nutrition, best flavor, and naturally lowest price. It also teaches children about nature's rhythms and food origins.",
      "Visit local farmers markets with your baby - the colors, smells, and social experience create positive food associations. Many vendors will let babies taste samples of ripe fruit.",
      "Frozen fruits and vegetables are excellent alternatives when fresh seasonal produce isn't available. They're frozen at peak ripeness and retain most of their nutritional value.",
      "Gradually introducing seasonal variety throughout the year naturally exposes your baby to a wide range of nutrients, flavors, and textures without overwhelming meal planning.",
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
      "Homemade baby food costs 50-80% less than commercial equivalents when using whole ingredients. A week's worth of homemade purees can cost as little as $5-10 compared to $25-40 for store-bought.",
      "Frozen fruits and vegetables are equally nutritious as fresh (often more so, as they're frozen at peak ripeness) and significantly cheaper, especially for out-of-season produce.",
      "Beans, lentils, chickpeas, and eggs are among the most affordable protein sources available while providing excellent nutrition, fiber, iron, and essential amino acids for growing babies.",
      "Buy in bulk when items are on sale: sweet potatoes, bananas, oats, rice, and seasonal produce. Cook and freeze in portions to avoid waste while maximizing savings.",
      "Store-brand and generic products are often manufactured in the same facilities as name brands with identical ingredients at 20-40% lower prices. Always compare labels rather than marketing.",
      "Plan meals around weekly grocery sales and seasonal availability. A simple meal plan built around what's on sale can dramatically reduce your food budget without sacrificing nutrition.",
      "Reduce food waste by using vegetable scraps (carrot peels, broccoli stalks) in baby-friendly soups and purees. Use overripe bananas for smoothies, baking, or freezing as natural sweetener.",
      "Breastfeeding remains the most cost-effective nutrition for babies. Even partial breastfeeding alongside formula and solids provides immune benefits and reduces formula costs.",
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
      "Introduce gluten-containing grains (wheat, barley, rye) around 6 months alongside other solid foods. Research shows that neither very early nor very late introduction offers protection against celiac disease.",
      "Start with single-grain cereals mixed with breast milk or formula: iron-fortified rice cereal, oatmeal, or barley cereal. These provide iron and are gentle first grain experiences.",
      "Current evidence suggests that introducing gluten while still breastfeeding, and between 4-12 months, may reduce celiac disease risk in genetically predisposed children. Discuss timing with your pediatrician.",
      "Watch for signs of celiac disease or gluten intolerance: persistent bloating, chronic diarrhea or constipation, foul-smelling stools, rash (dermatitis herpetiformis), irritability, and poor weight gain.",
      "Offer variety beyond wheat: quinoa (complete protein), millet (easily digestible), amaranth (iron-rich), buckwheat (despite the name, gluten-free), and oats (rich in fiber and iron).",
      "Whole grains are preferable to refined grains as they retain fiber, B vitamins, and minerals lost during processing. However, very high-fiber foods can be hard on tiny digestive systems, so introduce gradually.",
      "Rice-based products (rice cereal, rice cakes, rice milk) can contain elevated arsenic levels. Vary grain choices and don't rely exclusively on rice-based foods. Rinsing rice before cooking reduces arsenic.",
      "By 12 months, grains should be a regular part of your baby's diet, providing energy, fiber, and B vitamins. Offer bread, pasta, couscous, polenta, and porridge in age-appropriate textures.",
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
      "Vitamin D (400 IU daily): All exclusively breastfed babies need this supplement from birth. Formula-fed babies receiving less than 32oz daily also need supplementation. This is the most universally recommended baby supplement.",
      "Iron: Exclusively breastfed babies may need iron supplements from 4 months onward, as breast milk iron levels decline. Formula is iron-fortified. Once eating iron-rich solids well (around 7-8 months), supplements may no longer be needed.",
      "Vitamin K: Administered as a single injection at birth to prevent Vitamin K Deficiency Bleeding (VKDB), a potentially life-threatening condition. This is a one-time intervention, not an ongoing supplement.",
      "DHA/Omega-3: Consider supplementation if your baby doesn't eat fish at least twice weekly. DHA is critical for brain and eye development, especially in the first 2 years of rapid brain growth.",
      "Always consult your pediatrician before starting any supplement. Over-supplementation can be harmful - fat-soluble vitamins (A, D, E, K) accumulate in the body and can reach toxic levels.",
      "Premature babies often need additional supplementation of iron, vitamin D, calcium, phosphorus, and sometimes a multivitamin. Your NICU team or pediatrician will provide specific recommendations.",
      "Probiotics may be recommended for babies with colic, digestive issues, or after antibiotic use. Specific strains like Lactobacillus reuteri have the strongest evidence for infant use.",
      "Fluoride supplementation is NOT recommended before 6 months. After 6 months, your pediatrician may recommend fluoride drops if your water supply isn't fluoridated, to support dental health.",
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
      "Active babies naturally develop bigger appetites because movement burns calories and stimulates metabolic processes. Tummy time, crawling, pulling up, and eventually walking all increase energy expenditure significantly.",
      "Gentle movement and play before mealtimes can stimulate appetite in reluctant eaters. Activities like tummy time, rolling, or supervised floor play 15-20 minutes before meals may improve food acceptance.",
      "Avoid feeding immediately after vigorous, exciting activity. Allow 15-20 minutes of calm transition time so baby isn't too stimulated or out of breath to eat effectively.",
      "Outdoor play and fresh air have been shown to increase appetite and help regulate eating schedules naturally. Even short periods outside in natural light can improve feeding patterns.",
      "As babies become mobile (typically crawling at 7-10 months, walking at 9-15 months), their calorie needs increase by 15-25%. You may notice sudden increases in appetite during motor development milestones.",
      "Swimming, music classes, and interactive play all count as physical activity for babies. These activities also provide sensory stimulation that supports overall development alongside healthy appetite regulation.",
      "Sedentary behavior (extended time in bouncers, swings, or watching screens) can reduce appetite and disrupt natural hunger cues. Ensure babies have plenty of floor time for free movement.",
      "Track the connection between your baby's activity levels and eating patterns. Many parents notice that days with more physical activity naturally lead to better eating and sleeping.",
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
      "Teething commonly causes temporary appetite reduction lasting 3-7 days per tooth eruption. This is normal and not a cause for concern as long as your baby stays hydrated and continues drinking milk.",
      "Cold foods provide natural pain relief for sore gums: frozen fruit in a mesh feeder, chilled cucumber sticks, cold yogurt, frozen breast milk popsicles, and refrigerated banana. The cold numbs sensitive gums.",
      "Soft, smooth textures are easier to eat when gums are painful. Temporarily return to smoother purees even if your baby has progressed to chunkier textures. This ensures adequate nutrition during discomfort.",
      "Avoid acidic foods during active teething episodes - citrus fruits, tomatoes, pineapple, and vinegar-based foods can irritate already inflamed and sensitive gum tissue.",
      "Extra breastfeeding or bottle feeds may be needed for both nutrition and comfort during teething. The sucking action can soothe sore gums, and milk ensures calorie intake even when solid food is refused.",
      "Teething biscuits and rusks can be helpful but choose low-sugar options and always supervise closely to prevent choking as pieces break off. Some parents prefer frozen washcloths as a safer alternative.",
      "The typical teething timeline: bottom central incisors (6-10 months), top central incisors (8-12 months), lateral incisors (9-13 months), first molars (13-19 months), canines (16-22 months), second molars (23-33 months).",
      "If appetite loss persists beyond 1-2 weeks or is accompanied by fever over 38.3°C (101°F), ear pulling, or significant behavior changes, consult your pediatrician as these may indicate illness rather than teething.",
    ],
  },
];

const categories = ['All', 'Feeding', 'Health', 'Nutrition', 'Development', 'Behavior', 'Tips', 'Sleep'];

const Advice = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredArticles = selectedCategory === 'All' 
    ? adviceArticles 
    : adviceArticles.filter(a => a.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-24 lg:pb-8">
      <div className="container max-w-6xl mx-auto px-3 sm:px-4">
        {/* Premium Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-6 sm:p-10 md:p-12 mb-8 sm:mb-10"
        >
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/30 rounded-full"
                animate={{ 
                  y: [0, -100], 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 3, 
                  delay: i * 0.5, 
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                style={{ left: `${15 + i * 15}%`, bottom: 0 }}
              />
            ))}
          </div>
          
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent shadow-2xl"
            >
              <GraduationCap className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary/20 text-primary border-0 px-3 py-1">
                  {adviceArticles.length} Expert Guides
                </Badge>
                <Badge className="bg-mint/20 text-mint-foreground border-0 px-3 py-1 hidden sm:inline-flex">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Curated by Experts
                </Badge>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
                Knowledge Hub
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2 sm:mt-3 max-w-xl leading-relaxed">
                Expert guidance from pediatric nutritionists to support your parenting journey with confidence
              </p>
              <Button
                onClick={() => exportAdvicePDF(adviceArticles.map(a => ({ id: a.id, title: a.title, description: a.description, category: a.category, content: a.content })))}
                variant="outline"
                className="mt-4 gap-2"
              >
                <Download className="w-4 h-4" />
                Export All as PDF
              </Button>
          </div>
        </motion.div>

        {/* Category Filter Pills */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-10"
        >
          {categories.map((cat, index) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        {/* Results Count */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mb-6"
        >
          Showing <span className="font-semibold text-foreground">{filteredArticles.length}</span> {filteredArticles.length === 1 ? 'article' : 'articles'}
        </motion.p>

        {/* Articles Grid - Premium Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {filteredArticles.map((article, index) => {
            const Icon = article.icon;
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-card to-card/80 h-full">
                  {/* Top color bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${article.color}`} />
                  
                  {/* Corner glow effect */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${article.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
                  
                  <CardHeader className="pb-3 pt-5 sm:pt-6">
                    <div className="flex items-start gap-4">
                      {/* Animated Icon */}
                      <motion.div 
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${article.color} shrink-0 shadow-xl`}
                      >
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </motion.div>
                      
                      <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                        <Badge variant="outline" className="text-[10px] sm:text-xs font-medium bg-background/50">
                          {article.category}
                        </Badge>
                        <CardTitle className="text-base sm:text-lg leading-snug group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm line-clamp-2">
                          {article.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2 sm:space-y-3 bg-muted/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      {article.content.map((point, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                          className="flex gap-3"
                        >
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br ${article.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-white text-[10px] sm:text-xs font-bold">{idx + 1}</span>
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                            {point}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mt-10 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Disclaimer:</strong> This information is for educational purposes only and should not replace professional medical advice. Always consult your pediatrician for personalized guidance about your baby's nutrition and health.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Advice;
