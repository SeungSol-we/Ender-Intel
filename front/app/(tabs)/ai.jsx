import React, { useEffect, useState, useRef } from 'react';
import { Pressable, Text, View, Image, Animated, StyleSheet, Platform, ScrollView, ActivityIndicator, Easing } from 'react-native';
import Voice from '@react-native-voice/voice';
import { useFonts } from 'expo-font';
import * as Device from 'expo-device';
import * as Speech from 'expo-speech';

const BACKEND_URL = 'http://172.30.11.98:8000';

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

    const floatAnim = useRef(new Animated.Value(0)).current;
    const sideAnim = useRef(new Animated.Value(0)).current;
    const scaleXAnim = useRef(new Animated.Value(-1)).current; // ✨ 처음부터 반전

    useEffect(() => {
        const floatingLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );

        // ✨ 끝에서 방향 전환하는 왕복 애니메이션
        const moveRight = () => {
            Animated.timing(scaleXAnim, {
                toValue: -1, // 오른쪽 이동 시 반전
                duration: 0,
                useNativeDriver: true,
            }).start();

            Animated.timing(sideAnim, {
                toValue: 1,
                duration: 10000,
                easing: Easing.inOut(Easing.linear),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) moveLeft();
            });
        };

        const moveLeft = () => {
            Animated.timing(scaleXAnim, {
                toValue: 1, // 왼쪽 이동 시 원본 방향
                duration: 0,
                useNativeDriver: true,
            }).start();

            Animated.timing(sideAnim, {
                toValue: 0,
                duration: 10000,
                easing: Easing.inOut(Easing.linear),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) moveRight();
            });
        };

        floatingLoop.start();
        moveRight();

        return () => {
            floatingLoop.stop();
            sideAnim.stopAnimation();
            scaleXAnim.stopAnimation();
        };
    }, []);

    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20],
    });

    const translateX = sideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 100],
    });

    const speakResponse = (text) => {
        if (!text) return;
        Speech.stop();
        Speech.speak(text, {
            language: 'ko-KR',
            pitch: 1.0,
            rate: 1.0,
        });
    };

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
                await Voice.destroy();
                Voice.onSpeechStart = handleSpeechStart;
                Voice.onSpeechResults = handleSpeechResults;
                Voice.onSpeechError = handleSpeechError;
                Voice.onSpeechEnd = handleSpeechEnd;
                voiceInitialized.current = true;
                console.log('Voice 초기화 완료');
            } catch (e) {
                console.error('Voice 초기화 오류:', e);
            }
        };

        if (!voiceInitialized.current) {
            initializeVoice();
        }

        return () => {
            if (silenceTimer.current) clearTimeout(silenceTimer.current);
            Voice.destroy().then(Voice.removeAllListeners);
            Speech.stop();
        };
    }, []);

    const handleSpeechStart = () => {
        console.log('음성 인식 시작');
        setIsListening(true);
        startPulseAnimation();
        Speech.stop();
    };

    const handleSpeechResults = (e) => {
        if (e.value && e.value.length > 0) {
            const text = e.value[0];
            console.log('인식된 텍스트:', text);
            setRecognizedText(text);
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
        try { await Voice.destroy(); } catch (err) {}
    };

    const handleSpeechEnd = () => {
        console.log('음성 인식 종료');
        setIsListening(false);
        stopPulseAnimation();
    };

    const stopEverything = async () => {
        console.log('stopEverything 실행됨 (현재 텍스트:', latestText.current, ')');
        try {
            if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
                silenceTimer.current = null;
            }
            await Voice.stop();
            setIsListening(false);
            stopPulseAnimation();

            const textToSend = latestText.current;
            if (textToSend && textToSend.trim().length > 0 && textToSend !== '듣고 있어요...') {
                console.log('백엔드로 자동 전송 시작:', textToSend);
                await sendTextToBackend(textToSend);
                latestText.current = '';
            } else {
                console.log('전송할 유효한 텍스트가 없습니다.');
            }
        } catch (e) {
            console.error('Stop Error:', e);
        }
    };

    const resetSilenceTimer = () => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
            console.log('5초 침묵 - 자동 정지');
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

    const sendTextToBackend = async (text) => {
        if (!text.trim()) return;
        setIsProcessing(true);
        setResponse('처리 중...');

        try {
            console.log('백엔드로 텍스트 전송:', text);
            const res = await fetch(`${BACKEND_URL}/api/chat/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const aiReply = data.text_reply || '응답을 받지 못했습니다.';

            setResponse(aiReply);
            speakResponse(aiReply);
        } catch (error) {
            console.error('백엔드 통신 오류:', error);
            setResponse('오류: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleButtonPress = async () => {
        if (isButtonDisabled || isProcessing) return;
        setIsButtonDisabled(true);
        setTimeout(() => setIsButtonDisabled(false), 1000);

        if (isListening) {
            await stopEverything();
        } else {
            try {
                Speech.stop();
                latestText.current = '';
                setRecognizedText('듣고 있어요...');
                setResponse('');
                await Voice.start('ko-KR');
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

            {/* ✨ scaleX 방향 전환 적용 */}
            <Animated.Image
                style={[
                    styles.allay,
                    {
                        transform: [
                            { translateY },
                            { translateX },
                            { scaleX: scaleXAnim }, // ✨ 끝에서 돌아서는 반전
                        ]
                    }
                ]}
                source={require('../../assets/images/allay.gif')}
                resizeMode="contain"
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
                    <Text style={styles.buttonText}></Text>
                </Pressable>
            </Animated.View>

            <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>실시간 인식 결과</Text>
                <ScrollView
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <Text style={styles.resultText}>
                        {recognizedText || '버튼을 눌러 말하기!'}
                    </Text>
                </ScrollView>
            </View>

            {response && (
                <View style={styles.responseContainer}>
                    <Text style={styles.responseLabel}>AI 응답</Text>
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        <Text style={styles.responseText}>{response}</Text>
                    </ScrollView>
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
    allay: {
        position: 'absolute',
        top: '12%',
        width: 80,
        height: 80,
        zIndex: -5,
        opacity: 0.85,
    },
    resultContainer: {
        width: '85%',
        minHeight: 150,
        maxHeight: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 5,
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
        height: 150,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        marginTop: 10,
    },
    responseLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
    responseText: { fontSize: 16, color: '#333' }
});