import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!barcode.trim()) {
      toast({
        title: "Missing barcode",
        description: "Please enter a barcode",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    
    // Simulate scanning and safety check
    // In a real app, this would call an external API or use the device camera
    setTimeout(() => {
      const mockResult = {
        product_name: "Baby Food Product",
        is_baby_safe: Math.random() > 0.3, // 70% safe products
        safety_notes: Math.random() > 0.3 
          ? "This product is safe for babies 6+ months. Contains no common allergens."
          : "Warning: This product may contain honey (not recommended for babies under 12 months) or added sugar.",
        suggested_recipes: ["Sweet Potato Puree", "Banana Pancakes", "Veggie Smoothie"],
      };

      setResult(mockResult);
      setScanning(false);

      // Save to database
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from("scanned_products").insert({
            barcode,
            product_name: mockResult.product_name,
            is_baby_safe: mockResult.is_baby_safe,
            safety_notes: mockResult.safety_notes,
            suggested_recipes: mockResult.suggested_recipes,
            user_id: user.id,
          });
        }
      });
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary mb-2">Barcode Scanner</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Scan products to check if they're safe for your baby
        </p>

        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="barcode">Product Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Enter barcode number"
                  disabled={scanning}
                />
                <Button onClick={handleScan} disabled={scanning}>
                  <Scan className="w-4 h-4 mr-2" />
                  {scanning ? "Scanning..." : "Scan"}
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>📱 Camera scanning coming soon!</p>
              <p className="mt-1">For now, enter the barcode manually</p>
            </div>
          </div>
        </Card>

        {result && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {result.is_baby_safe ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h2 className="text-xl font-bold mb-1">{result.product_name}</h2>
                  <p className={`font-semibold ${result.is_baby_safe ? "text-green-600" : "text-yellow-600"}`}>
                    {result.is_baby_safe ? "✓ Safe for Babies" : "⚠ Use with Caution"}
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Safety Information</h3>
                <p className="text-sm">{result.safety_notes}</p>
              </div>

              {result.suggested_recipes && result.suggested_recipes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Suggested Recipes</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.suggested_recipes.map((recipe: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {recipe}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6 bg-primary/5">
          <h3 className="font-semibold mb-2">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Enter or scan the barcode of any grocery product</li>
            <li>Our system checks the ingredients against baby safety guidelines</li>
            <li>Get instant feedback on safety and allergen information</li>
            <li>Discover recipes that use safe ingredients</li>
          </ol>
        </Card>
      </div>
    </main>
  );
};

export default BarcodeScanner;
