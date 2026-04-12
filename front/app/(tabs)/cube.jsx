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
            source={require('../../assets/images/background.png')}
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
          source={require('../../assets/images/background.png')}
      />
      <Text style={styles.test}>🎙️🎤</Text>
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

  test: {
    fontFamily: 'MyCustomFont-Color',
  }
 

})