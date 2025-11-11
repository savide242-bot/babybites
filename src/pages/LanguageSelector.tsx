import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LanguageSelectorProps {
  onComplete: () => void;
}

const LanguageSelector = ({ onComplete }: LanguageSelectorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-2xl border-2 shadow-elegant">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
              Welcome to BabyBites
            </h1>
            <p className="text-muted-foreground text-lg">
              Your baby nutrition journey starts here
            </p>
          </div>

          <Button
            onClick={onComplete}
            className="w-full h-12 text-lg rounded-full shadow-glow"
            size="lg"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelector;
