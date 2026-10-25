import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FoodDiaryEntry } from "@/components/food-diary/FoodDiaryEntry";
import { FoodDiaryList } from "@/components/food-diary/FoodDiaryList";
import { BookOpen, Plus } from "lucide-react";

const FoodDiary = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewEntry = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 lg:pb-8 w-full max-w-full overflow-x-hidden min-w-0">
      <div className="container max-w-2xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Food Diary</h1>
              <p className="text-sm text-muted-foreground">
                Track which foods your baby loves or rejects
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="add" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="add" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Plus className="w-4 h-4" />
              Add Entry
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BookOpen className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <FoodDiaryEntry onSuccess={handleNewEntry} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <FoodDiaryList refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default FoodDiary;
