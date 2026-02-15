import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  TextInput,
  Modal,
  ScrollView,
  Clipboard,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { pick } from '@react-native-documents/picker';
import { storageManager } from '../storage/StorageManager';
import { usePlayer } from '../contexts/PlayerContext';
import { COLORS } from '../utils/constants';

const APP_VERSION = require('../../package.json').version;

interface SettingsScreenProps {
  _navigation?: any;
}

const AZUSA_PLAYER_URL = 'https://github.com/kenmingwang/azusa-player';
const PROJECT_URL = 'https://github.com/luckjokerwang/zy-player';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  _navigation,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const { refreshFavLists } = usePlayer();

  const handleExportShare = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await storageManager.exportAllData();
      const fileName = `ZiyunPlayer_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, data, 'utf8');

      await Share.share({
        title: '导出歌单数据',
        url: `file://${filePath}`,
        message: data,
      });
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('导出失败', '请重试');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleExportClipboard = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await storageManager.exportAllData();
      Clipboard.setString(data);
      Alert.alert('复制成功', '歌单数据已复制到剪贴板');
    } catch (error) {
      console.error('Export clipboard error:', error);
      Alert.alert('复制失败', '请重试');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    Alert.alert('导出歌单数据', '请选择导出方式', [
      { text: '复制到剪贴板', onPress: handleExportClipboard },
      { text: '分享为JSON文件', onPress: handleExportShare },
      { text: '取消', style: 'cancel' },
    ]);
  }, [handleExportClipboard, handleExportShare]);

  const handleImportFromFile = useCallback(async () => {
    try {
      const [file] = await pick({
        type: ['application/json', '.json'],
        allowMultiSelection: false,
      });

      if (file) {
        const fileContent = await RNFS.readFile(file.uri, 'utf8');
        setIsImporting(true);

        try {
          await storageManager.importData(fileContent);
          refreshFavLists();
          Alert.alert('导入成功', '歌单数据已成功导入并合并到现有歌单');
        } catch {
          Alert.alert('导入失败', '文件格式错误或数据无效');
        } finally {
          setIsImporting(false);
        }
      }
    } catch (error) {
      if ((error as any)?.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('选择失败', '无法选择文件');
      }
    }
  }, [refreshFavLists]);

  const handleImport = useCallback(() => {
    Alert.alert(
      '导入歌单数据',
      '请选择导入方式\n(导入会合并到现有歌单，不会覆盖)',
      [
        {
          text: '粘贴导入',
          onPress: () => setShowImportModal(true),
        },
        {
          text: 'JSON文件导入',
          onPress: handleImportFromFile,
        },
        { text: '取消', style: 'cancel' },
      ],
    );
  }, [handleImportFromFile]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const content = await Clipboard.getString();
      if (content) {
        setImportText(content);
      } else {
        Alert.alert('剪贴板为空', '请先复制备份数据');
      }
    } catch {
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
      JSON.parse(importText);
      await storageManager.importData(importText);
      await refreshFavLists();
      setShowImportModal(false);
      setImportText('');
      Alert.alert('导入成功', '歌单数据已合并导入');
    } catch {
      Alert.alert('导入失败', '数据格式无效，请确保粘贴完整的JSON备份数据');
    } finally {
      setIsImporting(false);
    }
  }, [importText, refreshFavLists]);

  const openUrl = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('打开失败', '无法打开链接');
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
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
            {isExporting && (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={handleImport}
            disabled={isImporting}
          >
            <Icon name="file-download" size={24} color={COLORS.primary} />
            <Text style={styles.itemText}>导入歌单数据</Text>
            {isImporting && (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>

          <View style={styles.item}>
            <Icon name="info-outline" size={24} color={COLORS.textSecondary} />
            <Text style={styles.itemText}>版本 {APP_VERSION}</Text>
          </View>

          <TouchableOpacity
            style={styles.item}
            onPress={() => openUrl(AZUSA_PLAYER_URL)}
          >
            <Icon name="code" size={24} color={COLORS.primary} />
            <Text style={styles.linkText}>基于 Azusa-Player 开发</Text>
            <Icon name="open-in-new" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() => openUrl(PROJECT_URL)}
          >
            <Icon name="link" size={24} color={COLORS.primary} />
            <Text style={styles.linkText}>GitHub: luckjokerwang/zy-player</Text>
            <Icon name="open-in-new" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.item}>
            <Icon name="gavel" size={24} color={COLORS.textSecondary} />
            <Text style={styles.itemText}>开源协议: MIT License</Text>
          </View>

          <View style={styles.item}>
            <Icon
              name="developer-mode"
              size={24}
              color={COLORS.textSecondary}
            />
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
              <Text style={styles.disclaimerText}>• 不涉及任何商业用途</Text>
              <Text style={styles.disclaimerText}>
                • 音频资源来自Bilibili公开API
              </Text>
              <Text style={styles.disclaimerText}>• 请尊重版权，合理使用</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>粘贴导入歌单</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>
              请粘贴之前导出的JSON备份数据（将合并到现有歌单）
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
  linkText: {
    color: COLORS.primary,
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
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
