import React, { useEffect, useState, useRef } from 'react';
import { Pressable, Text, View, Image, Animated, StyleSheet, Platform } from 'react-native';
import Voice from '@react-native-voice/voice';
import { useFonts } from 'expo-font';
// 신규 권한 라이브러리 (expo-permissions 대체)
import * as Device from 'expo-device';

// ──────────────────────────────────────────────
// 백엔드 설정 (사용자님의 IP 유지)
// ──────────────────────────────────────────────
const BACKEND_URL = 'http://10.98.231.122:8000';

const AiScreen = () => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [response, setResponse] = useState('');
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const silenceTimer = useRef(null);
    const voiceInitialized = useRef(false);
    const latestText = useRef('');

    // 권한 요청 로직 수정 (PermissionsAndroid 유지 + 안전장치)
    useEffect(() => {
        const requestPermission = async () => {
            if (Platform.OS === 'android') {
                const { PermissionsAndroid } = require('react-native');
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                        {
                            title: '마이크 권한 요청',
                            message: '음성 인식을 위해 마이크 권한이 필요합니다.',
                            buttonPositive: '허용',
                        }
                    );
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        console.log('마이크 권한 거부됨');
                    }
                } catch (err) {
                    console.warn(err);
                }
            }
        };
        requestPermission();
    }, []);

    useEffect(() => {
        const initializeVoice = async () => {
            try {
                // 기존 세션이 남아있을 경우 대비
                await Voice.destroy();
                
                Voice.onSpeechStart = handleSpeechStart;
                Voice.onSpeechResults = handleSpeechResults;
                Voice.onSpeechError = handleSpeechError;
                Voice.onSpeechEnd = handleSpeechEnd;

                voiceInitialized.current = true;
                console.log('✅ Voice 초기화 완료');
            } catch (e) {
                console.error('❌ Voice 초기화 오류:', e);
            }
        };

        if (!voiceInitialized.current) {
            initializeVoice();
        }

        return () => {
            if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
            }
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const handleSpeechStart = () => {
        console.log('🎤 음성 인식 시작');
        setIsListening(true);
        startPulseAnimation();
    };

    const handleSpeechResults = (e) => {
        if (e.value && e.value.length > 0) { // e.value[0] 체크 강화
            const text = e.value[0];
            console.log('📝 인식된 텍스트:', text);
            
            // 화면 업데이트
            setRecognizedText(text);
            // ✨ 즉시 전송용 Ref 업데이트 (가장 중요)
            latestText.current = text; 
            
            resetSilenceTimer();
        }
    };

    const handleSpeechError = async (e) => { 
        if (!isListening) return;

        console.log('❌ 음성 인식 오류:', e);
        setIsListening(false);
        setIsButtonDisabled(false);
        stopPulseAnimation();

        try {
            await Voice.destroy(); 
        } catch (err) {}
        
        if (e.error?.code === '5' || e.code === '5') {
            if (!recognizedText || recognizedText === '듣고 있어요...') {
                setRecognizedText('인식 엔진 연결 상태가 불안정합니다.');
            }
        }
    };

    const handleSpeechEnd = () => {
        console.log('🛑 음성 인식 종료');
        setIsListening(false);
        stopPulseAnimation();
    };

    const stopEverything = async () => {
        // [수정] 이미 Listening이 false여도 전송 로직은 실행될 수 있도록 가드 제거
        console.log('🏁 stopEverything 실행됨 (현재 텍스트:', latestText.current, ')');

        try {
            if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
                silenceTimer.current = null;
            }

            // 음성 인식 중지
            await Voice.stop();
            setIsListening(false);
            stopPulseAnimation();

            // [핵심] 전송 로직
            const textToSend = latestText.current;
            
            // 조건문에서 '듣고 있어요...' 제외 로직을 더 안전하게 변경
            if (textToSend && textToSend.trim().length > 0 && textToSend !== '듣고 있어요...') {
                console.log('🚀 백엔드로 자동 전송 시작:', textToSend);
                await sendTextToBackend(textToSend);
                latestText.current = ''; // 전송 후 초기화
            } else {
                console.log('⚠️ 전송할 유효한 텍스트가 없습니다. (값:', textToSend, ')');
            }
        } catch (e) {
            console.error('Stop Error:', e);
        }
    };

    const resetSilenceTimer = () => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
            console.log('⏱️ 5초 침묵 - 자동 정지');
            stopEverything();
        }, 5000);
    };

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopPulseAnimation = () => {
        scaleAnim.stopAnimation();
        scaleAnim.setValue(1);
    };

    const sendTextToBackend = async (text) => {
        if (!text.trim()) return;

        setIsProcessing(true);
        setResponse('처리 중...');

        try {
            console.log('📤 백엔드로 텍스트 전송:', text);
            const res = await fetch(`${BACKEND_URL}/api/chat/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setResponse(data.text_reply || '응답을 받지 못했습니다.');
        } catch (error) {
            console.error('❌ 백엔드 통신 오류:', error);
            setResponse('오류: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleButtonPress = async () => {
        if (isButtonDisabled || isProcessing) return;

        setIsButtonDisabled(true);
        // 버튼 연타 방지 시간을 조금 더 늘림 (1초)
        setTimeout(() => setIsButtonDisabled(false), 1000);

        if (isListening) {
            console.log('🔘 버튼 클릭: 인식 수동 중단');
            await stopEverything(); 
        } else {
            try {
                console.log('🔘 버튼 클릭: 인식 시작');
                latestText.current = ''; 
                setRecognizedText('듣고 있어요...');
                setResponse('');
                await Voice.start('ko-KR');
                // resetSilenceTimer는 onSpeechStart에서 실행되게 하는 것이 더 정확하지만 
                // 일단 유지한다면 여기서 호출
                resetSilenceTimer();
            } catch (e) {
                console.error('❌ Start Error:', e);
                setIsButtonDisabled(false);
            }
        }
    };

    const [fontsLoaded] = useFonts({
        'MyCustomFont': require('../../assets/fonts/MonaS12TextKR.ttf'),
        'MyCustomFont-Bold': require('../../assets/fonts/MonaS12-Bold.ttf'),
    });

    return (
        <View style={styles.container}>
            <Image
                style={styles.background}
                source={require('../../assets/images/background.png')}
            />

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Pressable
                    onPress={handleButtonPress}
                    disabled={isProcessing}
                    style={({ pressed }) => [
                        styles.button,
                        {
                            opacity: pressed || isButtonDisabled || isProcessing ? 0.7 : 1,
                        },
                        isListening && styles.buttonActive,
                    ]}
                >
                    <Image
                        source={require('../../assets/images/mic.png')}
                        style={styles.buttonImage}
                    />
                    <Text style={styles.buttonText}>
                        {isProcessing ? '처리 중...' : isListening ? '중단하기' : 'AI 시작하기'}
                    </Text>
                </Pressable>
            </Animated.View>

            <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>실시간 인식 결과</Text>
                <Text style={styles.resultText}>
                    {recognizedText || '버튼을 눌러 말하기!'}
                </Text>
            </View>

            {response && (
                <View style={styles.responseContainer}>
                    <Text style={styles.responseLabel}>AI 응답</Text>
                    <Text style={styles.responseText}>{response}</Text>
                </View>
            )}
        </View>
    );
};

export default AiScreen;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    background: { width: '100%', height: '100%', zIndex: -10, position: 'absolute' },
    buttonText: { fontSize: 16, fontWeight: '600', color: '#333' },
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
    resultLabel: {
        fontSize: 12,
        color: '#c16b6b',
        marginBottom: 10,
        fontFamily: 'MyCustomFont-Bold',
    },
    resultText: {
        fontSize: 18,
        color: '#222',
        fontWeight: '500',
        lineHeight: 28,
        fontFamily: 'MyCustomFont-Bold'
    },
    responseContainer: {
        width: '85%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        marginTop: 10,
    },
    responseLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
    responseText: { fontSize: 16, color: '#333' }
});