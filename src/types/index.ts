export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number;
  cook_time: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string | null;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface MealPlan {
  id: string;
  week: number;
  year: number;
  user_id: string;
  days: Record<string, { breakfast?: string; lunch?: string; dinner?: string }>;
  created_at: string;
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  category: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  user_id: string;
  items: ShoppingListItem[];
  week: number | null;
  year: number | null;
  created_at: string;
}
