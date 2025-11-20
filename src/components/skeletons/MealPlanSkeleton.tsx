import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const MealPlanSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-7 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => (
          <div key={meal} className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export const MealPlanWeekSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 7 }).map((_, index) => (
        <MealPlanSkeleton key={index} />
      ))}
    </div>
  );
};
