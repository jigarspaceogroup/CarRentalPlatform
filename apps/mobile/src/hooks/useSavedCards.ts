import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { SavedCard } from '../types/booking';

interface UseSavedCardsReturn {
  cards: SavedCard[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSavedCards(): UseSavedCardsReturn {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/saved-cards');
      const list: SavedCard[] = data.data ?? data ?? [];
      setCards(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load saved cards';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return { cards, isLoading, error, refetch: fetchCards };
}
