import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Song, FavList } from '../utils/types';
import { storageManager } from '../storage/StorageManager';

export interface FavoritesContextType {
  favLists: FavList[];

  addFavList: (name: string) => Promise<FavList>;
  deleteFavList: (id: string) => Promise<void>;
  updateFavList: (favList: FavList) => Promise<void>;
  addSongToFavList: (favListId: string, song: Song) => Promise<void>;
  removeSongFromFavList: (favListId: string, songId: string) => Promise<void>;
  refreshFavLists: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [favLists, setFavLists] = useState<FavList[]>([]);

  useEffect(() => {
    initializeFavorites();
  }, []);

  const initializeFavorites = async () => {
    try {
      const lists = await storageManager.initFavLists();
      setFavLists(lists);
    } catch (err) {
      console.error('Error initializing favorites:', err);
    }
  };

  const addFavList = useCallback(async (name: string) => {
    const newList = await storageManager.addFavList(name);
    setFavLists(prev => [...prev, newList]);
    return newList;
  }, []);

  const deleteFavList = useCallback(async (id: string) => {
    await storageManager.deleteFavList(id);
    setFavLists(prev => prev.filter(list => list.info.id !== id));
  }, []);

  const updateFavList = useCallback(async (favList: FavList) => {
    await storageManager.updateFavList(favList);
    setFavLists(prev =>
      prev.map(list => (list.info.id === favList.info.id ? favList : list)),
    );
  }, []);

  const addSongToFavList = useCallback(
    async (favListId: string, song: Song) => {
      await storageManager.addSongToFavList(favListId, song);
      setFavLists(prev =>
        prev.map(list => {
          if (
            list.info.id === favListId &&
            !list.songList.some(s => s.id === song.id)
          ) {
            return { ...list, songList: [song, ...list.songList] };
          }
          return list;
        }),
      );
    },
    [],
  );

  const removeSongFromFavList = useCallback(
    async (favListId: string, songId: string) => {
      await storageManager.removeSongFromFavList(favListId, songId);
      setFavLists(prev =>
        prev.map(list => {
          if (list.info.id === favListId) {
            return {
              ...list,
              songList: list.songList.filter(s => s.id !== songId),
            };
          }
          return list;
        }),
      );
    },
    [],
  );

  const refreshFavLists = useCallback(async () => {
    const lists = await storageManager.initFavLists();
    setFavLists(lists);
  }, []);

  const value: FavoritesContextType = {
    favLists,
    addFavList,
    deleteFavList,
    updateFavList,
    addSongToFavList,
    removeSongFromFavList,
    refreshFavLists,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
