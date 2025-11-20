import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, Utensils, User, CheckCircle } from "lucide-react";

interface ProgressExplanationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProgressExplanationDialog = ({ open, onOpenChange }: ProgressExplanationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            How Your Progress is Calculated
          </DialogTitle>
          <DialogDescription className="text-left pt-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Growth Tracking (25%)</p>
                  <p className="text-sm text-muted-foreground">Log at least one weight or height measurement</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Utensils className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Meal Logging (25%)</p>
                  <p className="text-sm text-muted-foreground">Record at least one meal for your baby</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Profile Complete (25%)</p>
                  <p className="text-sm text-muted-foreground">Fill in both mother's name and baby's name</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Daily Tasks (25%)</p>
                  <p className="text-sm text-muted-foreground">Complete daily feeding, hydration, or nap tasks</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground pt-2">
              Your progress updates in real-time as you engage with the app and track your baby's journey!
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressExplanationDialog;
