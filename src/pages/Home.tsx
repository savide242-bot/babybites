import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, Heart, Sparkles, Clock, Users, TrendingUp, Scan, Bot, MessageCircle, Star, Award, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import { recipes } from "@/data/recipes";

const Home = () => {
  const featuredRecipes = recipes.slice(0, 3);

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section - Fantástico e Cativante */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-60 -left-40 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 px-5 py-2 text-sm font-semibold backdrop-blur-sm border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Welcome to BabyBites
                </span>
              </div>
              
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-tight">
                Healthy{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-pulse">
                    Meals
                  </span>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"></div>
                </span>
                {" "}for Your Little One
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                Discover pediatrician-approved recipes, expert parenting advice, and meal planning tools designed for busy American parents. 
                <span className="font-semibold text-foreground"> Make nutritious homemade baby food with confidence.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 text-lg px-8 py-6 group">
                  <Link to="/recipes">
                    <BookOpen className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Explore Recipes
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-2 border-primary hover:bg-primary/10 transition-all duration-300 text-lg px-8 py-6 group">
                  <Link to="/chat">
                    <Bot className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Chat with Bibi AI
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">200+</p>
                    <p className="text-sm text-muted-foreground">Recipes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">10K+</p>
                    <p className="text-sm text-muted-foreground">Happy Parents</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">100%</p>
                    <p className="text-sm text-muted-foreground">Safe</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in delay-200">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl hover:shadow-hover transition-all duration-500 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                <img
                  src={heroImage}
                  alt="Ingredientes frescos e saudáveis para comida de bebê"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-6 shadow-2xl border-2 border-primary/20 backdrop-blur-sm animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">Pediatrician Approved</p>
                    <p className="text-sm text-muted-foreground">Guaranteed Nutrition</p>
                  </div>
                </div>
              </div>

              {/* Star rating floating card */}
              <div className="absolute -top-6 -right-6 bg-card rounded-2xl p-4 shadow-2xl border-2 border-secondary/20 backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">5.0 Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Melhorado */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30 relative">
        <div className="container relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              From first purees to toddler meals, we have got you covered with expert-approved content
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/recipes" className="group">
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-hover h-full bg-gradient-card hover:-translate-y-2">
                <CardHeader>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Recipe Library</CardTitle>
                  <CardDescription className="text-base">
                    200+ detailed recipes with nutrition info, age recommendations, and step-by-step instructions
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/community" className="group">
              <Card className="border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-hover h-full bg-gradient-card hover:-translate-y-2">
                <CardHeader>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Parent Community</CardTitle>
                  <CardDescription className="text-base">
                    Connect with other parents, share experiences, and get advice from verified pediatricians
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/growth" className="group">
              <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-hover h-full bg-gradient-card hover:-translate-y-2">
                <CardHeader>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Growth Tracker</CardTitle>
                  <CardDescription className="text-base">
                    Monitor your baby's growth with charts, track meals, and analyze nutritional balance
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/scanner" className="group">
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-hover h-full bg-gradient-card hover:-translate-y-2">
                <CardHeader>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <Scan className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Barcode Scanner</CardTitle>
                  <CardDescription className="text-base">
                    Scan grocery products to check if they're safe for your baby and get recipe suggestions
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/chat" className="group">
              <Card className="border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-hover h-full bg-gradient-card hover:-translate-y-2">
                <CardHeader>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Bibi AI Assistant</CardTitle>
                  <CardDescription className="text-base">
                    Chat with our intelligent AI nutritionist for personalized advice and recipe suggestions
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/recipes" className="group">
              <Card className="border-2 hover:border-accent/50 transition-all duration-300 hover:shadow-hover h-full bg-gradient-card hover:-translate-y-2">
                <CardHeader>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Quick & Easy</CardTitle>
                  <CardDescription className="text-base">
                    Most recipes ready in under 30 minutes - perfect for busy parents on the go
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="flex items-center justify-between mb-16 animate-fade-in">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Featured Recipes
              </h2>
              <p className="text-lg text-muted-foreground">Start with these parent-approved favorites</p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-2 hover:shadow-lg transition-all">
              <Link to="/recipes">View All</Link>
            </Button>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredRecipes.map((recipe, index) => (
              <Card 
                key={recipe.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 group animate-fade-in hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {recipe.ageGroup}
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <span className="bg-gradient-to-r from-primary to-primary-glow text-white px-3 py-1.5 rounded-full font-semibold shadow-sm">
                      {recipe.category}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {recipe.prepTime}
                    </span>
                  </div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors">{recipe.title}</CardTitle>
                  <CardDescription className="text-base">{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full rounded-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all group">
                    <Link to={`/recipe/${recipe.id}`}>
                      View Recipe
                      <Sparkles className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Super Cativante */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary via-secondary to-accent text-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="container text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full text-sm font-semibold">
              <Heart className="w-4 h-4 animate-pulse" />
              Join Our Community
            </div>
            
            <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Ready to Start Your Baby's Food Journey?
            </h2>
            
            <p className="text-xl md:text-2xl opacity-95 max-w-3xl mx-auto leading-relaxed">
              Join thousands of parents making nutritious, homemade baby food with confidence. 
              Get personalized advice from Bibi, our AI nutritionist!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
              <Button asChild size="lg" variant="secondary" className="rounded-full text-lg px-10 py-7 shadow-2xl hover:scale-105 transition-all duration-300 group">
                <Link to="/auth">
                  <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Get Started Free
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-full bg-white/20 border-2 border-white text-white hover:bg-white hover:text-primary transition-all duration-300 text-lg px-10 py-7 backdrop-blur-sm group">
                <Link to="/chat">
                  <Bot className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Try Bibi AI
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
