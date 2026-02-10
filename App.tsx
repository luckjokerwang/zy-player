/**
 * 子云音播 - Bilibili Audio Player
 * React Native App Entry Point
 */

import React from 'react';
import { StatusBar, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PlayerProvider, usePlayer } from './src/contexts/PlayerContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/constants';

function AppContent() {
  const { isInitialized, error } = usePlayer();

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>初始化失败</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>正在初始化...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
          translucent={false}
        />
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default App;
