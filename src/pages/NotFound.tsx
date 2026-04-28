import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 text-7xl">🍼</div>
      <h1 className="mb-3 text-5xl font-bold text-foreground">404</h1>
      <p className="mb-2 text-xl font-semibold text-foreground">
        We couldn't find this page
      </p>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            Go to Home
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
