import { Pressable, Text, View, Button, Image } from 'react-native';
import { StyleSheet } from 'react-native';


const AiScreen = () => {
    return (
        <View style={styles.container}>
            <Image style={{width: '100%', height:'100%', zIndex:-10, position:'absolute'}} source={require('../../assets/images/background.png')}/>
            <Pressable 
                onPress={() => console.log('클릭됨!')}
                style={({ pressed }) => [
                    styles.button,
                    { opacity: pressed ? 0.7 : 1 }
                ]}
            >
                <Image 
                    source={require('../../assets/images/mic.png')} 
                    style={styles.buttonImage} 
                />
                <Text style={styles.buttonText}>AI 시작하기</Text>
            </Pressable>
        </View>
    );
};

export default AiScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: '#ffe5ed'
    },


})