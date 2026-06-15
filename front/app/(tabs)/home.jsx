import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, Text, View, Image, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';

const BACKEND_URL = 'http://172.30.11.98:8000';

export default function HomeScreen() {
  const [rpiConnected, setRpiConnected] = useState('CHECKING'); // CHECKING, CONNECTED, DISCONNECTED
  const [esp32Connected, setEsp32Connected] = useState('CHECKING');
  const [checking, setChecking] = useState(false);

  const [fontsLoaded] = useFonts({
    'MyCustomFont': require('../../assets/fonts/MonaS12TextKR.ttf'),
    'MyCustomFont-Bold': require('../../assets/fonts/MonaS12-Bold.ttf'),
  });

  // 하드웨어 연결 상태 원격 점검 함수
  const checkConnections = async () => {
    if (checking) return;
    setChecking(true);
    setRpiConnected('CHECKING');
    setEsp32Connected('CHECKING');

    try {
      // 1. 라즈베리파이(백엔드 서버) 헬스체크
      const response = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
      
      if (response.ok) {
        setRpiConnected('CONNECTED');
        
        // 2. 백엔드를 통해 ESP32 BLE 스캔 상태 질의 (백엔드에 해당 엔드포인트 구현 필요)
        // 임시로 백엔드가 살아있다면 스캔을 시도하는 모의 통신 흐름 구성
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

  // 상태에 따른 배지 스타일 가이드 생성 함수
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
      
      <View style={styles.titleGroup}>
        <Text style={styles.mainTitle}>Hello!</Text>
        <Text style={styles.mainTitle}>Ender Intel</Text>
      </View>
      
      <View style={styles.resultContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>네트워크 상태 관리</Text>
          {checking && <ActivityIndicator size="small" color="#333" />}
        </View>

        {/* 라즈베리 파이 상태 카드 */}
        <View style={styles.statusRow}>
          <Text style={styles.deviceText}>Raspberry Pi (Svr)</Text>
          <Text style={[styles.statusBadge, { color: getStatusStyle(rpiConnected).color }]}>
            {getStatusStyle(rpiConnected).text}
          </Text>
        </View>

        {/* ESP32 상태 카드 */}
        <View style={styles.statusRow}>
          <Text style={styles.deviceText}>ESP32 (Cube BLE)</Text>
          <Text style={[styles.statusBadge, { color: getStatusStyle(esp32Connected).color }]}>
            {getStatusStyle(esp32Connected).text}
          </Text>
        </View>

        {/* 수동 새로고침 버튼 */}
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
  titleGroup: { margin: 10, padding: 20 },
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