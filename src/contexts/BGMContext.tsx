/**
 * BGM Context
 *
 * Manages background music playback throughout the app.
 * Features:
 * - Automatic looping
 * - Fade transitions between tracks
 * - Volume control
 * - Mute toggle with persistence
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus, AVPlaybackSource } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// BGM track types
export type BGMTrack =
  | 'title'
  | 'daily'
  | 'event'
  | 'romantic'
  | 'sad'
  | 'ending_bad'
  | 'ending_good'
  | 'ending_true'
  | null;

// BGM sources - static require for Metro bundler
const BGM_SOURCES: Record<Exclude<BGMTrack, null>, AVPlaybackSource> = {
  title: require('../../assets/audio/bgm_title.mp3'),
  daily: require('../../assets/audio/bgm_daily.mp3'),
  event: require('../../assets/audio/bgm_event.mp3'),
  romantic: require('../../assets/audio/bgm_romantic.mp3'),
  sad: require('../../assets/audio/bgm_sad.mp3'),
  ending_bad: require('../../assets/audio/bgm_ending_bad.mp3'),
  ending_good: require('../../assets/audio/bgm_ending_good.mp3'),
  ending_true: require('../../assets/audio/bgm_ending_true.mp3'),
};

const BGM_MUTED_KEY = 'kaori_bgm_muted';
const BGM_VOLUME_KEY = 'kaori_bgm_volume';
const DEFAULT_VOLUME = 0.5;
const FADE_DURATION = 1000; // ms

interface BGMContextType {
  currentTrack: BGMTrack;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playBGM: (track: BGMTrack) => Promise<void>;
  stopBGM: () => Promise<void>;
  pauseBGM: () => Promise<void>;
  resumeBGM: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  fadeToTrack: (track: BGMTrack) => Promise<void>;
}

const BGMContext = createContext<BGMContextType | null>(null);

export function BGMProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<BGMTrack>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [isInitialized, setIsInitialized] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const isFadingRef = useRef(false);

  // Initialize audio mode and load preferences
  useEffect(() => {
    const init = async () => {
      try {
        // Set audio mode for background playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Load saved preferences
        const [mutedStr, volumeStr] = await Promise.all([
          AsyncStorage.getItem(BGM_MUTED_KEY),
          AsyncStorage.getItem(BGM_VOLUME_KEY),
        ]);

        if (mutedStr !== null) {
          setIsMuted(mutedStr === 'true');
        }
        if (volumeStr !== null) {
          setVolumeState(parseFloat(volumeStr));
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setIsInitialized(true);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Play a BGM track
  const playBGM = useCallback(async (track: BGMTrack) => {
    if (!track || !isInitialized) return;

    try {
      // Unload previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        BGM_SOURCES[track],
        {
          isLooping: true,
          volume: isMuted ? 0 : volume,
          shouldPlay: true,
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play BGM:', error);
    }
  }, [isInitialized, isMuted, volume]);

  // Stop BGM
  const stopBGM = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setCurrentTrack(null);
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to stop BGM:', error);
    }
  }, []);

  // Pause BGM
  const pauseBGM = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to pause BGM:', error);
    }
  }, []);

  // Resume BGM
  const resumeBGM = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to resume BGM:', error);
    }
  }, []);

  // Fade out current track and fade in new track
  const fadeToTrack = useCallback(async (track: BGMTrack) => {
    if (isFadingRef.current) return;
    if (track === currentTrack) return;

    isFadingRef.current = true;

    try {
      // Fade out current track
      if (soundRef.current && isPlaying) {
        const steps = 10;
        const stepDuration = FADE_DURATION / steps;
        const volumeStep = volume / steps;

        for (let i = steps; i >= 0; i--) {
          if (!soundRef.current) break;
          await soundRef.current.setVolumeAsync(isMuted ? 0 : volumeStep * i);
          await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
      }

      // Stop and play new track
      if (track) {
        await playBGM(track);

        // Fade in new track
        if (soundRef.current && !isMuted) {
          const steps = 10;
          const stepDuration = FADE_DURATION / steps;
          const volumeStep = volume / steps;

          await soundRef.current.setVolumeAsync(0);
          for (let i = 1; i <= steps; i++) {
            if (!soundRef.current) break;
            await soundRef.current.setVolumeAsync(volumeStep * i);
            await new Promise(resolve => setTimeout(resolve, stepDuration));
          }
        }
      } else {
        await stopBGM();
      }
    } catch (error) {
      console.error('Failed to fade BGM:', error);
    } finally {
      isFadingRef.current = false;
    }
  }, [currentTrack, isPlaying, isMuted, volume, playBGM, stopBGM]);

  // Set muted state
  const setMuted = useCallback(async (muted: boolean) => {
    setIsMuted(muted);
    try {
      await AsyncStorage.setItem(BGM_MUTED_KEY, String(muted));
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(muted ? 0 : volume);
      }
    } catch (error) {
      console.error('Failed to set muted:', error);
    }
  }, [volume]);

  // Set volume
  const setVolume = useCallback(async (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    try {
      await AsyncStorage.setItem(BGM_VOLUME_KEY, String(clampedVolume));
      if (soundRef.current && !isMuted) {
        await soundRef.current.setVolumeAsync(clampedVolume);
      }
    } catch (error) {
      console.error('Failed to set volume:', error);
    }
  }, [isMuted]);

  // Playback status update handler
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Playback error:', status.error);
      }
    }
  };

  const value: BGMContextType = {
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    playBGM,
    stopBGM,
    pauseBGM,
    resumeBGM,
    setMuted,
    setVolume,
    fadeToTrack,
  };

  return <BGMContext.Provider value={value}>{children}</BGMContext.Provider>;
}

export function useBGM() {
  const context = useContext(BGMContext);
  if (!context) {
    throw new Error('useBGM must be used within a BGMProvider');
  }
  return context;
}
