import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, Text, View, Image, ActivityIndicator, Animated, Easing } from 'react-native';
import { useFonts } from 'expo-font';

const BACKEND_URL = 'http://172.30.11.98:8000';

export default function HomeScreen() {
  const [rpiConnected, setRpiConnected] = useState('CHECKING');
  const [esp32Connected, setEsp32Connected] = useState('CHECKING');
  const [checking, setChecking] = useState(false);

  // 애니메이션을 위한 참조(Animated Values) 생성
  const floatAnim = useRef(new Animated.Value(0)).current; // 위아래 이동용
  const sideAnim = useRef(new Animated.Value(0)).current;  // 좌우 이동용

  const [fontsLoaded] = useFonts({
    'MyCustomFont': require('../../assets/fonts/MonaS12TextKR.ttf'),
    'MyCustomFont-Bold': require('../../assets/fonts/MonaS12-Bold.ttf'),
  });

  // 가스트 애니메이션 실행 함수
  useEffect(() => {
    // 1. 위아래로 둥실둥실 움직이는 애니메이션 (무한 루프)
    const floatingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000, // 위로 올라가는 시간 (2초)
          easing: Easing.inOut(Easing.sin), // 부드러운 완급 조절
          useNativeDriver: true, // 네이티브 드라이버를 사용하여 성능 최적화 (렉 방지)
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000, // 아래로 내려가는 시간(2초)
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. 좌우로 넓게 왔다 갔다 하는 애니메이션 (무한 루프)
    const sideLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sideAnim, {
          toValue: 1,
          duration: 10000, // 우측으로 이동하는 시간 (9초)
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
        Animated.timing(sideAnim, {
          toValue: 0,
          duration: 10000, // 좌측으로 복귀하는 시간
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
      ])
    );

    // 애니메이션 가동
    floatingLoop.start();
    sideLoop.start();

    // 컴포넌트가 꺼질(Unmount) 때 애니메이션 중지하여 메모리 누수 방지
    return () => {
      floatingLoop.stop();
      sideLoop.stop();
    };
  }, []);

  // 애니메이션 값 매핑 (Value -> 실제 이동 픽셀로 변환)
  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const translateX = sideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  // 하드웨어 연결 상태 점검 함수 (기존 로직 유지)
  const checkConnections = async () => {
    if (checking) return;
    setChecking(true);
    setRpiConnected('CHECKING');
    setEsp32Connected('CHECKING');

    try {
      const response = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
      if (response.ok) {
        setRpiConnected('CONNECTED');
        const statusResponse = await fetch(`${BACKEND_URL}/api/status`);
        const statusData = await statusResponse.json();
        if (statusData.esp32_connected) {
          setEsp32Connected('CONNECTED');
        } else {
          setEsp32Connected('DISCONNECTED');
        }
      } else {
        throw new Error();
      }
    } catch (error) {
      setRpiConnected('DISCONNECTED');
      setEsp32Connected('DISCONNECTED');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnections();
  }, []);

  if (!fontsLoaded) return null;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONNECTED': return { color: '#4CAF50', text: '연결됨 ●' };
      case 'DISCONNECTED': return { color: '#F44336', text: '연결 끊김 ✕' };
      default: return { color: '#FFA500', text: '확인 중...' };
    }
  };

  return (
    <View style={styles.container}>      
      <Image style={styles.background} source={require('../../assets/images/hell_back.jpg')}/>
      
      {/* 🚀 움직이는 가스트 이미지 배치 */}
      <Animated.Image 
        style={[
          styles.ghast, 
          { 
            transform: [{ translateY }, { translateX }] // 계산된 애니메이션 값 주입
          }
        ]} 
        source={require('../../assets/images/ghast.png')} 
        resizeMode="contain"
      />

      <View style={styles.titleGroup}>
        <Text style={styles.mainTitle}>Hello!</Text>
        <Text style={styles.mainTitle}>Ender Intel</Text>
      </View>
      
      <View style={styles.resultContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>네트워크 상태 관리</Text>
          {checking && <ActivityIndicator size="small" color="#333" />}
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.deviceText}>Raspberry Pi (Svr)</Text>
          <Text style={[styles.statusBadge, { color: getStatusStyle(rpiConnected).color }]}>
            {getStatusStyle(rpiConnected).text}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.deviceText}>ESP32 (Cube BLE)</Text>
          <Text style={[styles.statusBadge, { color: getStatusStyle(esp32Connected).color }]}>
            {getStatusStyle(esp32Connected).text}
          </Text>
        </View>

        <Pressable style={styles.refreshButton} onPress={checkConnections}>
          <Text style={styles.refreshButtonText}>연결 상태 재조회</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  background: { width: '100%', height: '100%', zIndex: -10, position: 'absolute' },
  
  // 가스트 스타일 컴포넌트 추가
  ghast: {
    position: 'absolute',
    top: '12%',        // 제목(Hello!) 윗 공간 즈음에 배치하도록 상단 비율 조정
    width: 90,         // 적절한 크기 지정 (필요 시 크기 조절하세요)
    height: 90,
    zIndex: -5,        // 배경보다는 위, 제목 및 UI 컨테이너보다는 뒤로 가게 설정
    opacity: 0.85,     // 살짝 유령처럼 투명도 부여
  },

  titleGroup: { margin: 10, padding: 20, marginTop: 10 }, // 가스트 공간 확보를 위해 marginTop 약간 추가
  mainTitle: { color: '#fff', fontSize: 34, fontFamily: 'MyCustomFont-Bold', textAlign: 'center' },
  resultContainer: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 22,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 5,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontFamily: 'MyCustomFont-Bold', color: '#111' },
  statusRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  deviceText: { fontSize: 14, fontFamily: 'MyCustomFont', color: '#444' },
  statusBadge: { fontSize: 14, fontFamily: 'MyCustomFont-Bold' },
  refreshButton: {
    backgroundColor: '#333',
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  refreshButtonText: { color: '#fff', fontSize: 14, fontFamily: 'MyCustomFont-Bold' }
});