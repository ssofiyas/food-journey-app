import { Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

const trendingTopics = [
  { tag: '#MealPrep', posts: '2.4K posts' },
  { tag: '#HealthyRecipes', posts: '1.8K posts' },
  { tag: '#QuickDinner', posts: '956 posts' },
  { tag: '#VeganCooking', posts: '743 posts' },
  { tag: '#BudgetMeals', posts: '512 posts' },
];

const suggestedUsers = [
  { name: 'Chef Maria', handle: '@chefmaria', avatar: '👩‍🍳' },
  { name: 'Healthy Joe', handle: '@healthyjoe', avatar: '🧑‍🍳' },
  { name: 'Bake Queen', handle: '@bakequeen', avatar: '👸' },
];

export function RightSidebar() {
  return (
    <aside className="hidden xl:flex xl:w-80 flex-col gap-4 p-4 sticky top-0 h-screen overflow-y-auto">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search MealCraft"
          className="rounded-full pl-10 bg-muted border-0 focus-visible:ring-primary"
        />
      </div>

      {/* Trending */}
      <div className="rounded-2xl bg-muted/50 p-4">
        <h3 className="font-display text-lg font-bold text-foreground mb-3">Trending</h3>
        <div className="flex flex-col gap-3">
          {trendingTopics.map((topic) => (
            <div key={topic.tag} className="flex items-start justify-between cursor-pointer hover:bg-muted rounded-lg p-2 -mx-2 transition-colors">
              <div>
                <p className="font-semibold text-sm text-foreground">{topic.tag}</p>
                <p className="text-xs text-muted-foreground">{topic.posts}</p>
              </div>
              <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Who to follow */}
      <div className="rounded-2xl bg-muted/50 p-4">
        <h3 className="font-display text-lg font-bold text-foreground mb-3">Who to follow</h3>
        <div className="flex flex-col gap-3">
          {suggestedUsers.map((user) => (
            <div key={user.handle} className="flex items-center gap-3 cursor-pointer hover:bg-muted rounded-lg p-2 -mx-2 transition-colors">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.handle}</p>
              </div>
              <button className="text-xs font-semibold text-primary-foreground bg-primary rounded-full px-4 py-1.5 hover:opacity-90 transition-opacity">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground px-2">© {new Date().getFullYear()} MealCraft</p>
    </aside>
  );
}
