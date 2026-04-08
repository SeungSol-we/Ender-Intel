import React, { useEffect, useState, useRef } from 'react';
import { Pressable, Text, View, Image, Animated, StyleSheet } from 'react-native';
import Voice from '@react-native-voice/voice'; // 실시간 음성 인식 라이브러리

const AiScreen = () => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState(''); // 실시간 텍스트 저장
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Voice 콜백 설정
        Voice.onSpeechStart = () => setIsListening(true);
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechResults = (e) => {
            // 결과가 나오면 실시간으로 텍스트 업데이트
            if (e.value) setRecognizedText(e.value[0]);
        };
        Voice.onSpeechError = (e) => {
            console.log('Speech Error:', e.error);
            setIsListening(false);
        };

        return () => {
            // 컴포넌트 언마운트 시 초기화
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    };

    const stopPulseAnimation = () => {
        scaleAnim.setValue(1);
    };

    const startListening = async () => {
        try {
            setRecognizedText('듣고 있어요...'); // 초기 문구
            await Voice.start('ko-KR'); // 한국어 인식 시작
            startPulseAnimation();
        } catch (e) {
            console.error(e);
        }
    };

    const stopListening = async () => {
        try {
            await Voice.stop();
            stopPulseAnimation();
            setIsListening(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleButtonPress = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <View style={styles.container}>
            <Image 
                style={styles.background} 
                source={require('../../assets/images/background.png')}
            />
            
            

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Pressable 
                    onPress={handleButtonPress}
                    style={({ pressed }) => [
                        styles.button,
                        { opacity: pressed ? 0.7 : 1 },
                        isListening && styles.buttonActive
                    ]}
                >
                    <Image 
                        source={require('../../assets/images/mic.png')} 
                        style={styles.buttonImage} 
                    />
                    <Text style={styles.buttonText}>
                        {isListening ? '중단하기' : 'AI 시작하기'}
                    </Text>
                </Pressable>
            </Animated.View>
            {/* 결과 창을 처음부터 보여주기 위해 조건부 렌더링 제거 */}
            <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>실시간 인식 결과</Text>
                <Text style={styles.resultText}>
                    {recognizedText || '버튼을 눌러 말하기!'}
                </Text>
            </View>
        </View>
    );
};

export default AiScreen;

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
    // button: {
    //     paddingHorizontal: 30,
    //     paddingVertical: 15,
    //     borderRadius: 50,
    //     backgroundColor: '#fff', // 배경색 추가로 가독성 확보
    //     elevation: 5, // 안드로이드 그림자
    //     shadowColor: '#000', // iOS 그림자
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.2,
    //     alignItems: 'center',
    // },
    // buttonActive: {
    //     backgroundColor: '#ffdbdb',
    // },
    // buttonImage: {
    //     width: 60,
    //     height: 60,
    //     marginBottom: 10,
    // },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    resultContainer: {
        width: '85%',
        minHeight: 150, // 최소 높이 설정
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 40, // 마이크 버튼과의 간격
        borderWidth: 1,
        borderColor: '#eee',
    },
    resultLabel: {
        fontSize: 12,
        color: '#ff6b6b',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    resultText: {
        fontSize: 18,
        color: '#222',
        fontWeight: '500',
        lineHeight: 28,
    },
});