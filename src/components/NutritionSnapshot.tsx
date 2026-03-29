interface NutritionSnapshotProps {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  confidence?: string;
  compact?: boolean;
}

const confidenceBadge: Record<string, string> = {
  high: 'bg-green-500/15 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  low: 'bg-muted text-muted-foreground',
};

export function NutritionSnapshot({ calories, protein, fat, carbs, confidence, compact }: NutritionSnapshotProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>🔥 {calories}</span>
        <span>P {protein}g</span>
        <span>F {fat}g</span>
        <span>C {carbs}g</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
      <div className="text-center">
        <p className="text-lg font-display font-bold text-foreground">{calories}</p>
        <p className="text-[10px] text-muted-foreground">kcal</p>
      </div>
      <div className="h-8 w-px bg-border" />
      <div className="flex gap-3">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{protein}g</p>
          <p className="text-[10px] text-muted-foreground">Protein</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{fat}g</p>
          <p className="text-[10px] text-muted-foreground">Fat</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{carbs}g</p>
          <p className="text-[10px] text-muted-foreground">Carbs</p>
        </div>
      </div>
      {confidence && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto ${confidenceBadge[confidence] || confidenceBadge.low}`}>
          {confidence}
        </span>
      )}
    </div>
  );
}
