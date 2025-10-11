import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, AlertCircle, Refrigerator, ArrowLeft, Calendar } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";

const RecipeDetail = () => {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Recipe not found</h2>
          <Button asChild className="rounded-full">
            <Link to="/recipes">Back to Recipes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToPlanner = () => {
    toast.success("Added to meal planner!", {
      description: `${recipe.title} has been added to your meal planner.`,
    });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-5xl">
        {/* Back Button */}
        <Button asChild variant="outline" className="mb-6 rounded-full">
          <Link to="/recipes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Link>
        </Button>

        {/* Recipe Header */}
        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          <div className="aspect-video rounded-3xl overflow-hidden shadow-xl">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {recipe.category}
                </Badge>
                <Badge className="rounded-full px-3 py-1">
                  {recipe.ageGroup}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">{recipe.title}</h1>
              <p className="text-lg text-muted-foreground">{recipe.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{recipe.prepTime}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span className="font-medium">{recipe.servings}</span>
              </div>
            </div>

            <Button onClick={handleAddToPlanner} size="lg" className="w-full rounded-full">
              <Calendar className="mr-2 h-5 w-5" />
              Add to Meal Planner
            </Button>
          </div>
        </div>

        {/* Ingredients */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary mt-2 mr-3 flex-shrink-0" />
                  <span className="text-lg">{ingredient}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </span>
                  <span className="text-lg pt-1">{instruction}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Nutrition Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Nutrition Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Calories</div>
                <div className="text-2xl font-bold">{recipe.nutrition.calories}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Protein</div>
                <div className="text-2xl font-bold">{recipe.nutrition.protein}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Carbs</div>
                <div className="text-2xl font-bold">{recipe.nutrition.carbs}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Fat</div>
                <div className="text-2xl font-bold">{recipe.nutrition.fat}</div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="text-sm text-muted-foreground mb-1">Fiber</div>
                <div className="text-2xl font-bold">{recipe.nutrition.fiber}</div>
              </div>
            </div>
            
            {recipe.nutrition.vitamins.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Key Vitamins & Minerals</div>
                <div className="flex flex-wrap gap-2">
                  {recipe.nutrition.vitamins.map((vitamin) => (
                    <Badge key={vitamin} variant="outline" className="rounded-full">
                      {vitamin}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allergens & Storage */}
        <div className="grid gap-6 md:grid-cols-2">
          {recipe.allergens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Allergen Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  This recipe contains the following common allergens:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recipe.allergens.map((allergen) => (
                    <Badge key={allergen} variant="destructive" className="rounded-full">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Refrigerator className="h-5 w-5" />
                Storage Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{recipe.storage}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
