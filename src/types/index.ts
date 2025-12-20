// User types
export interface User {
  id: string;
  nickname: string;
  created_at: string;
  game_started_at: string | null;
  total_score: number;
  affection: number;
  steps_today: number;
  game_completed: boolean;
}

// Spot types
export interface Spot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  base_point: number;
  is_secret: boolean;
  unlock_condition: string | null;
  event_script: string;
}

// Check-in types
export interface CheckIn {
  id: string;
  user_id: string;
  spot_id: string;
  checked_at: string;
  earned_points: number;
  selected_choice: number | null;
  affection_change: number;
}

// Chat types
export interface ChatLog {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Game state types
export interface GameState {
  user: User | null;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  nearbySpots: Spot[];
  timeRemaining: number; // milliseconds
  isGameActive: boolean;
}

// Event types
export interface EventChoice {
  id: number;
  text: string;
  affection_change: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  background_image?: string;
  kaori_image?: string;
  choices: EventChoice[];
}

// Ending types
export type EndingType = 'BAD' | 'NORMAL' | 'GOOD';

export interface Ending {
  type: EndingType;
  title: string;
  description: string;
  image?: string;
}