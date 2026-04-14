import { Text, View, Image, StyleSheet, Pressable } from 'react-native';
import { useFonts } from 'expo-font';


export default function TabTwoScreen() {

  const [fontsLoaded] = useFonts({
    'MyCustomFont': require('../../assets/fonts/MonaS12TextKR.ttf'),
    'MyCustomFont-Bold': require('../../assets/fonts/MonaS12-Bold.ttf'),
    'MyCustomFont-Color': require('../../assets/fonts/Mona12Emoji.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Image 
            style={styles.background} 
            source={require('../../assets/images/ender_back2.jpg')}
        />
        <Text>
          로딩중...
        </Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <Image 
          style={styles.background} 
          source={require('../../assets/images/ender_back2.jpg')}
      />
      <View style={styles.resultContainer}>
        <Text>연결 관리</Text>
        <Text>RPi</Text>
        <Text>ESP32</Text>
      </View>

      <View style={styles.resultContainer}> 
        <Text>컬러 피커 (라이브러리 사용예정)</Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  
  background: {
      width: '100%',
      height: '100%',
      zIndex: -10,
      position: 'absolute'
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