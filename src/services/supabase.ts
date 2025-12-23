import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Development mode: Skip authentication and use mock data
const DEV_USER_ID = 'dev-user-12345';
const isDevMode = __DEV__;

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          created_at: string;
          game_started_at: string | null;
          total_score: number;
          affection: number;
          steps_today: number;
          game_completed: boolean;
        };
        Insert: {
          id?: string;
          nickname: string;
          created_at?: string;
          game_started_at?: string | null;
          total_score?: number;
          affection?: number;
          steps_today?: number;
          game_completed?: boolean;
        };
        Update: {
          id?: string;
          nickname?: string;
          created_at?: string;
          game_started_at?: string | null;
          total_score?: number;
          affection?: number;
          steps_today?: number;
          game_completed?: boolean;
        };
      };
      spots: {
        Row: {
          id: string;
          name: string;
          lat: number;
          lng: number;
          base_point: number;
          is_secret: boolean;
          unlock_condition: string | null;
          event_script: string;
        };
        Insert: {
          id: string;
          name: string;
          lat: number;
          lng: number;
          base_point: number;
          is_secret?: boolean;
          unlock_condition?: string | null;
          event_script: string;
        };
        Update: {
          id?: string;
          name?: string;
          lat?: number;
          lng?: number;
          base_point?: number;
          is_secret?: boolean;
          unlock_condition?: string | null;
          event_script?: string;
        };
      };
      checkins: {
        Row: {
          id: string;
          user_id: string;
          spot_id: string;
          checked_at: string;
          earned_points: number;
          selected_choice: number | null;
          affection_change: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          spot_id: string;
          checked_at?: string;
          earned_points: number;
          selected_choice?: number | null;
          affection_change: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          spot_id?: string;
          checked_at?: string;
          earned_points?: number;
          selected_choice?: number | null;
          affection_change?: number;
        };
      };
      chat_logs: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Auth functions
export const signInAnonymously = async () => {
  const { data, error } = await supabase.auth.signInAnonymously();
  return { data, error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  // In dev mode, return a mock user if not authenticated
  if (!user && isDevMode) {
    return { id: DEV_USER_ID } as any;
  }

  return user;
};

// User functions
export const createUser = async (nickname: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        nickname,
        total_score: 0,
        affection: 1,
        steps_today: 0,
        game_completed: false,
      })
      .select()
      .single();

    if (error && isDevMode) {
      console.log('[DEV] createUser skipped:', error.message);
      return { data: { id: user.id, nickname, total_score: 0, affection: 1, steps_today: 0, game_completed: false }, error: null };
    }

    return { data, error };
  } catch (e) {
    if (isDevMode) {
      console.log('[DEV] createUser error skipped:', e);
      return { data: { id: user.id, nickname, total_score: 0, affection: 1, steps_today: 0, game_completed: false }, error: null };
    }
    throw e;
  }
};

export const getUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && isDevMode) {
      console.log('[DEV] getUserProfile skipped:', error.message);
      return { data: null, error: null };
    }

    return { data, error };
  } catch (e) {
    if (isDevMode) {
      console.log('[DEV] getUserProfile error skipped:', e);
      return { data: null, error: null };
    }
    throw e;
  }
};

export const updateUserScore = async (score: number, affection: number) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ total_score: score, affection })
      .eq('id', user.id)
      .select()
      .single();

    if (error && isDevMode) {
      console.log('[DEV] updateUserScore skipped:', error.message);
      return { data: { total_score: score, affection }, error: null };
    }

    return { data, error };
  } catch (e) {
    if (isDevMode) {
      console.log('[DEV] updateUserScore error skipped:', e);
      return { data: { total_score: score, affection }, error: null };
    }
    throw e;
  }
};

// Check-in functions
export const createCheckIn = async (spotId: string, earnedPoints: number, selectedChoice: number | null, affectionChange: number) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
        spot_id: spotId,
        earned_points: earnedPoints,
        selected_choice: selectedChoice,
        affection_change: affectionChange,
      })
      .select()
      .single();

    if (error && isDevMode) {
      console.log('[DEV] createCheckIn skipped:', error.message);
      return {
        data: {
          id: `dev-checkin-${Date.now()}`,
          user_id: user.id,
          spot_id: spotId,
          earned_points: earnedPoints,
          selected_choice: selectedChoice,
          affection_change: affectionChange,
          checked_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    return { data, error };
  } catch (e) {
    if (isDevMode) {
      console.log('[DEV] createCheckIn error skipped:', e);
      return {
        data: {
          id: `dev-checkin-${Date.now()}`,
          user_id: user.id,
          spot_id: spotId,
          earned_points: earnedPoints,
          selected_choice: selectedChoice,
          affection_change: affectionChange,
          checked_at: new Date().toISOString(),
        },
        error: null,
      };
    }
    throw e;
  }
};

// Chat functions
export const saveChatMessage = async (role: 'user' | 'assistant', content: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase
      .from('chat_logs')
      .insert({
        user_id: user.id,
        role,
        content,
      })
      .select()
      .single();

    if (error && isDevMode) {
      console.log('[DEV] saveChatMessage skipped:', error.message);
      return {
        data: {
          id: `dev-chat-${Date.now()}`,
          user_id: user.id,
          role,
          content,
          created_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    return { data, error };
  } catch (e) {
    if (isDevMode) {
      console.log('[DEV] saveChatMessage error skipped:', e);
      return {
        data: {
          id: `dev-chat-${Date.now()}`,
          user_id: user.id,
          role,
          content,
          created_at: new Date().toISOString(),
        },
        error: null,
      };
    }
    throw e;
  }
};

export const getChatHistory = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase
      .from('chat_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error && isDevMode) {
      console.log('[DEV] getChatHistory skipped:', error.message);
      return { data: [], error: null };
    }

    return { data, error };
  } catch (e) {
    if (isDevMode) {
      console.log('[DEV] getChatHistory error skipped:', e);
      return { data: [], error: null };
    }
    throw e;
  }
};