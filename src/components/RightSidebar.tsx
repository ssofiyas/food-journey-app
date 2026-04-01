import { Search, TrendingUp, Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';

const trendingTopics = [
  { tag: '#MealPrep', posts: '2.4K posts' },
  { tag: '#HealthyRecipes', posts: '1.8K posts' },
  { tag: '#QuickDinner', posts: '956 posts' },
  { tag: '#VeganFood', posts: '743 posts' },
  { tag: '#BudgetMeals', posts: '512 posts' },
];

const suggestedUsers = [
  { name: 'Chef Maria', handle: '@chefmaria', avatar: '👩‍🍳' },
  { name: 'Healthy Joe', handle: '@healthyjoe', avatar: '🧑‍🍳' },
  { name: 'Baking Queen', handle: '@bakingqueen', avatar: '👸' },
];

export function RightSidebar() {
  return (
    <aside className="hidden xl:flex xl:w-80 flex-col gap-4 p-4 sticky top-0 h-screen overflow-y-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search MealCraft"
          className="rounded-full pl-10 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary h-10"
        />
      </div>

      <div className="rounded-2xl bg-muted/50 p-4">
        <h3 className="font-display text-base font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-accent" /> Trending
        </h3>
        <div className="flex flex-col">
          {trendingTopics.map((topic) => (
            <div key={topic.tag} className="flex items-start justify-between cursor-pointer hover:bg-muted rounded-xl p-2.5 -mx-1 transition-colors">
              <div>
                <p className="font-semibold text-sm text-foreground">{topic.tag}</p>
                <p className="text-[11px] text-muted-foreground">{topic.posts}</p>
              </div>
              <TrendingUp className="h-3.5 w-3.5 text-primary mt-1" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-muted/50 p-4">
        <h3 className="font-display text-base font-bold text-foreground mb-3">Who to Follow</h3>
        <div className="flex flex-col gap-1">
          {suggestedUsers.map((u) => (
            <div key={u.handle} className="flex items-center gap-3 cursor-pointer hover:bg-muted rounded-xl p-2.5 -mx-1 transition-colors">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg">
                {u.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                <p className="text-[11px] text-muted-foreground">{u.handle}</p>
              </div>
              <button className="text-xs font-semibold text-primary-foreground bg-foreground rounded-full px-4 py-1.5 hover:opacity-80 transition-opacity">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground px-2">© {new Date().getFullYear()} MealCraft</p>
    </aside>
  );
}
