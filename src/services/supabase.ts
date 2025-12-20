import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  return user;
};

// User functions
export const createUser = async (nickname: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

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

  return { data, error };
};

export const getUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return { data, error };
};

export const updateUserScore = async (score: number, affection: number) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update({ total_score: score, affection })
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
};

// Check-in functions
export const createCheckIn = async (spotId: string, earnedPoints: number, selectedChoice: number | null, affectionChange: number) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

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

  return { data, error };
};

// Chat functions
export const saveChatMessage = async (role: 'user' | 'assistant', content: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('chat_logs')
    .insert({
      user_id: user.id,
      role,
      content,
    })
    .select()
    .single();

  return { data, error };
};

export const getChatHistory = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('chat_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return { data, error };
};