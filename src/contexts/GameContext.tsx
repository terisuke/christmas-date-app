import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, getCurrentUser, getUserProfile, updateUserScore, createCheckIn } from '../services/supabase';
import { User, Spot } from '../types';
import { EndingType, getEndingTypeFromMatrix } from '../constants/endings';
import { Achievement, AchievementId } from '../constants/achievements';
import { checkAndUnlockAchievements, UnlockedAchievement } from '../services/achievementStorage';

interface EventScript {
  title: string;
  dialogue: string[];
  choices: {
    text: string;
    points: number;
    affection: number;
  }[];
}

interface GameContextType {
  user: User | null;
  score: number;
  affection: number;
  stepsToday: number;
  checkInCount: number;
  chatCount: number;
  timeRemaining: number;
  gameDuration: number;
  gameStartedAt: Date | null;
  isLoading: boolean;
  checkedInSpots: string[];
  totalSpots: number;
  allClearBonusApplied: boolean;
  newlyUnlockedAchievements: Achievement[];

  setUser: (user: User | null) => void;
  addScore: (points: number) => void;
  addAffection: (change: number) => void;
  addSteps: (steps: number) => void;
  incrementChatCount: () => void;
  checkIn: (spotId: string, earnedPoints: number, selectedChoice: number | null, affectionChange: number) => Promise<void>;
  startGame: (nickname: string) => Promise<void>;
  loadGameState: () => Promise<void>;
  resetGame: () => void;
  getEndingType: () => EndingType;
  checkAllClearBonus: () => void;
  dismissAchievementNotification: () => void;
  triggerAchievementCheck: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Fixed 9-hour game duration
const GAME_DURATION = 9 * 60 * 60 * 1000; // 9 hours fixed
const TOTAL_SPOTS = 9; // 6 normal + 3 secret spots
const ALL_CLEAR_BONUS = 500;

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [score, setScore] = useState(0);
  const [affection, setAffection] = useState(1);
  const [stepsToday, setStepsToday] = useState(0);
  const [checkInCount, setCheckInCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [gameDuration, setGameDuration] = useState(GAME_DURATION);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [gameStartedAt, setGameStartedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedInSpots, setCheckedInSpots] = useState<string[]>([]);
  const [allClearBonusApplied, setAllClearBonusApplied] = useState(false);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Achievement[]>([]);

  // Countdown timer
  useEffect(() => {
    if (!gameStartedAt) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - gameStartedAt.getTime();
      const remaining = Math.max(0, gameDuration - elapsed);
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartedAt, gameDuration]);

  // Check for all-clear bonus
  const checkAllClearBonus = useCallback(() => {
    if (!allClearBonusApplied && checkedInSpots.length >= TOTAL_SPOTS) {
      setAllClearBonusApplied(true);
      setScore(prev => prev + ALL_CLEAR_BONUS);
      return true;
    }
    return false;
  }, [allClearBonusApplied, checkedInSpots.length]);

  // Achievement system functions
  const dismissAchievementNotification = useCallback(() => {
    setNewlyUnlockedAchievements([]);
  }, []);

  const triggerAchievementCheck = useCallback(async () => {
    const gameState = {
      checkInCount,
      checkedInSpots,
      chatCount,
      steps: stepsToday,
      affection,
      score,
      timeRemaining,
    };

    const unlocked = await checkAndUnlockAchievements(gameState);

    if (unlocked.length > 0) {
      // Get full achievement data for newly unlocked
      const { ACHIEVEMENTS } = await import('../constants/achievements');
      const newAchievements = unlocked.map(u => ACHIEVEMENTS[u.id]);
      setNewlyUnlockedAchievements(prev => [...prev, ...newAchievements]);

      // Add bonus points from achievements
      const bonusTotal = newAchievements.reduce((sum, a) => sum + a.bonusPoints, 0);
      if (bonusTotal > 0) {
        setScore(prev => prev + bonusTotal);
      }
    }
  }, [checkInCount, checkedInSpots, chatCount, stepsToday, affection, score, timeRemaining]);

  // Auto-check achievements when key state changes
  useEffect(() => {
    // Only check if game is in progress
    if (gameStartedAt && (checkInCount > 0 || stepsToday > 0 || chatCount > 0)) {
      triggerAchievementCheck();
    }
  }, [checkInCount, stepsToday, chatCount, affection]);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const newScore = Math.max(0, prev + points);
      return newScore;
    });
  }, []);

  const addAffection = useCallback((change: number) => {
    setAffection(prev => {
      const newAffection = Math.max(1, Math.min(5, prev + change));
      return newAffection;
    });
  }, []);

  const addSteps = useCallback((steps: number) => {
    setStepsToday(prev => prev + steps);
    // 100 steps = 1 point
    const bonusPoints = Math.floor(steps / 100);
    if (bonusPoints > 0) {
      addScore(bonusPoints);
    }
  }, [addScore]);

  const incrementChatCount = useCallback(() => {
    setChatCount(prev => prev + 1);
  }, []);

  const checkIn = useCallback(async (
    spotId: string,
    earnedPoints: number,
    selectedChoice: number | null,
    affectionChange: number
  ) => {
    try {
      // Save to database
      await createCheckIn(spotId, earnedPoints, selectedChoice, affectionChange);

      // Update local state
      addScore(earnedPoints);
      addAffection(affectionChange);
      setCheckInCount(prev => prev + 1);
      setCheckedInSpots(prev => [...prev, spotId]);

      // Update user score in database
      await updateUserScore(score + earnedPoints, Math.max(1, Math.min(5, affection + affectionChange)));
    } catch (error) {
      console.error('Check-in error:', error);
      // Still update local state even if DB fails
      addScore(earnedPoints);
      addAffection(affectionChange);
      setCheckInCount(prev => prev + 1);
      setCheckedInSpots(prev => [...prev, spotId]);
    }
  }, [addScore, addAffection, score, affection]);

  const startGame = useCallback(async (nickname: string) => {
    try {
      setIsLoading(true);

      const startTime = new Date();

      // Try to get current user from Supabase session (if available)
      const currentUser = await getCurrentUser();
      const userId = currentUser?.id || `local-${Date.now()}`;

      if (currentUser) {
        // Create user profile in database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            nickname,
            game_started_at: startTime.toISOString(),
            total_score: 0,
            affection: 1,
            steps_today: 0,
            game_completed: false,
          })
          .select()
          .single();

        if (userError) throw userError;
        setUser(userData);
      } else {
        // Local-only mode (guest mode)
        setUser({
          id: userId,
          nickname,
          created_at: startTime.toISOString(),
          game_started_at: startTime.toISOString(),
          total_score: 0,
          affection: 1,
          steps_today: 0,
          game_completed: false,
        });
      }

      setGameStartedAt(startTime);
      setGameDuration(GAME_DURATION);
      setScore(0);
      setAffection(1);
      setStepsToday(0);
      setCheckInCount(0);
      setChatCount(0);
      setTimeRemaining(GAME_DURATION);
      setCheckedInSpots([]);
      setAllClearBonusApplied(false);
    } catch (error) {
      console.error('Start game error:', error);
      // Fallback to local-only mode
      const startTime = new Date();
      setGameStartedAt(startTime);
      setGameDuration(GAME_DURATION);
      setTimeRemaining(GAME_DURATION);
      setUser({
        id: `local-${Date.now()}`,
        nickname,
        created_at: startTime.toISOString(),
        game_started_at: startTime.toISOString(),
        total_score: 0,
        affection: 1,
        steps_today: 0,
        game_completed: false,
      });
      setAllClearBonusApplied(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGameState = useCallback(async () => {
    try {
      setIsLoading(true);

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await getUserProfile();
      if (profile) {
        setUser(profile);
        setScore(profile.total_score || 0);
        setAffection(profile.affection || 1);
        setStepsToday(profile.steps_today || 0);

        if (profile.game_started_at) {
          setGameStartedAt(new Date(profile.game_started_at));
        }

        // Load check-ins
        const { data: checkins } = await supabase
          .from('checkins')
          .select('spot_id')
          .eq('user_id', currentUser.id);

        if (checkins) {
          setCheckedInSpots(checkins.map(c => c.spot_id));
          setCheckInCount(checkins.length);
        }

        // Load chat count
        const { data: chats, count } = await supabase
          .from('chat_logs')
          .select('id', { count: 'exact' })
          .eq('user_id', currentUser.id)
          .eq('role', 'user');

        if (count) {
          setChatCount(count);
        }
      }
    } catch (error) {
      console.error('Load game state error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetGame = useCallback(() => {
    setUser(null);
    setScore(0);
    setAffection(1);
    setStepsToday(0);
    setCheckInCount(0);
    setChatCount(0);
    setGameDuration(GAME_DURATION);
    setTimeRemaining(GAME_DURATION);
    setGameStartedAt(null);
    setCheckedInSpots([]);
    setAllClearBonusApplied(false);
  }, []);

  const getEndingType = useCallback((): EndingType => {
    // Use affection × score matrix for ending determination
    // See src/constants/endings.ts for full matrix
    return getEndingTypeFromMatrix(score, affection);
  }, [score, affection]);

  return (
    <GameContext.Provider
      value={{
        user,
        score,
        affection,
        stepsToday,
        checkInCount,
        chatCount,
        timeRemaining,
        gameDuration,
        gameStartedAt,
        isLoading,
        checkedInSpots,
        totalSpots: TOTAL_SPOTS,
        allClearBonusApplied,
        newlyUnlockedAchievements,
        setUser,
        addScore,
        addAffection,
        addSteps,
        incrementChatCount,
        checkIn,
        startGame,
        loadGameState,
        resetGame,
        getEndingType,
        checkAllClearBonus,
        dismissAchievementNotification,
        triggerAchievementCheck,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
