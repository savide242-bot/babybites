import { useState, useMemo, useRef } from "react";
import { Recipe } from "@/data/recipes";
import { useAppRecipes } from "@/hooks/useAppRecipes";
import {
  RecipeModification,
  saveRecipeToStaging,
  discardStagedModification,
  deployAllStagedToProduction,
  uploadRecipeImage,
  reviewRecipeWithAI,
} from "@/services/adminRecipeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Sparkles,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  RotateCcw,
  Clock,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

const AGE_GROUPS = [
  "6-8 months",
  "9-11 months",
  "12-23 months",
  "24+ months",
];

const CATEGORIES = [
  "Breakfast",
  "Lunch & Dinner",
  "Snack",
  "Dessert & Compotes",
  "Puree",
  "Finger Food",
];

export const RecipeManagement = () => {
  const { recipes, stagedCount, stagedMods, publishedMods, refresh } = useAppRecipes();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAge, setSelectedAge] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "staged" | "modified">("all");

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiReviewing, setIsAiReviewing] = useState(false);

  // Editing form draft
  const [isNewRecipe, setIsNewRecipe] = useState(false);
  const [currentRecipeId, setCurrentRecipeId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageGroup, setAgeGroup] = useState("6-8 months");
  const [category, setCategory] = useState("Lunch & Dinner");
  const [prepTime, setPrepTime] = useState("15 min");
  const [servings, setServings] = useState("2 servings");
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentStoragePath, setCurrentStoragePath] = useState<string | undefined>(undefined);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [instructions, setInstructions] = useState<string[]>([""]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered recipes list
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some((ing) => ing.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAge =
        selectedAge === "all" ||
        r.ageGroup.toLowerCase().includes(selectedAge.toLowerCase().replace(" months", ""));

      const isStaged = !!stagedMods[r.id];
      const isPublishedMod = !!publishedMods[r.id];

      if (selectedStatus === "staged") return matchesSearch && matchesAge && isStaged;
      if (selectedStatus === "modified") return matchesSearch && matchesAge && (isStaged || isPublishedMod);

      return matchesSearch && matchesAge;
    });
  }, [recipes, searchQuery, selectedAge, selectedStatus, stagedMods, publishedMods]);

  // Open Editor for an existing recipe
  const handleOpenEdit = (recipe: Recipe) => {
    const staged = stagedMods[recipe.id];
    const mod = staged || publishedMods[recipe.id];

    setIsNewRecipe(false);
    setCurrentRecipeId(recipe.id);
    setTitle(mod?.title || recipe.title);
    setDescription(mod?.description || recipe.description);
    setAgeGroup(mod?.ageGroup || recipe.ageGroup || "6-8 months");
    setCategory(mod?.category || recipe.category || "Lunch & Dinner");
    setPrepTime(mod?.prepTime || recipe.prepTime || "15 min");
    setServings(mod?.servings || recipe.servings || "2 servings");
    setImagePreview(mod?.image || recipe.image);
    setImageFile(null);
    setCurrentStoragePath(mod?.storageImagePath);
    setIngredients(
      mod?.ingredients && mod.ingredients.length > 0 ? [...mod.ingredients] : [...recipe.ingredients]
    );
    setInstructions(
      mod?.instructions && mod.instructions.length > 0 ? [...mod.instructions] : [...recipe.instructions]
    );
    setIsEditorOpen(true);
  };

  // Open Editor for a brand new recipe
  const handleOpenNew = () => {
    const newId = `custom-${Date.now()}`;
    setIsNewRecipe(true);
    setCurrentRecipeId(newId);
    setTitle("");
    setDescription("");
    setAgeGroup("6-8 months");
    setCategory("Lunch & Dinner");
    setPrepTime("15 min");
    setServings("2 servings");
    setImagePreview("");
    setImageFile(null);
    setCurrentStoragePath(undefined);
    setIngredients([""]);
    setInstructions([""]);
    setIsEditorOpen(true);
  };

  // Handle local image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (PNG, JPG, or WebP)");
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  // Ingredients helpers
  const handleAddIngredient = () => setIngredients([...ingredients, ""]);
  const handleIngredientChange = (idx: number, val: string) => {
    const updated = [...ingredients];
    updated[idx] = val;
    setIngredients(updated);
  };
  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  // Instructions helpers
  const handleAddInstruction = () => setInstructions([...instructions, ""]);
  const handleInstructionChange = (idx: number, val: string) => {
    const updated = [...instructions];
    updated[idx] = val;
    setInstructions(updated);
  };
  const handleRemoveInstruction = (idx: number) => {
    setInstructions(instructions.filter((_, i) => i !== idx));
  };

  // AI Assistant Action
  const handleRunAiReview = async () => {
    if (!title.trim()) {
      toast.error("Please enter a recipe title before running AI review.");
      return;
    }
    setIsAiReviewing(true);
    try {
      const reviewed = await reviewRecipeWithAI({
        title,
        description,
        ageGroup,
        ingredients,
        instructions,
      });

      setTitle(reviewed.title);
      setDescription(reviewed.description);
      if (reviewed.ingredients.length > 0) setIngredients(reviewed.ingredients);
      if (reviewed.instructions.length > 0) setInstructions(reviewed.instructions);

      toast.success("AI review complete! Formatted and checked for pediatric safety.", {
        description: reviewed.pediatricSafetyNotes,
      });
    } catch (err: any) {
      toast.error("AI review encountered an error: " + (err.message || "Try again"));
    } finally {
      setIsAiReviewing(false);
    }
  };

  // Save recipe draft into Staging
  const handleSaveRecipe = async (deployNow = false) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!imagePreview && !imageFile) {
      toast.error("A recipe cover image is required");
      return;
    }

    const filteredIngredients = ingredients.map((i) => i.trim()).filter(Boolean);
    const filteredInstructions = instructions.map((i) => i.trim()).filter(Boolean);

    if (filteredIngredients.length === 0) {
      toast.error("Please provide at least one ingredient");
      return;
    }
    if (filteredInstructions.length === 0) {
      toast.error("Please provide at least one preparation step");
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = imagePreview;
      let newStoragePath = currentStoragePath;

      // If user uploaded a new image file, convert to WebP and upload to Supabase Storage
      if (imageFile) {
        toast.info("Compressing to WebP and uploading to storage...");
        const uploadResult = await uploadRecipeImage(imageFile, currentRecipeId, currentStoragePath);
        finalImageUrl = uploadResult.publicUrl;
        newStoragePath = uploadResult.storagePath;
      }

      const mod: RecipeModification = {
        id: currentRecipeId,
        title: title.trim(),
        description: description.trim(),
        ageGroup,
        category,
        prepTime,
        servings,
        image: finalImageUrl,
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
        isNew: isNewRecipe,
        isStaged: true,
        updatedAt: new Date().toISOString(),
        storageImagePath: newStoragePath,
      };

      await saveRecipeToStaging(mod);

      if (deployNow) {
        await deployAllStagedToProduction();
        toast.success("Recipe saved and deployed to all users successfully!");
      } else {
        toast.success("Recipe saved to Staging!", {
          description: "Active and previewable in Admin mode. Click 'Deploy' when ready to release to all users.",
        });
      }

      setIsEditorOpen(false);
      refresh();
    } catch (err: any) {
      toast.error("Failed to save recipe: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  // Discard a single staged change
  const handleDiscardStaged = async (id: string) => {
    if (window.confirm("Discard staged changes for this recipe?")) {
      await discardStagedModification(id);
      toast.info("Staged changes discarded.");
      refresh();
    }
  };

  // Deploy all staged changes
  const handleDeployAll = async () => {
    setIsDeploying(true);
    try {
      const res = await deployAllStagedToProduction();
      toast.success(`Successfully deployed ${res.count} recipes to production!`, {
        description: "All parents and users will now see these updated recipes.",
      });
      setIsDeployDialogOpen(false);
      refresh();
    } catch (err: any) {
      toast.error("Deploy failed: " + (err.message || "Check network"));
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Deploy Queue Notice */}
      {stagedCount > 0 ? (
        <Card className="border-amber-300 bg-amber-50/80 dark:bg-amber-950/30">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-200">
                  {stagedCount} Recipe Changes in Staging
                </h3>
                <p className="text-sm text-amber-750 dark:text-amber-300">
                  These modifications are currently visible <strong>only to admins</strong> for live preview. They will not appear for general users until deployed.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsDeployDialogOpen(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md w-full sm:w-auto"
            >
              <Rocket className="h-4 w-4" />
              Deploy All Changes to Production
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>All recipes are in sync with production. Zero pending staged changes.</span>
        </div>
      )}

      {/* Main Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recipe Management</h2>
          <p className="text-sm text-muted-foreground">
            Search, edit, replace photos with automatic storage cleanup, and review with pediatric AI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenNew} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add New Recipe
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipe title or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="sm:col-span-3">
          <Select value={selectedAge} onValueChange={setSelectedAge}>
            <SelectTrigger>
              <SelectValue placeholder="Age Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">👶 All Age Groups</SelectItem>
              {AGE_GROUPS.map((ag) => (
                <SelectItem key={ag} value={ag}>
                  {ag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-3">
          <Select
            value={selectedStatus}
            onValueChange={(val: any) => setSelectedStatus(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌟 All ({recipes.length})</SelectItem>
              <SelectItem value="staged">⚡ In Staging ({stagedCount})</SelectItem>
              <SelectItem value="modified">
                ✏️ Modified ({Object.keys(publishedMods).length + stagedCount})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => {
          const isStaged = !!stagedMods[recipe.id];
          const isPublishedMod = !!publishedMods[recipe.id];

          return (
            <Card
              key={recipe.id}
              className={`overflow-hidden flex flex-col justify-between transition-all hover:shadow-md ${
                isStaged ? "border-amber-400 ring-1 ring-amber-400/40 bg-amber-50/20" : ""
              }`}
            >
              <div>
                <div className="aspect-[16/10] relative bg-muted overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="backdrop-blur-md bg-white/90 text-foreground text-xs">
                      {recipe.ageGroup}
                    </Badge>
                    {isStaged && (
                      <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Staged (Admin Only)
                      </Badge>
                    )}
                    {isPublishedMod && !isStaged && (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs">
                        Custom/Edited
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="outline" className="bg-black/60 text-white border-0 text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {recipe.prepTime}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base line-clamp-1">{recipe.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {recipe.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                  <p className="line-clamp-1">
                    <strong>Ingredients:</strong> {recipe.ingredients.slice(0, 3).join(", ")}
                    {recipe.ingredients.length > 3 ? "..." : ""}
                  </p>
                </CardContent>
              </div>

              <div className="p-4 pt-2 border-t flex items-center justify-between gap-2 bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(recipe)}
                  className="gap-1 flex-1 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Recipe & Image
                </Button>
                {isStaged && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDiscardStaged(recipe.id)}
                    className="text-amber-700 hover:text-red-700 text-xs"
                    title="Discard staged changes"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
          <p className="text-muted-foreground">No recipes match the search criteria.</p>
        </div>
      )}

      {/* EDIT / CREATE RECIPE MODAL */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewRecipe ? "Add New Recipe" : `Edit Recipe: ${title || "Untitled"}`}
            </DialogTitle>
            <DialogDescription>
              Update details, replace image (with automatic storage cleanup), and run pediatric AI review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Image Upload Area */}
            <div>
              <Label className="block mb-2 font-medium">Recipe Cover Image (Photo)</Label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-xl bg-muted/10">
                <div className="w-32 h-32 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative border shadow-sm">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-2 text-center text-xs">
                      <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {imagePreview ? "Replace Image" : "Upload Image"}
                    </Button>
                    {imageFile && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                        New file chosen ({Math.round(imageFile.size / 1024)} KB)
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uploads are automatically converted to fast, compressed <strong>WebP</strong>. When replacing an image, the previous file is permanently deleted from storage.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Review Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-primary/10 via-amber-50 to-emerald-50 dark:from-primary/10 dark:via-zinc-900 dark:to-zinc-900 border">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-4 w-4" />
                  Pediatric AI Recipe Reviewer
                </h4>
                <p className="text-xs text-muted-foreground">
                  Cleans formatting, checks choke safety for baby's age, and polishes steps.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunAiReview}
                disabled={isAiReviewing || !title.trim()}
                className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                {isAiReviewing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Reviewing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Review with AI
                  </>
                )}
              </Button>
            </div>

            {/* Title & Age Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="recipe-title">Recipe Title *</Label>
                <Input
                  id="recipe-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Creamy Avocado & Sweet Potato Mash"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="recipe-age">Age Bracket * (English)</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger id="recipe-age">
                    <SelectValue placeholder="Select age bracket" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((ag) => (
                      <SelectItem key={ag} value={ag}>
                        {ag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category & Times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prep Time</Label>
                <Input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="15 min" />
              </div>
              <div className="space-y-1.5">
                <Label>Servings</Label>
                <Input value={servings} onChange={(e) => setServings(e.target.value)} placeholder="2 baby bowls" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Warm comfort bowl rich in iron and healthy fats..."
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredients List *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddIngredient} className="gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Add Ingredient
                </Button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={ing}
                      onChange={(e) => handleIngredientChange(idx, e.target.value)}
                      placeholder={`e.g. 1/2 ripe avocado, mashed`}
                    />
                    {ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Steps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preparation Steps (Instructions) *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddInstruction} className="gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Add Step
                </Button>
              </div>
              <div className="space-y-2">
                {instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground pt-2.5 w-6 text-center">
                      {idx + 1}.
                    </span>
                    <Textarea
                      value={step}
                      onChange={(e) => handleInstructionChange(idx, e.target.value)}
                      rows={2}
                      placeholder={`Step ${idx + 1} instruction...`}
                      className="flex-1"
                    />
                    {instructions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveInstruction(idx)}
                        className="text-muted-foreground hover:text-red-600 mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsEditorOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveRecipe(false)}
              disabled={isSaving}
              className="gap-2 border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/20"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Save to Staging (Test in Admin)
            </Button>
            <Button
              type="button"
              onClick={() => handleSaveRecipe(true)}
              disabled={isSaving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              Save & Deploy Immediately
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DEPLOY CONFIRMATION MODAL */}
      <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-emerald-600" />
              Deploy Staged Changes to Production?
            </DialogTitle>
            <DialogDescription>
              You have <strong>{stagedCount}</strong> recipes edited or created in staging.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/40 rounded-lg text-sm space-y-1">
            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Recipes Ready to Deploy:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {Object.values(stagedMods).map((mod) => (
                <li key={mod.id}>
                  <strong>{mod.title}</strong> ({mod.ageGroup})
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Once deployed, these updates will immediately become visible to all parents and registered accounts in the app.
          </p>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDeployDialogOpen(false)} disabled={isDeploying}>
              Cancel
            </Button>
            <Button
              onClick={handleDeployAll}
              disabled={isDeploying}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Confirm & Deploy All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
