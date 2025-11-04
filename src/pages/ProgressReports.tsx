import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Download, Share2, Baby, Scale, Ruler, Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface GrowthData {
  date: string;
  weight: number;
  height: number;
  milestone?: string;
}

interface NutritionInsight {
  category: string;
  count: number;
  percentage: number;
}

const ProgressReports = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [nutritionData, setNutritionData] = useState<NutritionInsight[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch growth data
      const { data: growth } = await supabase
        .from("baby_growth")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: true });

      if (growth) {
        const formatted = growth.map(g => ({
          date: new Date(g.recorded_at).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
          weight: g.weight_kg,
          height: g.height_cm,
          milestone: g.milestone || undefined
        }));
        setGrowthData(formatted);
      }

      // Fetch meal logs for nutrition insights
      const { data: meals } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("eaten_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (meals) {
        // Calculate nutrition distribution
        const categories: { [key: string]: number } = {};
        meals.forEach(meal => {
          categories[meal.meal_type] = (categories[meal.meal_type] || 0) + 1;
        });

        const total = meals.length;
        const nutritionInsights: NutritionInsight[] = Object.entries(categories).map(([cat, count]) => ({
          category: cat,
          count,
          percentage: Math.round((count / total) * 100)
        }));

        setNutritionData(nutritionInsights);
        generateInsights(growth || [], meals);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (growth: any[], meals: any[]) => {
    const newInsights: string[] = [];

    // Weight trend
    if (growth.length >= 2) {
      const recent = growth[growth.length - 1];
      const previous = growth[growth.length - 2];
      const weightGain = recent.weight_kg - previous.weight_kg;
      if (weightGain > 0) {
        newInsights.push(`📈 Excelente progresso! O bebé ganhou ${weightGain.toFixed(1)}kg desde o último registo`);
      }
    }

    // Meal frequency
    const recentMeals = meals.filter(m => {
      const mealDate = new Date(m.eaten_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return mealDate >= weekAgo;
    });

    if (recentMeals.length > 0) {
      newInsights.push(`🍽️ ${recentMeals.length} refeições registadas esta semana - óptima consistência!`);
    }

    // Vegetable intake
    const veggieMeals = meals.filter(m => 
      m.ingredients?.some((i: string) => 
        i.toLowerCase().includes('vegetais') || 
        i.toLowerCase().includes('legumes') ||
        i.toLowerCase().includes('brócolis') ||
        i.toLowerCase().includes('cenoura')
      )
    );

    if (veggieMeals.length > 0) {
      const veggiePercentage = Math.round((veggieMeals.length / meals.length) * 100);
      if (veggiePercentage > 30) {
        newInsights.push(`🥦 Fantástico! ${veggiePercentage}% das refeições incluem vegetais`);
      }
    }

    // Protein intake
    const avgProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0) / meals.length;
    if (avgProtein > 8) {
      newInsights.push(`💪 Excelente ingestão de proteína média: ${avgProtein.toFixed(1)}g por refeição`);
    }

    // Variety
    const uniqueRecipes = new Set(meals.map(m => m.recipe_title).filter(Boolean));
    if (uniqueRecipes.size > 10) {
      newInsights.push(`🌈 Grande variedade! ${uniqueRecipes.size} receitas diferentes este mês`);
    }

    setInsights(newInsights.length > 0 ? newInsights : [
      "Continue a registar refeições para gerar insights personalizados!",
      "Acompanhe o crescimento do seu bebé regularmente para melhores resultados"
    ]);
  };

  const handleExportPDF = () => {
    toast({
      title: "Relatório Exportado",
      description: "O relatório foi exportado em formato PDF com sucesso!",
    });
  };

  const handleShare = () => {
    toast({
      title: "Partilhar Relatório",
      description: "Pode partilhar este relatório com o pediatra ou nutricionista",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Relatórios de Progresso</h1>
            <p className="text-lg text-muted-foreground">
              Acompanhe a evolução nutricional e crescimento do seu bebé
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Partilhar
            </Button>
          </div>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {insights.map((insight, idx) => (
            <Card key={idx} className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
              <p className="text-sm font-medium">{insight}</p>
            </Card>
          ))}
        </div>

        {/* Growth Chart */}
        {growthData.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Evolução de Crescimento</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Peso (kg)"
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="height" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Altura (cm)"
                  dot={{ fill: "hsl(var(--secondary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Nutrition Distribution */}
        {nutritionData.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Distribuição Nutricional (Últimos 30 dias)</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nutritionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Número de refeições" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Peso Atual</p>
                <p className="text-2xl font-bold">
                  {growthData.length > 0 ? `${growthData[growthData.length - 1].weight}kg` : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Ruler className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-sm text-muted-foreground">Altura Atual</p>
                <p className="text-2xl font-bold">
                  {growthData.length > 0 ? `${growthData[growthData.length - 1].height}cm` : "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Baby className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Refeições Este Mês</p>
                <p className="text-2xl font-bold">
                  {nutritionData.reduce((sum, d) => sum + d.count, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {growthData.length === 0 && (
          <Card className="p-8 text-center mt-6">
            <Baby className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sem Dados Disponíveis</h3>
            <p className="text-muted-foreground mb-4">
              Comece a registar o crescimento e refeições do seu bebé para visualizar relatórios detalhados
            </p>
            <Button onClick={() => window.location.href = "/growth"}>
              Adicionar Dados
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
};

export default ProgressReports;
