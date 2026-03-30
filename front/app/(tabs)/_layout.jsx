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
    height: 80,   //64
    // borderRadius: 32,
    // backgroundColor: '#f3ebf2',
    borderTopWidth: 0,
    
    shadowColor: '#ffffff00',

    overflow: 'hidden',
  },

  tabItem: {
    padding: 18, //10    
  },

  emoji: {
    fontSize: 28,  //28
    fontFamily: 'MyCustomFont-Color',
    includeFontPadding: false,
    // textAlign: 'center',
  },

});