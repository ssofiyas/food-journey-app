import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Explore() {
  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes, users, and more..."
            className="rounded-full pl-10 bg-muted border-0 focus-visible:ring-primary"
          />
        </div>
      </div>
      <div className="py-16 text-center">
        <p className="text-lg font-display font-semibold text-foreground">Explore</p>
        <p className="text-sm text-muted-foreground mt-1">Discover trending recipes and food content</p>
      </div>
    </div>
  );
}
