import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, router } from 'expo-router';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSignUp = useCallback(async () => {
    if (!isLoaded) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('入力エラー', 'パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      Alert.alert('入力エラー', 'パスワードは8文字以上で入力してください');
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password: password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', err);
      const errorMessage = err.errors?.[0]?.message || '登録に失敗しました';
      Alert.alert('登録エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp, email, password, confirmPassword]);

  const onVerify = useCallback(async () => {
    if (!isLoaded) return;

    if (!verificationCode.trim()) {
      Alert.alert('入力エラー', '確認コードを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/home');
      } else {
        console.log('Verification incomplete:', result);
        Alert.alert('エラー', '確認に失敗しました。もう一度お試しください。');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      const errorMessage = err.errors?.[0]?.message || '確認に失敗しました';
      Alert.alert('確認エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp, setActive, verificationCode]);

  const onResendCode = useCallback(async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('送信完了', '確認コードを再送信しました');
    } catch (err: any) {
      console.error('Resend error:', err);
      Alert.alert('エラー', '再送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signUp]);

  if (pendingVerification) {
    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1544042259-ea9a0dd2b891?w=400' }}
        style={styles.container}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <View style={styles.content}>
            <Text style={styles.title}>メール確認</Text>
            <Text style={styles.subtitle}>
              {email} に確認コードを送信しました
            </Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="確認コード"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={onVerify}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>確認する</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onResendCode}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>コードを再送信</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setPendingVerification(false)}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>戻る</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1544042259-ea9a0dd2b891?w=400' }}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <Text style={styles.title}>新規登録</Text>
          <Text style={styles.subtitle}>かおりと福岡クリスマス</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="パスワード (8文字以上)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="パスワード (確認)"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={onSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>登録する</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>既にアカウントをお持ちの方は</Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.linkText}>ログイン</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  form: {
    width: '100%',
    maxWidth: 320,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  button: {
    backgroundColor: '#ff4757',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginRight: 8,
  },
  linkText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
