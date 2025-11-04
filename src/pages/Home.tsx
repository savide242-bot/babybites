import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, Heart, Sparkles, TrendingUp, Scan, Bot, MessageCircle, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { useLanguage } from "@/hooks/useLanguage";

const Home = () => {
  const { t } = useLanguage();
  const featuredRecipes = recipes.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Welcome Section - Warm & Nurturing */}
      <section className="relative pt-8 pb-6 px-4">
        <div className="container max-w-4xl">
          {/* Motivational Quote */}
          <div className="text-center mb-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 via-accent/15 to-secondary/20 rounded-full px-6 py-3 backdrop-blur-sm border border-primary/20">
              <Heart className="w-4 h-4 text-primary animate-pulse" />
              <p className="text-sm font-medium text-foreground">
                Every meal is a step toward your baby's healthy future 💛
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Hi, Mama 👶
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light">
              Here's today's plan!
            </p>
          </div>
        </div>
      </section>

      {/* Quick Access Cards - Main Features */}
      <section className="py-8 px-4">
        <div className="container max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Recipes Card */}
            <Link to="/recipes" className="group">
              <Card className="border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-card h-full bg-gradient-card group-hover:scale-[1.02]">
                <CardHeader className="space-y-4 pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1">Recipes</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Healthy meals for every stage
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {/* Weekly Planner Card */}
            <Link to="/meal-planner" className="group">
              <Card className="border border-border/50 hover:border-secondary/40 transition-all duration-300 hover:shadow-card h-full bg-gradient-card group-hover:scale-[1.02]">
                <CardHeader className="space-y-4 pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary-glow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-7 w-7 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1">Weekly Planner</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Organize meals with ease
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {/* Growth Tracker Card */}
            <Link to="/growth" className="group">
              <Card className="border border-border/50 hover:border-accent/40 transition-all duration-300 hover:shadow-card h-full bg-gradient-card group-hover:scale-[1.02]">
                <CardHeader className="space-y-4 pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-glow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1">Growth Tracker</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Monitor your baby's progress
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {/* Food Scanner Card */}
            <Link to="/scanner" className="group">
              <Card className="border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-card h-full bg-gradient-card group-hover:scale-[1.02]">
                <CardHeader className="space-y-4 pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Scan className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1">Food Scanner</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Check products instantly
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {/* Tips & Guidance Card */}
            <Link to="/advice" className="group">
              <Card className="border border-border/50 hover:border-secondary/40 transition-all duration-300 hover:shadow-card h-full bg-gradient-card group-hover:scale-[1.02]">
                <CardHeader className="space-y-4 pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary-glow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-7 w-7 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1">Tips & Guidance</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Expert advice for parents
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {/* Smart Chat Card */}
            <Link to="/chat" className="group">
              <Card className="border border-border/50 hover:border-accent/40 transition-all duration-300 hover:shadow-card h-full bg-gradient-card group-hover:scale-[1.02]">
                <CardHeader className="space-y-4 pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-glow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Bot className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1">Smart Chat</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      AI nutritionist at your service
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {/* Progress Reports Card */}
            <Link to="/reports" className="group">
              <Card className="border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-card h-full bg-gradient-card group-hover:scale-[1.02]">
                <CardHeader className="space-y-4 pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1">Progress Reports</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Track nutrition & growth insights
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {/* Shopping List Card */}
            <Link to="/shopping" className="group">
              <Card className="border border-border/50 hover:border-secondary/40 transition-all duration-300 hover:shadow-card h-full bg-gradient-card group-hover:scale-[1.02]">
                <CardHeader className="space-y-4 pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary-glow/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ShoppingCart className="h-7 w-7 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground mb-1">Shopping List</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Smart lists from your planner
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Recipes Section - REMOVED per user request */}

      {/* Bottom CTA - Soft & Encouraging */}
      <section className="py-12 px-4 pb-20">
        <div className="container max-w-3xl">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
            
            <CardHeader className="text-center space-y-4 relative z-10 py-10 px-6">
              <div className="inline-flex items-center justify-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mx-auto">
                <Heart className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-foreground">Join Our Community</span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                You're doing amazing, Mama! 💕
              </h3>
              
              <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Every meal you prepare is filled with love. Let us help you make it nutritious and stress-free.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all">
                  <Link to="/chat">
                    <Bot className="mr-2 h-5 w-5" />
                    Chat with Bibi AI
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
