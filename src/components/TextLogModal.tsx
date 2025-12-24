/**
 * Text Log Modal Component
 *
 * Standard visual novel feature for reviewing dialogue history.
 * Opens as a modal overlay, scrollable list of all dialogue.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextLogEntry, loadTextLog } from '../services/textLogStorage';

const { height } = Dimensions.get('window');

interface TextLogModalProps {
  visible: boolean;
  onClose: () => void;
}

// Format timestamp to readable time
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get color for log entry type
function getEntryColor(type: TextLogEntry['type']): string {
  switch (type) {
    case 'dialogue':
      return '#333';
    case 'narration':
      return '#666';
    case 'choice':
      return '#ff4757';
    case 'system':
      return '#999';
    default:
      return '#333';
  }
}

// Get speaker color
function getSpeakerColor(speaker: string): string {
  if (speaker === 'かおり') return '#ff4757';
  if (speaker === 'あなた') return '#4a90d9';
  return '#666';
}

export function TextLogModal({ visible, onClose }: TextLogModalProps) {
  const [entries, setEntries] = useState<TextLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Load entries when modal opens
  useEffect(() => {
    if (visible) {
      setLoading(true);
      loadTextLog().then((log) => {
        setEntries(log);
        setLoading(false);
        // Scroll to bottom (most recent)
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      });

      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  const handleClose = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [fadeAnim, onClose]);

  const renderEntry = useCallback(({ item }: { item: TextLogEntry }) => {
    const isChoice = item.type === 'choice';
    const isNarration = item.type === 'narration';
    const isSystem = item.type === 'system';

    return (
      <View style={[styles.entry, isChoice && styles.choiceEntry]}>
        {/* Time stamp */}
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>

        {/* Speaker name (if dialogue) */}
        {item.speaker && (
          <Text style={[styles.speaker, { color: getSpeakerColor(item.speaker) }]}>
            {item.speaker}
          </Text>
        )}

        {/* Text content */}
        <Text
          style={[
            styles.text,
            { color: getEntryColor(item.type) },
            isNarration && styles.narrationText,
            isSystem && styles.systemText,
          ]}
        >
          {isChoice ? `> ${item.text}` : item.type === 'dialogue' ? `「${item.text}」` : item.text}
        </Text>

        {/* Expression indicator (if available) */}
        {item.expression && (
          <Text style={styles.expression}>({item.expression})</Text>
        )}
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: TextLogEntry) => item.id, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Background overlay */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Log panel */}
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>テキストログ</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>読み込み中...</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>まだログがありません</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={entries}
              renderItem={renderEntry}
              keyExtractor={keyExtractor}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              initialNumToRender={30}
              maxToRenderPerBatch={20}
            />
          )}

          {/* Footer hint */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {entries.length > 0 ? `${entries.length}件のログ` : 'タップで閉じる'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  panel: {
    width: '90%',
    maxHeight: height * 0.75,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
  },
  entry: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  choiceEntry: {
    backgroundColor: 'rgba(255, 71, 87, 0.05)',
  },
  timestamp: {
    fontSize: 10,
    color: '#bbb',
    marginBottom: 2,
  },
  speaker: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  narrationText: {
    fontStyle: 'italic',
  },
  systemText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  expression: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 4,
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
