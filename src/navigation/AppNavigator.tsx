import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { HomeScreen } from '../screens/HomeScreen';
import { FavScreen } from '../screens/FavScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { LyricScreen } from '../screens/LyricScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { COLORS } from '../utils/constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.surfaceLight,
  },
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          
          if (route.name === 'HomeTab') {
            iconName = 'search';
          } else if (route.name === 'FavTab') {
            iconName = 'library-music';
          } else if (route.name === 'SettingsTab') {
            iconName = 'settings';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceLight,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ tabBarLabel: '搜索' }}
      />
      <Tab.Screen 
        name="FavTab" 
        component={FavScreen}
        options={{ tabBarLabel: '歌单' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen}
        options={{ tabBarLabel: '设置' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="Player" 
          component={PlayerScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen 
          name="Lyric" 
          component={LyricScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
