import React, { useState } from 'react';
import { Text, View, Image, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFonts } from 'expo-font';
import ColorPicker from 'react-native-wheel-color-picker';

const BACKEND_URL = 'http://172.30.11.98:8000';

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
  const [isBalancing, setIsBalancing] = useState(false); // 밸런싱 활성화 상태 플래그

  const [fontsLoaded] = useFonts({
    'MyCustomFont': require('../../assets/fonts/MonaS12TextKR.ttf'),
    'MyCustomFont-Bold': require('../../assets/fonts/MonaS12-Bold.ttf'),
  });

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
        Math.pow(targetRgb.r - colorRgb.r, 2) + Math.pow(targetRgb.g - colorRgb.g, 2) +
        Math.pow(targetRgb.b - colorRgb.b, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestName = color.name;
      }
    });
    return closestName;
  };

  const controlLED = async (action, targetColor = colorName) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/manual/light`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          color: action === 'OFF' ? 'WHITE' : targetColor
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || '제어 실패');
      console.log(`LED ${action} 전송 완료`);
    } catch (error) {
      Alert.alert('통신 오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 밸런싱 모드 제어 함수 (Mock 선행 연동)
  const toggleBalancing = async () => {
    if (loading) return;
    setLoading(true);
    
    const nextState = !isBalancing; // 전환 타겟 상태

    try {
      const response = await fetch(`${BACKEND_URL}/api/manual/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: nextState ? "START" : "STOP"
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || '밸런싱 명령 실패');
      
      setIsBalancing(nextState);
      Alert.alert('밸런싱 모드', nextState ? '중심 잡기 제어권을 가동합니다.' : '밸런싱이 중지되었습니다.');
    } catch (error) {
      Alert.alert('밸런싱 오류', error.message + '\n(하드웨어 PID 로직 연동 확인 필요)');
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
      <Image style={styles.background} source={require('../../assets/images/ender_back7.png')} />
      
      {/* LED 제어 카드 */}
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
            swatches={false}
            discrete={false}
            sliderSize={0}
            palette={[]}
          />
        </View>

        <View style={styles.buttonGroup}>
          <Pressable style={[styles.applyButton, loading && styles.disabled]} onPress={() => controlLED('ON')}>
            <Text style={styles.buttonText}>{colorName} 적용</Text>
          </Pressable>

          <View style={styles.onOffRow}>
            <Pressable style={[styles.smallButton, {backgroundColor: '#4CAF50'}]} onPress={() => controlLED('ON')}>
              <Text style={styles.smallButtonText}>ON</Text>
            </Pressable>
            <Pressable style={[styles.smallButton, {backgroundColor: '#F44336'}]} onPress={() => controlLED('OFF')}>
              <Text style={styles.smallButtonText}>OFF</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 🚀 활성화된 밸런싱 제어 카드 */}
      <View style={styles.resultContainer}>
         <Text style={styles.resultLabel}>밸런싱 큐브 제어</Text>
         <Text style={styles.subText}>실시간 자이로 및 구조 평형 유지 기능을 토글합니다.</Text>
         
         <Pressable 
          style={[
            styles.balanceButton, 
            isBalancing ? styles.balanceActive : styles.balanceInactive,
            loading && styles.disabled
          ]}
          onPress={toggleBalancing}
         >
           <Text style={styles.buttonText}>
             {isBalancing ? "중심잡기 중지 (STOP)" : "중심잡기 가동 (START)"}
           </Text>
         </Pressable>
         
         {loading && <ActivityIndicator style={{marginTop: 10}} color="#333" />}
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
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 5,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  resultLabel: { fontSize: 16, fontFamily: 'MyCustomFont-Bold', color: '#333' },
  subText: { fontSize: 12, fontFamily: 'MyCustomFont', color: '#666', marginTop: 4, marginBottom: 15 },
  colorStatus: { fontSize: 14, fontFamily: 'MyCustomFont-Bold' },
  pickerWrapper: { height: 180, marginBottom: 20 },
  buttonGroup: { width: '100%' },
  applyButton: { backgroundColor: '#333', height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  onOffRow: { flexDirection: 'row', justifyContent: 'space-between' },
  smallButton: { flex: 0.48, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontFamily: 'MyCustomFont-Bold' },
  smallButtonText: { color: 'white', fontSize: 14, fontFamily: 'MyCustomFont-Bold' },
  disabled: { opacity: 0.5 },
  
  // 밸런싱 버튼 전용 스타일
  balanceButton: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  balanceInactive: { backgroundColor: '#c477dc' }, // 대기 상태 (블루)
  balanceActive: { backgroundColor: '#FF9800' },   // 동작 상태 (오렌지 경고색)
});