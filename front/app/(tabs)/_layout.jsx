import { Tabs } from 'expo-router';
import React from 'react';
import { Text, StyleSheet, Platform, View } from 'react-native';
import { useFonts } from 'expo-font';

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    'MyCustomFont-Color': require('../../assets/fonts/Mona12Emoji.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        // 1. 탭 바 전체의 위치와 너비 설정
        tabBarStyle: styles.tabBar,
        // 2. 개별 아이템(버튼)이 차지하는 영역 설정 (수직 중앙 정렬의 핵심)
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: () => <Text style={styles.emoji}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="cube"
        options={{
          tabBarIcon: () => <Text style={styles.emoji}>🎲</Text>,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          tabBarIcon: () => <Text style={styles.emoji}>✨</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 30,
    marginRight: '7%',
    marginLeft: '7%',
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3ebf2',
    borderTopWidth: 0,

    flexDirection: 'row', 
    paddingBottom: 0, 
    
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  tabItem: {
    padding: 10,        
  },

  emoji: {
    fontSize: 28,
    fontFamily: 'MyCustomFont-Color',
    includeFontPadding: false,
    // textAlign: 'center',
  },
});