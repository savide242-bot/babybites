import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Check, ChefHat, Trash2 } from "lucide-react";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

interface MealSlot {
  recipeId: string;
  prepared: boolean;
  dbId?: string;
}

interface MealPlan {
  [day: string]: {
    [mealType: string]: MealSlot;
  };
}

const MealPlanner = () => {
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      loadMealPlan(user.id);
    }
  };

  const loadMealPlan = async (uid: string) => {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', uid);

    if (error) {
      console.error('Error loading meal plan:', error);
      return;
    }

    if (data) {
      const plan: MealPlan = {};
      data.forEach((item) => {
        if (!plan[item.day_of_week]) {
          plan[item.day_of_week] = {};
        }
        plan[item.day_of_week][item.meal_type] = {
          recipeId: item.recipe_id,
          prepared: item.prepared || false,
          dbId: item.id,
        };
      });
      setMealPlan(plan);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !userId) return;

    const recipeId = result.draggableId;
    const [day, mealType] = result.destination.droppableId.split('-');

    // Check if slot already has a meal
    if (mealPlan[day]?.[mealType]) {
      toast.error("This slot already has a meal. Remove it first!");
      return;
    }

    // Add to meal plan
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        day_of_week: day,
        meal_type: mealType,
        recipe_id: recipeId,
        prepared: false,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add meal");
      console.error(error);
      return;
    }

    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: {
          recipeId,
          prepared: false,
          dbId: data.id,
        },
      },
    }));

    toast.success("Meal added! Shopping list updated automatically.");
    updateShoppingList();
  };

  const removeMeal = async (day: string, mealType: string) => {
    const slot = mealPlan[day]?.[mealType];
    if (!slot?.dbId) return;

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', slot.dbId);

    if (error) {
      toast.error("Failed to remove meal");
      return;
    }

    setMealPlan((prev) => {
      const newPlan = { ...prev };
      delete newPlan[day][mealType];
      return newPlan;
    });

    toast.info("Meal removed");
    updateShoppingList();
  };

  const togglePrepared = async (day: string, mealType: string) => {
    const slot = mealPlan[day]?.[mealType];
    if (!slot?.dbId) return;

    const newPrepared = !slot.prepared;

    const { error } = await supabase
      .from('meal_plans')
      .update({ prepared: newPrepared })
      .eq('id', slot.dbId);

    if (error) {
      toast.error("Failed to update meal status");
      return;
    }

    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: {
          ...slot,
          prepared: newPrepared,
        },
      },
    }));

    toast.success(newPrepared ? "Meal marked as prepared!" : "Meal marked as not prepared");
  };

  const updateShoppingList = async () => {
    if (!userId) return;

    // Get all ingredients from meal plan
    const allIngredients: { ingredient: string; fromRecipe: string }[] = [];
    
    Object.entries(mealPlan).forEach(([_, dayMeals]) => {
      Object.values(dayMeals).forEach((slot) => {
        const recipe = recipes.find((r) => r.id === slot.recipeId);
        if (recipe) {
          recipe.ingredients.forEach((ing) => {
            allIngredients.push({
              ingredient: ing,
              fromRecipe: recipe.title,
            });
          });
        }
      });
    });

    // Clear existing shopping list
    await supabase
      .from('shopping_list_items')
      .delete()
      .eq('user_id', userId);

    // Add new items
    if (allIngredients.length > 0) {
      const items = allIngredients.map((item) => ({
        user_id: userId,
        ingredient: item.ingredient,
        category: categorizeIngredient(item.ingredient),
        from_recipe: item.fromRecipe,
        checked: false,
      }));

      await supabase
        .from('shopping_list_items')
        .insert(items);
    }
  };

  const categorizeIngredient = (ingredient: string): string => {
    const lower = ingredient.toLowerCase();
    if (lower.includes("tomato") || lower.includes("carrot") || lower.includes("broccoli") || 
        lower.includes("spinach") || lower.includes("pepper") || lower.includes("onion")) {
      return "Vegetables";
    }
    if (lower.includes("banana") || lower.includes("apple") || lower.includes("pear") || 
        lower.includes("mango") || lower.includes("avocado")) {
      return "Fruits";
    }
    if (lower.includes("chicken") || lower.includes("beef") || lower.includes("fish") || 
        lower.includes("salmon") || lower.includes("egg") || lower.includes("turkey")) {
      return "Proteins";
    }
    if (lower.includes("rice") || lower.includes("pasta") || lower.includes("bread") || 
        lower.includes("oat") || lower.includes("quinoa")) {
      return "Cereals";
    }
    if (lower.includes("milk") || lower.includes("cheese") || lower.includes("yogurt")) {
      return "Dairy";
    }
    return "Others";
  };

  const getRecipe = (recipeId: string) => recipes.find((r) => r.id === recipeId);

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Weekly Meal Planner
          </h1>
          <p className="text-muted-foreground">Drag recipes to plan your week</p>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Recipe Sidebar */}
            <Card className="lg:col-span-1 h-fit sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Recipes
                </CardTitle>
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:ring-2 focus:ring-ring"
                />
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Droppable droppableId="recipes" isDropDisabled={true}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-4 space-y-2"
                      >
                        {filteredRecipes.map((recipe, index) => (
                          <Draggable
                            key={recipe.id}
                            draggableId={recipe.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 bg-card border rounded-lg cursor-move hover:shadow-md transition-all ${
                                  snapshot.isDragging ? "shadow-lg rotate-2 scale-105 border-primary" : ""
                                }`}
                              >
                                <p className="text-sm font-medium line-clamp-2">
                                  {recipe.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {recipe.prepTime}
                                </p>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Weekly Grid */}
            <div className="lg:col-span-3 space-y-4">
              {daysOfWeek.map((day, dayIndex) => (
                <Card key={day} className="animate-fade-in" style={{ animationDelay: `${dayIndex * 50}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{day}</CardTitle>
                      <Badge variant="outline">
                        {Object.values(mealPlan[day] || {}).filter(m => m.prepared).length}/
                        {Object.keys(mealPlan[day] || {}).length} prepared
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {mealTypes.map((mealType) => {
                        const slot = mealPlan[day]?.[mealType];
                        const recipe = slot ? getRecipe(slot.recipeId) : null;

                        return (
                          <Droppable
                            key={`${day}-${mealType}`}
                            droppableId={`${day}-${mealType}`}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`min-h-[120px] border-2 border-dashed rounded-lg p-3 transition-all ${
                                  snapshot.isDraggingOver
                                    ? "border-primary bg-primary/10 scale-105"
                                    : "border-border"
                                } ${slot ? "bg-muted/50" : ""}`}
                              >
                                <p className="text-xs font-semibold text-muted-foreground mb-2 capitalize">
                                  {mealType}
                                </p>

                                {recipe ? (
                                  <div className={`space-y-2 ${slot.prepared ? "opacity-60" : ""}`}>
                                    <p className="text-sm font-medium line-clamp-2">
                                      {recipe.title}
                                    </p>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant={slot.prepared ? "default" : "outline"}
                                        className="h-7 text-xs flex-1"
                                        onClick={() => togglePrepared(day, mealType)}
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        {slot.prepared ? "Done" : "Mark"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => removeMeal(day, mealType)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                    Drop recipe here
                                  </div>
                                )}

                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DragDropContext>

        {/* Quick Actions */}
        <div className="fixed bottom-20 right-4 flex flex-col gap-2">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            onClick={() => window.location.href = "/shopping-list"}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Shopping List
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;
