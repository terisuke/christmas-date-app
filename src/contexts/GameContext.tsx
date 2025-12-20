import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, getCurrentUser, getUserProfile, updateUserScore, createCheckIn } from '../services/supabase';
import { User, Spot } from '../types';

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

  setUser: (user: User | null) => void;
  addScore: (points: number) => void;
  addAffection: (change: number) => void;
  addSteps: (steps: number) => void;
  incrementChatCount: () => void;
  checkIn: (spotId: string, earnedPoints: number, selectedChoice: number | null, affectionChange: number) => Promise<void>;
  startGame: (nickname: string) => Promise<void>;
  loadGameState: () => Promise<void>;
  resetGame: () => void;
  getEndingType: () => 'BAD' | 'NORMAL' | 'GOOD' | 'TRUE';
  checkAllClearBonus: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Variable game duration based on start time (8-10 hours)
const calculateGameDuration = (startHour: number): number => {
  // Morning start (before 10am): 10 hours
  // Midday start (10am-2pm): 9 hours
  // Afternoon start (2pm-6pm): 8 hours
  // Evening start (after 6pm): 6 hours (shorter for late starters)
  if (startHour < 10) {
    return 10 * 60 * 60 * 1000; // 10 hours
  } else if (startHour < 14) {
    return 9 * 60 * 60 * 1000; // 9 hours
  } else if (startHour < 18) {
    return 8 * 60 * 60 * 1000; // 8 hours
  } else {
    return 6 * 60 * 60 * 1000; // 6 hours
  }
};

const DEFAULT_GAME_DURATION = 8 * 60 * 60 * 1000; // 8 hours default
const TOTAL_SPOTS = 9; // 6 normal + 3 secret spots
const ALL_CLEAR_BONUS = 500;

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [score, setScore] = useState(0);
  const [affection, setAffection] = useState(1);
  const [stepsToday, setStepsToday] = useState(0);
  const [checkInCount, setCheckInCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [gameDuration, setGameDuration] = useState(DEFAULT_GAME_DURATION);
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_GAME_DURATION);
  const [gameStartedAt, setGameStartedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedInSpots, setCheckedInSpots] = useState<string[]>([]);
  const [allClearBonusApplied, setAllClearBonusApplied] = useState(false);

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
      const duration = calculateGameDuration(startTime.getHours());

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
      setGameDuration(duration);
      setScore(0);
      setAffection(1);
      setStepsToday(0);
      setCheckInCount(0);
      setChatCount(0);
      setTimeRemaining(duration);
      setCheckedInSpots([]);
      setAllClearBonusApplied(false);
    } catch (error) {
      console.error('Start game error:', error);
      // Fallback to local-only mode
      const startTime = new Date();
      const duration = calculateGameDuration(startTime.getHours());
      setGameStartedAt(startTime);
      setGameDuration(duration);
      setTimeRemaining(duration);
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
    setGameDuration(DEFAULT_GAME_DURATION);
    setTimeRemaining(DEFAULT_GAME_DURATION);
    setGameStartedAt(null);
    setCheckedInSpots([]);
    setAllClearBonusApplied(false);
  }, []);

  const getEndingType = useCallback((): 'BAD' | 'NORMAL' | 'GOOD' | 'TRUE' => {
    // Score thresholds: BAD<600, NORMAL<1200, GOOD<1800, TRUE>=1800
    if (score < 600) return 'BAD';
    if (score < 1200) return 'NORMAL';
    if (score < 1800) return 'GOOD';
    return 'TRUE';
  }, [score]);

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
