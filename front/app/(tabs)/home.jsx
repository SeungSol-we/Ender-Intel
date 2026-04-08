import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';


import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
        <Image style={{width: '100%', height:'100%', zIndex:-10, position:'absolute'}} source={require('../../assets/images/background.png')}/>
        <Text>Hello!</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#ffe5ed'
  },
})