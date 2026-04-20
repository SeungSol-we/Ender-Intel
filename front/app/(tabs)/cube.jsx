import React, { useState } from 'react';
import { Text, View, Image, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFonts } from 'expo-font';
import ColorPicker from 'react-native-wheel-color-picker';

const BACKEND_URL = 'http://172.30.7.218:8000';

// 백엔드 전송용 색상 상수
const COLORS = [
  { name: 'RED', hex: '#FF0000' },
  { name: 'BLUE', hex: '#0000FF' },
  { name: 'GREEN', hex: '#00FF00' },
  { name: 'YELLOW', hex: '#FFFF00' },
  { name: 'PURPLE', hex: '#800080' },
  { name: 'CYAN', hex: '#00FFFF' },
  { name: 'ORANGE', hex: '#FFA500' },
  { name: 'WHITE', hex: '#FFFFFF' },
];

export default function TabTwoScreen() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [colorName, setColorName] = useState('WHITE');
  const [loading, setLoading] = useState(false);

  // 폰트 로드
  const [fontsLoaded] = useFonts({
    'MyCustomFont': require('../../assets/fonts/MonaS12TextKR.ttf'),
    'MyCustomFont-Bold': require('../../assets/fonts/MonaS12-Bold.ttf'),
  });

  // 유클리드 거리 기반 가장 가까운 색상 이름 찾기
  const getClosestColorName = (targetHex) => {
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
    const targetRgb = hexToRgb(targetHex);
    let minDistance = Infinity;
    let closestName = 'WHITE';

    COLORS.forEach((color) => {
      const colorRgb = hexToRgb(color.hex);
      const distance = Math.sqrt(
        Math.pow(targetRgb.r - colorRgb.r, 2) +
        Math.pow(targetRgb.g - colorRgb.g, 2) +
        Math.pow(targetRgb.b - colorRgb.b, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestName = color.name;
      }
    });
    return closestName;
  };

  // 통합 제어 함수 (색상 적용 및 ON/OFF 겸용)
  const controlLED = async (action, targetColor = colorName) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/manual/light`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action, // "ON" 또는 "OFF"
          color: action === 'OFF' ? 'WHITE' : targetColor
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || '제어 실패');
      
      console.log(`LED ${action} - ${targetColor} 전송 완료`);
    } catch (error) {
      Alert.alert('통신 오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onColorChange = (color) => {
    setSelectedColor(color);
    const name = getClosestColorName(color.toUpperCase());
    setColorName(name);
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <Image style={styles.background} source={require('../../assets/images/ender_back4.jpg')} />
      
      <View style={styles.resultContainer}>
        <View style={styles.headerRow}>
            <Text style={styles.resultLabel}>LED 제어</Text>
            <Text style={[styles.colorStatus, {color: selectedColor}]}>● {colorName}</Text>
        </View>

        <View style={styles.pickerWrapper}>
          <ColorPicker
            color={selectedColor}
            onColorChangeComplete={onColorChange}
            thumbSize={25}
            noSnap={true}
            row={false}
            swatches={false}     // 하단 예시 색상(팔레트) 숨기기
            discrete={false}    // 부드러운 색상 변화
            sliderSize={0}      // 명도 조절 슬라이더 높이를 0으로 해서 숨기기
            palette={[]}        // 혹시 남아있을 예시 색상 배열 비우기
          />
        </View>

        {/* 제어 버튼 그룹 */}
        <View style={styles.buttonGroup}>
          <Pressable 
            style={[styles.applyButton, loading && styles.disabled]} 
            onPress={() => controlLED('ON')}
          >
            <Text style={styles.buttonText}>{colorName} 적용</Text>
          </Pressable>

          <View style={styles.onOffRow}>
            <Pressable 
              style={[styles.smallButton, {backgroundColor: '#4CAF50'}]} 
              onPress={() => controlLED('ON')}
            >
              <Text style={styles.smallButtonText}>ON</Text>
            </Pressable>
            <Pressable 
              style={[styles.smallButton, {backgroundColor: '#F44336'}]} 
              onPress={() => controlLED('OFF')}
            >
              <Text style={styles.smallButtonText}>OFF</Text>
            </Pressable>
          </View>
        </View>
        
        {loading && <ActivityIndicator style={styles.loader} color="#666" />}
      </View>

      {/* 모드 등 기타 컨테이너 (비워둠) */}
      <View style={styles.resultContainer}>
         <Text style={styles.resultLabel}>밸런싱 큐브 모드</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  background: { width: '100%', height: '100%', zIndex: -10, position: 'absolute' },
  resultContainer: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 5,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  resultLabel: { fontSize: 16, fontFamily: 'MyCustomFont-Bold', color: '#333' },
  colorStatus: { fontSize: 14, fontFamily: 'MyCustomFont-Bold', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 1 },
  pickerWrapper: { height: 180, marginBottom: 20 },
  buttonGroup: { width: '100%' },
  applyButton: {
    backgroundColor: '#333',
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  onOffRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallButton: {
    flex: 0.48,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 16, fontFamily: 'MyCustomFont-Bold' },
  smallButtonText: { color: 'white', fontSize: 14, fontFamily: 'MyCustomFont-Bold' },
  disabled: { opacity: 0.5 },
  loader: { marginTop: 10 }
});