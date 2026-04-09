import React, { useEffect, useState, useRef } from 'react';
import { Pressable, Text, View, Image, Animated, StyleSheet } from 'react-native';
import Voice from '@react-native-voice/voice';

const AiScreen = () => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(false); // [추가] 버튼 잠금 상태
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const silenceTimer = useRef(null);

    useEffect(() => {
        Voice.onSpeechStart = () => {
            setIsListening(true);
            startPulseAnimation();
        };

        Voice.onSpeechResults = (e) => {
            if (e.value && e.value[0]) {
                setRecognizedText(e.value[0]);
                resetSilenceTimer();
                console.log(e.value[0])
            }
        };

        Voice.onSpeechError = (e) => {
            console.log('Speech Error:', e.error);
            stopEverything(); 
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
            if (silenceTimer.current) clearTimeout(silenceTimer.current);
        };
    }, []);

    const stopEverything = async () => {
        try {
            setIsListening(false);
            stopPulseAnimation();
            setRecognizedText('');
            if (silenceTimer.current) clearTimeout(silenceTimer.current);
            
            await Voice.stop();
            await Voice.destroy();
        } catch (e) {
            console.error('Stop Error:', e);
        }
    };

    const resetSilenceTimer = () => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
            stopEverything();
        }, 5000);
    };

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        ).start();
    };

    const stopPulseAnimation = () => {
        scaleAnim.stopAnimation();
        scaleAnim.setValue(1);
    };

    // [수정] 버튼 클릭 핸들러
    const handleButtonPress = async () => {
        if (isButtonDisabled) return; // 버튼이 잠겨있으면 아무것도 안 함

        // 1. 버튼 잠금 (0.5초 동안)
        setIsButtonDisabled(true);
        setTimeout(() => setIsButtonDisabled(false), 500);

        if (isListening) {
            await stopEverything();
        } else {
            try {
                await Voice.destroy();
                setRecognizedText('듣고 있어요...');
                await Voice.start('ko-KR');
                resetSilenceTimer();
            } catch (e) {
                console.error('Start Error:', e);
            }
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
                    // [추가] 잠금 상태일 때 시각적으로도 피드백을 줄 수 있음 (선택 사항)
                    style={({ pressed }) => [
                        styles.button,
                        { opacity: (pressed || isButtonDisabled) ? 0.7 : 1 },
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

            <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>실시간 인식 결과</Text>
                <Text style={styles.resultText}>
                    {recognizedText || '버튼을 눌러말하기!'}
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