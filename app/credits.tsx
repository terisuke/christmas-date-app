import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreditsScreen() {
  const handleOpenURL = (url: string) => {
    Linking.openURL(url);
  };

  const credits = [
    {
      category: '企画・開発',
      items: ['雪の降らない聖夜に 開発チーム'],
    },
    {
      category: 'キャラクターデザイン',
      items: ['雪村かおり - オリジナルキャラクター'],
    },
    {
      category: 'BGM',
      items: ['甘茶の音楽工房 (Music Atelier Amacha)'],
      url: 'https://amachamusic.chagasi.com/',
    },
    {
      category: '背景画像',
      items: ['写真提供：福岡市'],
    },
    {
      category: 'AI技術',
      items: ['OpenRouter API', 'Google Gemini', 'OpenAI GPT'],
    },
    {
      category: 'フレームワーク',
      items: ['React Native', 'Expo', 'Expo Router'],
    },
    {
      category: '認証',
      items: ['Clerk'],
    },
    {
      category: 'バックエンド',
      items: ['Supabase'],
    },
    {
      category: 'アイコン',
      items: ['Ionicons'],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>クレジット</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.appTitle}>雪の降らない聖夜に</Text>
          <Text style={styles.appSubtitle}>A Christmas Eve Without Snow</Text>
        </View>

        {/* Credits List */}
        {credits.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.category}</Text>
            {section.items.map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.creditItem}>{item}</Text>
            ))}
            {section.url && (
              <TouchableOpacity onPress={() => handleOpenURL(section.url!)}>
                <Text style={styles.creditLink}>{section.url}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>2024 雪の降らない聖夜に</Text>
          <Text style={styles.thanks}>Thank you for playing!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    backgroundColor: '#ff4757',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff4757',
    marginBottom: 10,
  },
  creditItem: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
    paddingLeft: 10,
  },
  creditLink: {
    fontSize: 12,
    color: '#4a90d9',
    paddingLeft: 10,
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  copyright: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
  },
  thanks: {
    fontSize: 16,
    color: '#ff4757',
    fontWeight: '600',
  },
});
