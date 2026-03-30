import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useFonts } from 'expo-font';


export default function TabTwoScreen() {

  const [fontsLoaded] = useFonts({
    'MyCustomFont': require('../../assets/fonts/MonaS12TextKR.ttf'),
    'MyCustomFont-Bold': require('../../assets/fonts/MonaS12-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text>
          로딩중...
        </Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
           <Text style={styles.test}>하하 이제 자야지...세부적으로 만드는건 내일할래</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe5ed'
  },

  test: {
    fontFamily: 'MyCustomFont',
  }
 

})