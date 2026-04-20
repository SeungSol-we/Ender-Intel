import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';


import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
        <Text style={{color:'#fff'}}>Hello!!!</Text>
        <Image style={{width: '100%', height:'100%', zIndex:-10, position:'absolute'}} source={require('../../assets/images/hell_back.jpg')}/>
        <View style={styles.resultContainer}>
          <Text>연결 관리</Text>
          <Text>RPi</Text>
          <Text>ESP32</Text>
        </View>
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

  resultContainer: {
    width: '85%',
    minHeight: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#eee',
  },
})