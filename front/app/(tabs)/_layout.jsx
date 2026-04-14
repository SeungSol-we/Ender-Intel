import { Tabs } from 'expo-router';
import React from 'react';
import { Text, StyleSheet, Platform, View, Image } from 'react-native';
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
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarBackground: () => (
          <Image 
            source={require('../../assets/images/tab.png')} 
            style={{width: '100%', height: '100%'}}
            resizeMode="stretch" 
          />
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.emoji, focused ? styles.emojiFocused : styles.emojiUnfocused]}>
              🏠
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cube"
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.emoji, focused ? styles.emojiFocused : styles.emojiUnfocused]}>
              🎲
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.emoji, focused ? styles.emojiFocused : styles.emojiUnfocused]}>
              ✨
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 30,
    marginHorizontal: '7%', // marginRight/Left 대신 사용 가능
    height: 80,
    borderTopWidth: 0,
    shadowColor: '#ffffff00',
    overflow: 'hidden',
  },

  tabItem: {
    padding: 18,
  },

  emoji: {
    fontSize: 28,
    fontFamily: 'MyCustomFont-Color',
    includeFontPadding: false,
    color: '#000000',
  },

  emojiFocused: {
    opacity: 1,
  },

  emojiUnfocused: {
    opacity: 0.5, 
  },
});