import React, { useEffect, useState, useRef } from 'react';
import { Pressable, Text, View, Image, Animated, StyleSheet } from 'react-native';
import Voice from '@react-native-voice/voice';

const AiScreen = () => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const silenceTimer = useRef(null);

    useEffect(() => {
        // 음성 인식 이벤트 등록
        Voice.onSpeechStart = () => {
            setIsListening(true);
            startPulseAnimation();
        };

        Voice.onSpeechResults = (e) => {
            if (e.value && e.value[0]) {
                setRecognizedText(e.value[0]);
                resetSilenceTimer(); // 말하면 타이머 연장
                console.log("텍스트 인식: ", e.value[0])
            }
        };

        Voice.onSpeechError = (e) => {
            // Error 5번이 뜨면 이미 실행 중인 것이니 일단 멈춤 처리
            console.log('Speech Error:', e.error);
            if (e.error?.code === '5') {
                // 이미 실행 중일 때 발생하는 에러이므로 강제로 상태를 맞춤
                stopEverything(); 
            } else {
                handleStopUI();
            }
        };

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
            if (silenceTimer.current) clearTimeout(silenceTimer.current);
        };
    }, []);

    // UI와 타이머만 끄는 함수
    const handleStopUI = () => {
        setIsListening(false);
        stopPulseAnimation();
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };

    // [중요] 엔진 정지 + 텍스트 초기화 + UI 정지 통합 함수
    const stopEverything = async () => {
        try {
            handleStopUI();
            setRecognizedText(''); // 텍스트 초기화 -> '버튼을 눌러 말하기!'
            await Voice.stop(); 
            await Voice.destroy(); // 엔진을 완전히 파괴해서 Error 5 방지
        } catch (e) {
            console.error('Stop Error:', e);
        }
    };

    const resetSilenceTimer = () => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
            stopEverything(); // 5초간 말 없으면 자동 종료
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

    const handleButtonPress = async () => {
        if (isListening) {
            // [요구사항] 텍스트가 있든 없든 누르면 즉시 멈춤 + 초기화
            await stopEverything();
        } else {
            // 시작 전 초기화
            try {
                await Voice.destroy(); // 이전 찌꺼기 제거 (Error 5 방지 핵심)
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