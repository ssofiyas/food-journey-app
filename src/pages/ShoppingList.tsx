import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, ShoppingCart, X, Sparkles, Loader2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AISuggestions } from '@/components/AISuggestions';
import { FridgeRaid } from '@/components/FridgeRaid';

interface ShoppingItem {
  name: string;
  quantity: string;
  checked: boolean;
  category: string;
}

interface ShoppingListData {
  id: string;
  name: string;
  items: ShoppingItem[];
  created_at: string;
}

type TabView = 'lists' | 'fridge-raid';

export default function ShoppingList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<ShoppingListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newListName, setNewListName] = useState('');
  const [activeView, setActiveView] = useState<TabView>('lists');
  const [generatingList, setGeneratingList] = useState(false);

  const fetchLists = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      const parsed = data.map((d: any) => ({ ...d, items: (d.items || []) as ShoppingItem[] }));
      setLists(parsed);
      if (!activeListId && parsed.length > 0) setActiveListId(parsed[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLists(); }, [user]);

  const activeList = lists.find(l => l.id === activeListId);

  const handleCreateList = async () => {
    if (!user) return;
    const name = newListName.trim() || 'Shopping List';
    const { data, error } = await supabase.from('shopping_lists').insert({ user_id: user.id, name, items: [] as any }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setNewListName('');
    fetchLists();
    if (data) setActiveListId((data as any).id);
  };

  const updateItems = async (items: ShoppingItem[]) => {
    if (!activeListId) return;
    await supabase.from('shopping_lists').update({ items: items as any }).eq('id', activeListId);
    setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items } : l));
  };

  const addItem = (name?: string, quantity?: string, category?: string) => {
    const itemName = name || newItemName.trim();
    if (!itemName || !activeList) return;
    const newItem: ShoppingItem = { name: itemName, quantity: quantity || '1', checked: false, category: category || 'General' };
    updateItems([...activeList.items, newItem]);
    if (!name) setNewItemName('');
  };

  const toggleItem = (index: number) => {
    if (!activeList) return;
    const updated = [...activeList.items];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    updateItems(updated);
  };

  const removeItem = (index: number) => {
    if (!activeList) return;
    updateItems(activeList.items.filter((_, i) => i !== index));
  };

  const deleteList = async (id: string) => {
    await supabase.from('shopping_lists').delete().eq('id', id);
    if (activeListId === id) setActiveListId(null);
    fetchLists();
  };

  const generateFromRecipes = async () => {
    if (!user) return;
    setGeneratingList(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Get user's recipes
      const { data: recipes } = await supabase.from('recipes').select('id, title').eq('user_id', user.id).limit(10);
      if (!recipes || recipes.length === 0) {
        toast({ title: 'No recipes', description: 'Add some recipes first to generate a shopping list', variant: 'destructive' });
        return;
      }

      // Get pantry items
      const { data: pantry } = await supabase.from('pantry_items').select('name').eq('user_id', user.id);
      const pantryNames = pantry?.map((p: any) => p.name) || [];

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-shopping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ recipe_ids: recipes.map(r => r.id), pantry_items: pantryNames }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Generation failed');
      }

      const result = await resp.json();

      // Create new list with AI-generated items
      const items: ShoppingItem[] = (result.items || []).map((item: any) => ({
        name: `${item.name} (${item.quantity})`,
        quantity: item.quantity,
        checked: false,
        category: item.category || 'Other',
      }));

      const { data: newList } = await supabase.from('shopping_lists').insert({
        user_id: user.id,
        name: `AI List - ${new Date().toLocaleDateString()}`,
        items: items as any,
      }).select().single();

      if (newList) {
        setActiveListId((newList as any).id);
        fetchLists();
        toast({
          title: 'Shopping list generated!',
          description: result.summary || `${items.length} items from ${recipes.length} recipes`,
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingList(false);
    }
  };

  const checkedCount = activeList?.items.filter(i => i.checked).length || 0;
  const totalCount = activeList?.items.length || 0;

  // Group items by category
  const uncheckedItems = activeList?.items.filter(i => !i.checked) || [];
  const checkedItems = activeList?.items.filter(i => i.checked) || [];
  const categories = [...new Set(uncheckedItems.map(i => i.category))].sort();

  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">Shopping</h1>
          <Button
            variant="hero"
            size="sm"
            className="rounded-full gap-1.5 text-xs"
            onClick={generateFromRecipes}
            disabled={generatingList}
          >
            {generatingList ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Generate from Recipes
          </Button>
        </div>
        <div className="flex">
          {(['lists', 'fridge-raid'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveView(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                activeView === tab ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {tab === 'lists' ? 'Shopping Lists' : '🧊 Fridge Raid'}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'fridge-raid' ? (
        <div className="px-4 py-4">
          <FridgeRaid />
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="flex flex-col">
          {/* List tabs */}
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 border-b border-border">
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeListId === list.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {list.name}
              </button>
            ))}
            <div className="flex items-center gap-1 shrink-0">
              <Input
                placeholder="New list..."
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateList()}
                className="h-8 w-32 text-sm rounded-full"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCreateList}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {activeList ? (
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{checkedCount}/{totalCount} items checked</p>
                <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => deleteList(activeList.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete list
                </Button>
              </div>

              {totalCount > 0 && (
                <div className="h-1.5 rounded-full bg-muted mb-4 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }} />
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add an item..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  className="rounded-full"
                />
                <Button variant="hero" size="icon" className="rounded-full shrink-0" onClick={() => addItem()} disabled={!newItemName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Suggestions */}
              <div className="mb-4">
                <AISuggestions onAddItem={(name, qty, cat) => addItem(name, qty, cat)} />
              </div>

              {/* Items grouped by category */}
              <div className="space-y-4">
                {categories.map(cat => {
                  const catItems = uncheckedItems.filter(i => i.category === cat);
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-3 w-3 text-primary" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</p>
                      </div>
                      <div className="space-y-0.5">
                        {catItems.map((item) => {
                          const realIdx = activeList.items.indexOf(item);
                          return (
                            <div key={realIdx} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group">
                              <button onClick={() => toggleItem(realIdx)} className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center shrink-0 hover:border-primary transition-colors" />
                              <span className="text-sm text-foreground flex-1">{item.name}</span>
                              <button onClick={() => removeItem(realIdx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Uncategorized */}
                {uncheckedItems.filter(i => !categories.includes(i.category)).length > 0 && (
                  <div className="space-y-0.5">
                    {uncheckedItems.filter(i => !categories.includes(i.category)).map((item) => {
                      const realIdx = activeList.items.indexOf(item);
                      return (
                        <div key={realIdx} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group">
                          <button onClick={() => toggleItem(realIdx)} className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center shrink-0 hover:border-primary transition-colors" />
                          <span className="text-sm text-foreground flex-1">{item.name}</span>
                          <button onClick={() => removeItem(realIdx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pantry / Checked */}
                {checkedCount > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground pt-3 pb-1 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Pantry / Completed ({checkedCount})
                    </p>
                    {checkedItems.map((item) => {
                      const realIdx = activeList.items.indexOf(item);
                      return (
                        <div key={realIdx} className="flex items-center gap-3 rounded-lg px-3 py-2 group opacity-50">
                          <button onClick={() => toggleItem(realIdx)} className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </button>
                          <span className="text-sm text-foreground flex-1 line-through">{item.name}</span>
                          <button onClick={() => removeItem(realIdx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-display font-semibold text-foreground">No shopping lists</p>
              <p className="text-sm text-muted-foreground mt-1">Create one or generate from your recipes!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
