import type { DiaryEntry, EditorFont, MoodOption, WeatherEmoji } from './types';

export const STORAGE_KEY_ENTRIES = 'pieces_of_night_entries_v1';
export const STORAGE_KEY_SETTINGS = 'pieces_of_night_settings_v1';

export const MOODS: MoodOption[] = [
  {
    id: 'happy',
    label: '기쁨',
    emoji: '😊',
    color: '#E6B86A',
    comment: '따뜻하고 반짝이는 순간들이 가득한 한 달이었네요.',
  },
  {
    id: 'calm',
    label: '평온',
    emoji: '😌',
    color: '#7FB093',
    comment: '잔잔한 호수처럼 차분하고 안정적인 날들이 많았어요.',
  },
  {
    id: 'excited',
    label: '설렘',
    emoji: '🥰',
    color: '#E58A9B',
    comment: '두근거리는 설렘과 기대감이 일상을 채워준 달이었어요.',
  },
  {
    id: 'sad',
    label: '우울',
    emoji: '😢',
    color: '#7A9CC6',
    comment: '조금 가라앉는 날도 있었지만, 기록하며 스스로를 잘 다독였어요.',
  },
  {
    id: 'anxious',
    label: '불안',
    emoji: '😰',
    color: '#9D8EC7',
    comment: '마음이 분주했던 순간들을 글로 풀어내며 한 걸음씩 나아갔어요.',
  },
  {
    id: 'angry',
    label: '화남',
    emoji: '😤',
    color: '#D9776C',
    comment: '답답했던 감정을 솔직하게 털어놓으며 마음을 비워낸 한 달이에요.',
  },
];

export const WEATHERS: WeatherEmoji[] = ['☀️', '⛅', '🌧️', '❄️'];

export const FONT_OPTIONS: { id: EditorFont; label: string; className: string }[] = [
  { id: 'font-myeongjo', label: '나눔명조', className: 'font-myeongjo text-xs' },
  { id: 'font-batang', label: '고운바탕', className: 'font-batang text-xs' },
  { id: 'font-pen', label: '손글씨', className: 'font-pen text-sm' },
  { id: 'font-sans', label: '고딕', className: 'font-sans text-xs' },
];

export const DAILY_PROMPTS: string[] = [
  '오늘 하루 중 가장 따뜻하게 기억되는 장면은 무엇인가요?',
  '지금 이 순간, 나에게 가장 해주고 싶은 위로의 말은?',
  '오늘 우연히 마주친 소소한 행복이 있다면 적어보세요.',
  '요즘 내 마음을 가장 많이 차지하고 있는 생각은 무엇인가요?',
  '오늘 고마웠던 사람이나 순간을 하나만 떠올려 본다면?',
  '비 내리는 밤, 창밖을 보며 떠올리고 싶은 기억이 있나요?',
];

export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatKoreanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${m}월 ${d}일 ${weekdays[dateObj.getDay()]}`;
}

export function buildSampleEntries(year: number, monthIndex: number): Record<string, DiaryEntry> {
  const m = String(monthIndex + 1).padStart(2, '0');
  const nowIso = new Date().toISOString();
  const samples: DiaryEntry[] = [
    {
      date: `${year}-${m}-03`,
      mood: 'calm',
      weather: '⛅',
      font: 'font-myeongjo',
      content:
        '오랜만에 알람 없이 늦잠을 잤다. 창문 틈으로 들어오는 오후의 햇살이 포근해서 차 한 잔을 내려 마시며 책을 읽었다.',
      photo: null,
      caption: '',
      updatedAt: nowIso,
    },
    {
      date: `${year}-${m}-10`,
      mood: 'happy',
      weather: '☀️',
      font: 'font-batang',
      content:
        '퇴근길 하늘이 붉은 노을빛으로 물들어 걸음을 멈췄다. 바쁜 하루 끝에도 이런 풍경을 볼 수 있어 참 다행이라는 생각이 들었다.',
      photo: null,
      caption: '',
      updatedAt: nowIso,
    },
    {
      date: getTodayStr(),
      mood: 'excited',
      weather: '🌧️',
      font: 'font-myeongjo',
      content:
        '창밖에 잔잔하게 빗소리가 내리는 밤. 조용히 나만의 생각들을 기록하기 시작하니 마음이 한결 차분해진다.',
      photo: null,
      caption: '',
      updatedAt: nowIso,
    },
  ];

  const record: Record<string, DiaryEntry> = {};
  samples.forEach((item) => {
    record[item.date] = item;
  });
  return record;
}
