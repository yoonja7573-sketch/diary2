export type MoodId = 'happy' | 'calm' | 'excited' | 'sad' | 'anxious' | 'angry';

export type WeatherEmoji = '☀️' | '⛅' | '🌧️' | '❄️';

export type EditorFont = 'font-myeongjo' | 'font-batang' | 'font-pen' | 'font-sans';

export type TabName = 'calendar' | 'editor' | 'stats' | 'settings';

export type BgmChannel = 'rain' | 'fire' | 'piano';

export interface MoodOption {
  id: MoodId;
  label: string;
  emoji: string;
  color: string;
  comment: string;
}

export interface DiaryEntry {
  date: string;
  mood: MoodId;
  weather: WeatherEmoji;
  font: EditorFont;
  content: string;
  photo: string | null;
  caption: string;
  aiComfort?: string;
  updatedAt: string;
}

export interface AppSettings {
  darkMode: boolean;
  pinCode: string | null;
}

export interface BgmChannelState {
  active: boolean;
  volume: number;
}

export type BgmMixerState = Record<BgmChannel, BgmChannelState>;
