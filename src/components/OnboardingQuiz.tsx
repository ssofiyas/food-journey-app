import { useState } from 'react';
import { Check, ArrowRight, Sparkles, Target, Leaf, Heart, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ageRanges = ['16-24', '25-34', '35-44', '45-54', '55+'];

const goals = [
  { id: 'weight_loss', label: 'Weight Loss', icon: Target, color: 'from-pink-100 to-pink-50 border-pink-200' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: Sparkles, color: 'from-lilac/20 to-lilac/5 border-lilac/30' },
  { id: 'maintenance', label: 'Maintenance', icon: Heart, color: 'from-lime/20 to-lime/5 border-lime/30' },
  { id: 'eat_healthier', label: 'Eat Healthier', icon: Leaf, color: 'from-lime/30 to-lime/10 border-lime/40' },
  { id: 'explore_cuisines', label: 'Explore Cuisines', icon: Globe, color: 'from-pink-50 to-lilac/10 border-pink-200' },
];

const foodPreferences = [
  'Mediterranean', 'Asian', 'Italian', 'Mexican', 'Indian',
  'Japanese', 'Thai', 'American', 'Middle Eastern', 'Nordic',
];

const dietaryRestrictions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto',
  'Paleo', 'Halal', 'Kosher', 'Low-Carb', 'Nut-Free',
];

interface OnboardingQuizProps {
  onComplete: () => void;
}

export function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [ageRange, setAgeRange] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleItem = (
    item: string,
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(selected.includes(item) ? selected.filter(i => i !== item) : [...selected, item]);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('user_onboarding' as any).upsert({
        user_id: user.id,
        age_range: ageRange,
        goals: selectedGoals,
        food_preferences: selectedPrefs,
        dietary_restrictions: selectedDietary,
        onboarding_completed: true,
      } as any, { onConflict: 'user_id' });
      if (error) throw error;
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    // Step 0: Age Range
    <div key="age" className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">What's your age range?</h2>
        <p className="text-sm text-muted-foreground mt-1">This helps us tailor recipe difficulty</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {ageRanges.map(range => (
          <button
            key={range}
            onClick={() => setAgeRange(range)}
            className={`rounded-2xl border-2 px-6 py-4 text-left font-display font-semibold transition-all ${
              ageRange === range
                ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                : 'border-border bg-card text-foreground hover:border-primary/30'
            }`}
          >
            {range}
            {ageRange === range && <Check className="inline h-4 w-4 ml-2" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 1: Goals
    <div key="goals" className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">What are your goals?</h2>
        <p className="text-sm text-muted-foreground mt-1">Select all that apply</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {goals.map(goal => {
          const selected = selectedGoals.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggleItem(goal.id, selectedGoals, setSelectedGoals)}
              className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-all ${
                selected
                  ? 'border-primary bg-primary/10 scale-[1.02]'
                  : `border-border bg-gradient-to-r ${goal.color} hover:border-primary/30`
              }`}
            >
              <goal.icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-display font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{goal.label}</span>
              {selected && <Check className="h-4 w-4 text-primary ml-auto" />}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 2: Food Preferences
    <div key="prefs" className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">Food preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">What cuisines do you enjoy?</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {foodPreferences.map(pref => {
          const selected = selectedPrefs.includes(pref);
          return (
            <button
              key={pref}
              onClick={() => toggleItem(pref, selectedPrefs, setSelectedPrefs)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                selected
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-card border border-border text-foreground hover:border-primary/30'
              }`}
            >
              {pref}
            </button>
          );
        })}
      </div>
    </div>,

    // Step 3: Dietary Restrictions
    <div key="dietary" className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">Dietary restrictions</h2>
        <p className="text-sm text-muted-foreground mt-1">We'll filter recipes for you</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {dietaryRestrictions.map(diet => {
          const selected = selectedDietary.includes(diet);
          return (
            <button
              key={diet}
              onClick={() => toggleItem(diet, selectedDietary, setSelectedDietary)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                selected
                  ? 'bg-accent text-accent-foreground shadow-md scale-105'
                  : 'bg-card border border-border text-foreground hover:border-accent/30'
              }`}
            >
              {diet}
            </button>
          );
        })}
      </div>
    </div>,
  ];

  const canProceed = step === 0 ? ageRange !== '' : true;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {steps[step]}

        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <Button variant="ghost" onClick={onComplete}>Skip</Button>
          )}

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className="rounded-full px-8"
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="rounded-full px-8"
            >
              {saving ? 'Saving...' : 'Finish'} <Sparkles className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
