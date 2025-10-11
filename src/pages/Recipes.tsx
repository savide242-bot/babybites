import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { recipes, ageGroups, categories } from "@/data/recipes";

const Recipes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAge, setSelectedAge] = useState("All Ages");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAge = selectedAge === "All Ages" || recipe.ageGroup === selectedAge;
    const matchesCategory = selectedCategory === "All Categories" || recipe.category === selectedCategory;
    
    return matchesSearch && matchesAge && matchesCategory;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Recipe Library</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse our collection of pediatrician-approved recipes designed for babies aged 6-24 months
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Select value={selectedAge} onValueChange={setSelectedAge}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                {ageGroups.map((age) => (
                  <SelectItem key={age} value={age}>
                    {age}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""}
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-primary/50">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
                    {recipe.ageGroup}
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      {recipe.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {recipe.prepTime}
                    </span>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{recipe.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full rounded-full">
                    <Link to={`/recipe/${recipe.id}`}>View Recipe</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search query
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedAge("All Ages");
                setSelectedCategory("All Categories");
              }}
              variant="outline"
              className="rounded-full"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
