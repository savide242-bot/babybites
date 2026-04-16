import { ShieldX } from "lucide-react";

interface BannedScreenProps {
  reason?: string | null;
}

const BannedScreen = ({ reason }: BannedScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Account Blocked</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          {reason || "Your account has been suspended. Please contact support for more information."}
        </p>
      </div>
    </div>
  );
};

export default BannedScreen;
