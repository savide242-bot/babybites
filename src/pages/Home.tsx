import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, Heart, Sparkles, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import { recipes } from "@/data/recipes";

const Home = () => {
  const featuredRecipes = recipes.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16 md:py-24">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Welcome to BabyBites 🍼
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Healthy Meals for Your{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Little One
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Discover pediatrician-approved recipes, expert parenting advice, and meal planning tools designed for busy American parents. Make nutritious homemade baby food with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/recipes">
                    Explore Recipes
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link to="/planner">
                    Plan Your Week
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={heroImage}
                  alt="Fresh healthy baby food ingredients"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl p-4 shadow-lg border">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">200+ Recipes</p>
                    <p className="text-xs text-muted-foreground">Expert approved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need in One Place</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From first purees to toddler meals, we've got you covered with expert-approved content
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Recipe Library</CardTitle>
                <CardDescription>
                  200+ detailed recipes with nutrition info, age recommendations, and step-by-step instructions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-secondary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Meal Planner</CardTitle>
                <CardDescription>
                  Plan your week ahead and get automatic shopping lists organized by product type
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Expert Advice</CardTitle>
                <CardDescription>
                  Parenting tips from pediatricians and nutritionists on feeding, sleep, and development
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Quick & Easy</CardTitle>
                <CardDescription>
                  Most recipes ready in under 30 minutes - perfect for busy parents
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-secondary/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Age-Specific</CardTitle>
                <CardDescription>
                  Recipes tailored for 6-9, 9-12, 12-18, and 18-24 month age groups
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-accent/50 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Community</CardTitle>
                <CardDescription>
                  Join thousands of parents sharing tips, photos, and experiences
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Recipes</h2>
              <p className="text-muted-foreground">Start with these parent-approved favorites</p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/recipes">View All</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    {recipe.ageGroup}
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {recipe.category}
                    </span>
                    <span>• {recipe.prepTime}</span>
                  </div>
                  <CardTitle className="text-xl">{recipe.title}</CardTitle>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full rounded-full">
                    <Link to={`/recipe/${recipe.id}`}>View Recipe</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Baby's Food Journey?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of parents making nutritious, homemade baby food with confidence
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full">
            <Link to="/recipes">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
