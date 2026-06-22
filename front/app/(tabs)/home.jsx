import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, Text, View, Image, ActivityIndicator, Animated, Easing } from 'react-native';
import { useFonts } from 'expo-font';

const BACKEND_URL = 'http://172.30.11.98:8000';

export default function HomeScreen() {
  const [rpiConnected, setRpiConnected] = useState('CHECKING');
  const [esp32Connected, setEsp32Connected] = useState('CHECKING');
  const [checking, setChecking] = useState(false);
  // ✅ 사용하지 않는 facingRight state 제거

  const floatAnim = useRef(new Animated.Value(0)).current;
  const sideAnim = useRef(new Animated.Value(0)).current;
  const scaleXAnim = useRef(new Animated.Value(-1)).current;

  const [fontsLoaded] = useFonts({
    'MyCustomFont': require('../../assets/fonts/MonaS12TextKR.ttf'),
    'MyCustomFont-Bold': require('../../assets/fonts/MonaS12-Bold.ttf'),
  });

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

    const moveRight = () => {
      Animated.timing(scaleXAnim, {
        toValue: -1, // ✅ 오른쪽 이동 시 반전(-1)된 방향으로 바라봄
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
        toValue: 1, // ✅ 왼쪽 이동 시 원본(1) 방향으로 바라봄
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

  const checkConnections = async () => {
  if (checking) return;

  setChecking(true);
  setRpiConnected('CHECKING');
  setEsp32Connected('CHECKING');

  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
    });

    if (response.ok) {
      setRpiConnected('CONNECTED');
    } else {
      setRpiConnected('DISCONNECTED');
      setEsp32Connected('DISCONNECTED');
      return;
    }
  } catch (error) {
    setRpiConnected('DISCONNECTED');
    setEsp32Connected('DISCONNECTED');
    return;
  }

  try {
    const statusResponse = await fetch(`${BACKEND_URL}/api/manual/connection`);

    if (!statusResponse.ok) {
      setEsp32Connected('DISCONNECTED');
      return;
    }

    const statusData = await statusResponse.json();

    if (statusData.connected) {
      setEsp32Connected('CONNECTED');
    } else {
      setEsp32Connected('DISCONNECTED');
    }
  } catch (error) {
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

      <Animated.Image
        style={[
          styles.ghast,
          {
            transform: [
              { translateY },
              { translateX },
              { scaleX: scaleXAnim },
            ]
          }
        ]}
        source={require('../../assets/images/ghast.gif')}
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
  ghast: {
    position: 'absolute',
    top: '12%',
    width: 90,
    height: 90,
    zIndex: -5,
    opacity: 0.85,
  },
  titleGroup: { margin: 10, padding: 20, marginTop: 10 },
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