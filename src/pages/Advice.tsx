import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Baby, Moon, Utensils, AlertCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const adviceArticles = [
  {
    id: 1,
    title: "Starting Solids: A Complete Guide",
    description: "Everything you need to know about introducing your baby to solid foods at 6 months",
    category: "Feeding",
    icon: Utensils,
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
    content: [
      "The 'Big 9' allergens are milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, and sesame.",
      "Current guidelines recommend introducing allergens early (around 6 months) rather than delaying them.",
      "Start with small amounts and watch for signs like hives, vomiting, difficulty breathing, or swelling.",
      "If there's a family history of allergies, consult your pediatrician before introducing high-risk foods.",
      "Keep Benadryl and your pediatrician's number handy when introducing new allergens.",
    ],
  },
  {
    id: 3,
    title: "Sleep and Feeding Schedules",
    description: "How nutrition affects your baby's sleep patterns and establishing healthy routines",
    category: "Sleep",
    icon: Moon,
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
    icon: Sparkles,
    content: [
      "Omega-3 fatty acids (from fish, chia seeds, walnuts) are crucial for brain development.",
      "Iron-rich foods support cognitive function - offer meats, beans, and fortified cereals.",
      "Choline (found in eggs) aids memory and learning development.",
      "Colorful fruits and vegetables provide antioxidants that protect developing brain cells.",
      "Healthy fats from avocado, olive oil, and nut butters (after 12 months) support brain growth.",
    ],
  },
  {
    id: 6,
    title: "Dealing with Picky Eaters",
    description: "Strategies for handling food refusal and expanding your toddler's palate",
    category: "Behavior",
    icon: Heart,
    content: [
      "It can take 10-15 exposures to a new food before a child accepts it. Keep offering!",
      "Model healthy eating - children mimic what they see parents doing.",
      "Make food fun with colorful plates, creative shapes, and involving them in preparation.",
      "Don't use food as a reward or punishment - this creates unhealthy associations.",
      "Offer choices between two healthy options to give them a sense of control.",
    ],
  },
];

const Advice = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('advice.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t('advice.subtitle')}
          </p>
        </div>

        {/* Articles Grid */}
        <div className="space-y-6">
          {adviceArticles.map((article) => {
            const Icon = article.icon;
            return (
              <Card key={article.id} className="border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="secondary" className="rounded-full">
                          {article.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl mb-2">{article.title}</CardTitle>
                      <CardDescription className="text-base">{article.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 bg-muted/30 rounded-xl p-6">
                    {article.content.map((point, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Disclaimer */}
        <Card className="mt-12 border-2 border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{t('advice.disclaimer')}</strong> {t('advice.disclaimerText')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Advice;
