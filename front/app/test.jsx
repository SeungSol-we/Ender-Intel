import { View, Text } from 'react-native';

export default function TestPage() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'yellow' }}>
      <Text style={{ fontSize: 30, fontWeight: 'bold' }}>노란 화면 보이면 성공!</Text>
    </View>
  );
}