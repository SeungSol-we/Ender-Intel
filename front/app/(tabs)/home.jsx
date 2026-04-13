import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';


import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
        <Image style={{width: '100%', height:'100%', zIndex:-10, position:'absolute'}} source={require('../../assets/images/hell_back.jpg')}/>
        <Text style={{color:'#fff'}}>Hello! Here is Home Page</Text>
        <Text style={{color:'#fff'}}>figma 봤는데 이게 진짜 뭐지 싶어서...허허</Text>
        <Text style={{color:'#fff'}}>이게 홈 화면이 정녕 맞냐...</Text>
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