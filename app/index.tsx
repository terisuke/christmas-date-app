import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1544042259-ea9a0dd2b891?w=400' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>かおりと福岡クリスマス</Text>
        <Text style={styles.subtitle}>アプリが正常に起動しました</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/opening')}
        >
          <Text style={styles.buttonText}>ゲームを始める</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/chat')}
        >
          <Text style={styles.buttonTextSecondary}>チャットをテスト</Text>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.infoText}>制限時間：24時間</Text>
          <Text style={styles.infoText}>目標：かおりとの好感度を上げよう！</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    backgroundColor: '#ff4757',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#ff4757',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    marginTop: 30,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
