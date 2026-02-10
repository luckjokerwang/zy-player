import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePlayer } from '../contexts/PlayerContext';
import { FavList, Song } from '../utils/types';
import { SongItem } from './SongItem';
import { COLORS } from '../utils/constants';

export const FavListManager: React.FC = () => {
  const {
    favLists,
    addFavList,
    deleteFavList,
    removeSongFromFavList,
    playSong,
    addToQueue,
    playList,
    addSongToFavList,
  } = usePlayer();

  const [selectedList, setSelectedList] = useState<FavList | null>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAddToFavModal, setShowAddToFavModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState<Song | null>(null);

  const handleCreateList = async () => {
    if (newListName.trim()) {
      await addFavList(newListName.trim());
      setNewListName('');
      setShowNewListModal(false);
    }
  };

  const handleDeleteList = (list: FavList) => {
    Alert.alert(
      '删除歌单',
      `确定要删除"${list.info.title}"吗?`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            deleteFavList(list.info.id);
            if (selectedList?.info.id === list.info.id) {
              setSelectedList(null);
            }
          },
        },
      ],
    );
  };

  const handlePlayAll = (list: FavList) => {
    if (list.songList.length > 0) {
      playList(list.songList);
    }
  };

  const handleAddAllToQueue = (list: FavList) => {
    if (list.songList.length > 0) {
      addToQueue(list.songList);
    }
  };

  const handleDeleteSong = (song: Song) => {
    if (selectedList) {
      removeSongFromFavList(selectedList.info.id, song.id);
      setSelectedList({
        ...selectedList,
        songList: selectedList.songList.filter(s => s.id !== song.id),
      });
    }
  };

  const handleAddSongToFav = (song: Song) => {
    setSongToAdd(song);
    setShowAddToFavModal(true);
  };

  const confirmAddToFav = (targetListId: string) => {
    if (songToAdd) {
      addSongToFavList(targetListId, songToAdd);
      setShowAddToFavModal(false);
      setSongToAdd(null);
    }
  };

  const renderListItem = ({ item }: { item: FavList }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        selectedList?.info.id === item.info.id && styles.selectedListItem,
      ]}
      onPress={() => setSelectedList(item)}
    >
      <Icon name="album" size={32} color={COLORS.primary} />
      <View style={styles.listInfo}>
        <Text style={styles.listTitle} numberOfLines={1}>{item.info.title}</Text>
        <Text style={styles.listCount}>{item.songList.length} 首歌曲</Text>
      </View>
      <View style={styles.listActions}>
        <TouchableOpacity onPress={() => handlePlayAll(item)} style={styles.listActionBtn}>
          <Icon name="play-arrow" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleAddAllToQueue(item)} style={styles.listActionBtn}>
          <Icon name="playlist-add" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteList(item)} style={styles.listActionBtn}>
          <Icon name="delete-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的歌单</Text>
        <TouchableOpacity onPress={() => setShowNewListModal(true)} style={styles.addButton}>
          <Icon name="add" size={24} color={COLORS.primary} />
          <Text style={styles.addText}>新建</Text>
        </TouchableOpacity>
      </View>

      {selectedList ? (
        <View style={styles.selectedContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedList(null)}>
            <Icon name="arrow-back" size={24} color={COLORS.text} />
            <Text style={styles.backText}>{selectedList.info.title}</Text>
          </TouchableOpacity>
          
          <View style={styles.selectedActions}>
            <TouchableOpacity onPress={() => handlePlayAll(selectedList)} style={styles.actionBtn}>
              <Icon name="play-arrow" size={20} color={COLORS.primary} />
              <Text style={styles.actionText}>播放全部</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAddAllToQueue(selectedList)} style={styles.actionBtn}>
              <Icon name="playlist-add" size={20} color={COLORS.primary} />
              <Text style={styles.actionText}>添加全部</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={selectedList.songList}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <SongItem
                song={item}
                showIndex={index}
                onPlay={playSong}
                onAddToQueue={(song) => addToQueue([song])}
                onAddToFav={handleAddSongToFav}
                onDelete={handleDeleteSong}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.songListContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>歌单为空</Text>
            }
          />
        </View>
      ) : (
        <FlatList
          data={favLists}
          keyExtractor={(item) => item.info.id}
          renderItem={renderListItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>暂无歌单，点击新建创建</Text>
          }
        />
      )}

      <Modal visible={showNewListModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建歌单</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="输入歌单名称"
              placeholderTextColor={COLORS.textSecondary}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowNewListModal(false);
                  setNewListName('');
                }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !newListName.trim() && styles.disabledBtn]}
                onPress={handleCreateList}
                disabled={!newListName.trim()}
              >
                <Text style={styles.modalConfirmText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddToFavModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加到歌单</Text>
            <FlatList
              data={favLists}
              keyExtractor={(item) => item.info.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.favSelectItem}
                  onPress={() => confirmAddToFav(item.info.id)}
                >
                  <Icon name="album" size={24} color={COLORS.primary} />
                  <Text style={styles.favSelectText}>{item.info.title}</Text>
                </TouchableOpacity>
              )}
              style={styles.favSelectList}
            />
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowAddToFavModal(false);
                setSongToAdd(null);
              }}
            >
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 44,
  },
  addText: {
    color: COLORS.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surfaceLight,
  },
  selectedListItem: {
    backgroundColor: COLORS.surface,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  listCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  listActions: {
    flexDirection: 'row',
  },
  listActionBtn: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  selectedContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  backText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  selectedActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surfaceLight,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  songListContent: {
    paddingBottom: 100,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  modalConfirmBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  modalConfirmText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  favSelectList: {
    maxHeight: 300,
  },
  favSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surfaceLight,
  },
  favSelectText: {
    color: COLORS.text,
    fontSize: 15,
    marginLeft: 12,
  },
});

export default FavListManager;
