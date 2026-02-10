import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Song } from '../utils/types';
import { parseSearchInput, SearchResult } from '../utils/searchParser';
import { usePlayer } from '../contexts/PlayerContext';
import { COLORS } from '../utils/constants';
import { SongItem } from './SongItem';

export const SearchBar: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const { setSearchList, playSong, addToQueue, addSongToFavList, favLists } = usePlayer();

  const handleSearch = async () => {
    if (!searchText.trim()) return;

    setIsLoading(true);
    try {
      const result = await parseSearchInput(searchText);
      setSearchResult(result);

      if (result.songs.length > 0) {
        setSearchList({
          info: { id: 'FavList-Search', title: result.title },
          songList: result.songs,
        });
      }

      if (result.error) {
        Alert.alert('搜索提示', result.error);
      }
    } catch (error) {
      Alert.alert('搜索失败', '请检查网络连接或输入格式');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    playSong(song);
  };

  const handleAddToQueue = (song: Song) => {
    addToQueue([song]);
  };

  const handleAddToFav = (song: Song) => {
    if (favLists.length === 0) {
      Alert.alert('提示', '请先创建一个歌单');
      return;
    }

    Alert.alert(
      '添加到歌单',
      '选择要添加到的歌单',
      favLists.map(fav => ({
        text: fav.info.title,
        onPress: () => addSongToFavList(fav.info.id, song),
      })).concat([{ text: '取消', style: 'cancel' } as any]),
    );
  };

  const handlePlayAll = () => {
    if (searchResult && searchResult.songs.length > 0) {
      addToQueue(searchResult.songs);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="BVid / 收藏夹ID / 合集URL"
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <Icon name="search" size={24} color={COLORS.text} />
          )}
        </TouchableOpacity>
      </View>

      {searchResult && (
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>
              {searchResult.title} ({searchResult.songs.length}首)
            </Text>
            {searchResult.songs.length > 0 && (
              <TouchableOpacity onPress={handlePlayAll} style={styles.playAllButton}>
                <Icon name="playlist-add" size={20} color={COLORS.primary} />
                <Text style={styles.playAllText}>全部添加</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={searchResult.songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SongItem
                song={item}
                onPlay={handlePlaySong}
                onAddToQueue={handleAddToQueue}
                onAddToFav={handleAddToFav}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {!searchResult && (
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>搜索帮助</Text>
          <Text style={styles.helpText}>• BVID: 视频的BV号 (如 BV1wr4y1v7TA)</Text>
          <Text style={styles.helpText}>• 收藏夹ID: 需公开 (如 1793186881)</Text>
          <Text style={styles.helpText}>• 合集: 完整URL</Text>
          <Text style={styles.helpText}>  - channel/collectiondetail?sid=xxx</Text>
          <Text style={styles.helpText}>  - channel/seriesdetail?sid=xxx</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 6,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  searchButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  resultTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 44,
  },
  playAllText: {
    color: COLORS.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  helpContainer: {
    padding: 24,
  },
  helpTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 24,
  },
});

export default SearchBar;
