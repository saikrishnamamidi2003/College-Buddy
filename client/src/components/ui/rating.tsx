import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: RatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleStarClick = (rating: number) => {
    if (interactive && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={cn("flex items-center space-x-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= value;
        
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => handleStarClick(starValue)}
            className={cn(
              "focus:outline-none",
              interactive && "hover:scale-110 transition-transform cursor-pointer",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
