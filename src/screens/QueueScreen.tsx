import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { usePlayer } from '../contexts/PlayerContext';
import { SongItem } from '../components/SongItem';
import { COLORS } from '../utils/constants';
import { Song } from '../utils/types';

export const QueueScreen: React.FC = () => {
  const navigation = useNavigation();
  const { playingList, currentSong, playSong } = usePlayer();

  const handlePlaySong = (song: Song) => {
    playSong(song);
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => (
    <SongItem
      song={item}
      onPlay={handlePlaySong}
      showIndex={index}
      isActive={currentSong?.id === item.id}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>播放队列</Text>
        <Text style={styles.count}>{playingList.length} 首</Text>
      </View>

      {playingList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="queue-music" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>播放队列为空</Text>
          <Text style={styles.emptyHint}>搜索并添加歌曲开始播放</Text>
        </View>
      ) : (
        <FlatList
          data={playingList}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  count: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  emptyHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 100,
  },
});

export default QueueScreen;
