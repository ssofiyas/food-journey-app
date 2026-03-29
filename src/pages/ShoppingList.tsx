import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, ShoppingCart, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AISuggestions } from '@/components/AISuggestions';

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

export default function ShoppingList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<ShoppingListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newListName, setNewListName] = useState('');

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

  const checkedCount = activeList?.items.filter(i => i.checked).length || 0;
  const totalCount = activeList?.items.length || 0;

  return (
    <div className="flex-1 border-r border-border max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <h1 className="font-display text-xl font-bold text-foreground">Shopping Lists</h1>
      </div>

      {loading ? (
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
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {checkedCount}/{totalCount} items checked
                </p>
                <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => deleteList(activeList.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete list
                </Button>
              </div>

              {totalCount > 0 && (
                <div className="h-1.5 rounded-full bg-muted mb-4 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }} />
                </div>
              )}

              {/* Add item */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add an item..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                  className="rounded-full"
                />
                <Button variant="hero" size="icon" className="rounded-full shrink-0" onClick={addItem} disabled={!newItemName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {activeList.items.filter(i => !i.checked).map((item, idx) => {
                  const realIdx = activeList.items.indexOf(item);
                  return (
                    <div key={idx} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group">
                      <button onClick={() => toggleItem(realIdx)} className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center shrink-0 hover:border-primary transition-colors" />
                      <span className="text-sm text-foreground flex-1">{item.name}</span>
                      <button onClick={() => removeItem(realIdx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  );
                })}

                {checkedCount > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground pt-3 pb-1 font-medium">Completed</p>
                    {activeList.items.filter(i => i.checked).map((item, idx) => {
                      const realIdx = activeList.items.indexOf(item);
                      return (
                        <div key={idx} className="flex items-center gap-3 rounded-lg px-3 py-2 group opacity-50">
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
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-display font-semibold text-foreground">No shopping lists</p>
              <p className="text-sm text-muted-foreground mt-1">Create one to start tracking your groceries!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
