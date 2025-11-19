import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Filter, X } from "lucide-react";
import { DIETARY_OPTIONS, DietaryTag } from "@/hooks/useDietaryPreferences";

interface DietaryFilterSelectProps {
  selectedFilters: DietaryTag[];
  onFilterChange: (filters: DietaryTag[]) => void;
  userPreferences?: DietaryTag[];
}

export const DietaryFilterSelect = ({
  selectedFilters,
  onFilterChange,
  userPreferences = [],
}: DietaryFilterSelectProps) => {
  const toggleFilter = (filter: DietaryTag) => {
    if (selectedFilters.includes(filter)) {
      onFilterChange(selectedFilters.filter((f) => f !== filter));
    } else {
      onFilterChange([...selectedFilters, filter]);
    }
  };

  const clearFilters = () => {
    onFilterChange([]);
  };

  const applyUserPreferences = () => {
    onFilterChange(userPreferences);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={selectedFilters.length > 0 ? "default" : "outline"}
          className="rounded-full relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Dietary Filters
          {selectedFilters.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center"
            >
              {selectedFilters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Dietary Restrictions</h4>
            {selectedFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {userPreferences.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Your Saved Preferences
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={applyUserPreferences}
                    className="h-6 text-xs"
                  >
                    Apply
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {userPreferences.map((pref) => {
                    const option = DIETARY_OPTIONS.find((o) => o.value === pref);
                    return (
                      <Badge
                        key={pref}
                        variant="secondary"
                        className="text-xs rounded-full"
                      >
                        {option?.label}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {DIETARY_OPTIONS.map((option) => {
              const isSelected = selectedFilters.includes(option.value);
              const isUserPref = userPreferences.includes(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => toggleFilter(option.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${
                    isSelected
                      ? option.color + " border-2"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  {isUserPref && !isSelected && (
                    <Badge variant="outline" className="text-xs rounded-full">
                      Saved
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Select dietary restrictions to filter compatible recipes. Save your
            preferences in Settings.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
