import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
  Clipboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { storageManager } from '../storage/StorageManager';
import { usePlayer } from '../contexts/PlayerContext';
import { COLORS } from '../utils/constants';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const { refreshFavLists } = usePlayer();

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await storageManager.exportAllData();
      const fileName = `ZiyunPlayer_${new Date().toISOString().slice(0, 10)}.json`;
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, data, 'utf8');
      
      await Share.share({
        title: '导出歌单数据',
        url: `file://${filePath}`,
        message: '子云音播歌单备份',
      });
      
      Alert.alert('导出成功', '数据已准备好分享');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('导出失败', '请重试');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImport = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const content = await Clipboard.getString();
      if (content) {
        setImportText(content);
      } else {
        Alert.alert('剪贴板为空', '请先复制备份数据');
      }
    } catch (error) {
      Alert.alert('读取失败', '无法读取剪贴板');
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!importText.trim()) {
      Alert.alert('数据为空', '请粘贴备份数据');
      return;
    }

    setIsImporting(true);
    try {
      await storageManager.importData(importText);
      await refreshFavLists();
      setShowImportModal(false);
      setImportText('');
      Alert.alert('导入成功', '数据已恢复');
    } catch (error) {
      Alert.alert('导入失败', '数据格式无效，请确保粘贴完整的备份数据');
    } finally {
      setIsImporting(false);
    }
  }, [importText, refreshFavLists]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据管理</Text>
        
        <TouchableOpacity
          style={styles.item}
          onPress={handleExport}
          disabled={isExporting}
        >
          <Icon name="file-upload" size={24} color={COLORS.primary} />
          <Text style={styles.itemText}>导出歌单数据</Text>
          {isExporting && <ActivityIndicator size="small" color={COLORS.primary} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={handleImport}
          disabled={isImporting}
        >
          <Icon name="file-download" size={24} color={COLORS.primary} />
          <Text style={styles.itemText}>导入歌单数据</Text>
          {isImporting && <ActivityIndicator size="small" color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        
        <View style={styles.item}>
          <Icon name="info-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.itemText}>版本 1.0.2</Text>
        </View>

        <View style={styles.item}>
          <Icon name="code" size={24} color={COLORS.textSecondary} />
          <Text style={styles.itemText}>基于 Azusa-Player 开发</Text>
        </View>

        <View style={styles.item}>
          <Icon name="link" size={24} color={COLORS.textSecondary} />
          <Text style={styles.itemText}>GitHub: luckjokerwang/zy-player</Text>
        </View>

        <View style={styles.item}>
          <Icon name="developer-mode" size={24} color={COLORS.textSecondary} />
          <Text style={styles.itemText}>React Native + TypeScript</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>免责声明</Text>
        
        <View style={styles.item}>
          <Icon name="security" size={24} color={COLORS.textSecondary} />
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              • 本应用为第三方B站音频播放器
            </Text>
            <Text style={styles.disclaimerText}>
              • 仅用于个人学习和交流目的
            </Text>
            <Text style={styles.disclaimerText}>
              • 不涉及任何商业用途
            </Text>
            <Text style={styles.disclaimerText}>
              • 音频资源来自Bilibili公开API
            </Text>
            <Text style={styles.disclaimerText}>
              • 请尊重版权，合理使用
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>搜索帮助</Text>
        <Text style={styles.helpText}>• BVID: 视频的BV号 (如 BV1wr4y1v7TA)</Text>
        <Text style={styles.helpText}>• 收藏夹ID: 需公开访问 (如 1793186881)</Text>
        <Text style={styles.helpText}>• 合集: 完整URL</Text>
        <Text style={styles.helpText}>  - Collection: channel/collectiondetail?sid=xxx</Text>
        <Text style={styles.helpText}>  - Series: channel/seriesdetail?sid=xxx</Text>
      </View>

      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>导入歌单数据</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalHint}>
              请粘贴之前导出的JSON备份数据
            </Text>

            <TouchableOpacity 
              style={styles.pasteButton}
              onPress={handlePasteFromClipboard}
            >
              <Icon name="content-paste" size={20} color={COLORS.primary} />
              <Text style={styles.pasteButtonText}>从剪贴板粘贴</Text>
            </TouchableOpacity>

            <ScrollView style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={importText}
                onChangeText={setImportText}
                placeholder="在此粘贴备份数据..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleConfirmImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>确认导入</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    paddingTop: 20,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surfaceLight,
  },
  itemText: {
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  helpSection: {
    padding: 16,
    marginTop: 20,
  },
  helpTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  disclaimerContainer: {
    flex: 1,
    marginLeft: 16,
  },
  disclaimerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  modalHint: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  pasteButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    marginLeft: 8,
  },
  textInputContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    color: COLORS.text,
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen;
