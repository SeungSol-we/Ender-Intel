import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/home" />; // (tabs)/home.jsx로 강제 이동
}