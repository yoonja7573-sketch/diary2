import { useRef, useState, type ChangeEvent } from 'react';
import {
  DAILY_PROMPTS,
  FONT_OPTIONS,
  MOODS,
  WEATHERS,
  formatKoreanDate,
} from '../constants';
import type {
  BgmChannel,
  BgmMixerState,
  DiaryEntry,
  EditorFont,
  MoodId,
  WeatherEmoji,
} from '../types';

interface EditorTabProps {
  editorDate: string;
  existingEntry: DiaryEntry | undefined;
  bgmMixer: BgmMixerState;
  onBackToCalendar: () => void;
  onSaveEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (dateStr: string) => void;
  onToggleBgmChannel: (channel: BgmChannel) => void;
  onSetBgmVolume: (channel: BgmChannel, volume: number) => void;
  onMuteAllBgm: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

const BGM_CHANNEL_META: { id: BgmChannel; icon: string; label: string }[] = [
  { id: 'rain', icon: '🌧️', label: '빗소리' },
  { id: 'fire', icon: '🔥', label: '모닥불' },
  { id: 'piano', icon: '🎹', label: '선율' },
];

export default function EditorTab({
  editorDate,
  existingEntry,
  bgmMixer,
  onBackToCalendar,
  onSaveEntry,
  onDeleteEntry,
  onToggleBgmChannel,
  onSetBgmVolume,
  onMuteAllBgm,
  onShowToast,
}: EditorTabProps) {
  const [mood, setMood] = useState<MoodId>(existingEntry?.mood || 'happy');
  const [weather, setWeather] = useState<WeatherEmoji>(existingEntry?.weather || '☀️');
  const [font, setFont] = useState<EditorFont>(existingEntry?.font || 'font-myeongjo');
  const [content, setContent] = useState<string>(existingEntry?.content || '');
  const [photo, setPhoto] = useState<string | null>(existingEntry?.photo || null);
  const [caption, setCaption] = useState<string>(existingEntry?.caption || '');
  const [aiComfort, setAiComfort] = useState<string>(existingEntry?.aiComfort || '');
  const [isGeneratingComfort, setIsGeneratingComfort] = useState<boolean>(false);
  const [comfortError, setComfortError] = useState<string>('');
  const [mixerOpen, setMixerOpen] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeBgmCount = (['rain', 'fire', 'piano'] as BgmChannel[]).filter(
    (ch) => bgmMixer[ch].active
  ).length;

  const insertDailyPrompt = () => {
    const prompt = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    const prefix = content.trim() ? '\n\n' : '';
    setContent((prev) => `${prev}${prefix}「 ${prompt} 」\n`);
    textareaRef.current?.focus();
    onShowToast('오늘의 질문 글감을 담았습니다', '✨');
  };

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 600;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setPhoto(canvas.toDataURL('image/jpeg', 0.78));
          onShowToast('폴라로이드 사진이 첨부되었습니다', '📷');
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const removePhoto = () => {
    setPhoto(null);
    setCaption('');
  };

  const handleGenerateComfort = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      onShowToast('먼저 오늘의 일기를 조금 적어주세요', '✍️');
      textareaRef.current?.focus();
      return;
    }

    setIsGeneratingComfort(true);
    setComfortError('');
    try {
      const moodLabel = MOODS.find((m) => m.id === mood)?.label || '';
      const response = await fetch('/api/comfort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          mood: moodLabel,
          weather,
          date: editorDate,
        }),
      });

      const data = (await response.json()) as { comfortMessage?: string; error?: string };
      if (!response.ok || !data.comfortMessage) {
        const msg = data.error || '위로의 말을 불러오지 못했습니다.';
        setComfortError(msg);
        onShowToast(msg, '⚠️');
        return;
      }

      setAiComfort(data.comfortMessage);
      onShowToast('AI의 위로 한마디가 도착했습니다', '💌');
    } catch {
      const msg = '네트워크 오류로 위로의 말을 불러오지 못했습니다.';
      setComfortError(msg);
      onShowToast(msg, '⚠️');
    } finally {
      setIsGeneratingComfort(false);
    }
  };

  const handleSave = () => {
    const trimmed = content.trim();
    if (!trimmed && !photo) {
      onShowToast('오늘의 생각이나 사진을 한 조각 남겨주세요', '✍️');
      return;
    }

    onSaveEntry({
      date: editorDate,
      mood,
      weather,
      font,
      content: trimmed,
      photo,
      caption: caption.trim(),
      aiComfort: aiComfort.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="animate-fade-in">
      {/* 상단 딥 네이비 컨트롤 헤더 */}
      <div className="bg-navyHeader text-white pt-6 pb-7 px-6 rounded-b-[32px] shadow-md">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-3">
          <button
            type="button"
            onClick={onBackToCalendar}
            className="hover:text-white flex items-center gap-1 py-1"
          >
            <span>← 달력</span>
          </button>
          <span className="font-medium text-accentGold">오늘의 기록</span>
          <button
            type="button"
            onClick={insertDailyPrompt}
            className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full text-[11px] transition"
            title="오늘의 질문 글감 추가"
          >
            ✨ 글감
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-myeongjo font-bold">{formatKoreanDate(editorDate)}</h2>
          {/* 날씨 선택 */}
          <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
            {WEATHERS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeather(w)}
                className={`text-sm p-1 rounded-full transition ${
                  weather === w ? 'bg-white/20 opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* 감정 선택 & BGM 믹서 버튼 바 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                title={m.label}
                className={`w-8 h-8 rounded-full bg-white/10 border border-transparent flex items-center justify-center text-base transition ${
                  mood === m.id ? 'mood-active bg-white/25' : ''
                }`}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMixerOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full text-xs font-medium transition shrink-0 ${
              activeBgmCount > 0 ? 'bg-accentGold/25 text-accentGold' : ''
            }`}
          >
            <span>🎵</span>
            <span>{activeBgmCount > 0 ? `믹싱 (${activeBgmCount})` : 'BGM 믹서'}</span>
          </button>
        </div>

        {/* 무드 BGM 사운드 믹서 패널 */}
        {mixerOpen && (
          <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-medium text-accentGold">🎧 나만의 밤 사운드 믹싱</span>
              <button
                type="button"
                onClick={onMuteAllBgm}
                className="text-slate-300 hover:text-white underline"
              >
                전체 음소거
              </button>
            </div>

            {BGM_CHANNEL_META.map((ch) => {
              const chState = bgmMixer[ch.id];
              return (
                <div key={ch.id} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleBgmChannel(ch.id)}
                    className={`w-20 shrink-0 flex items-center gap-1.5 text-xs py-1.5 px-2 rounded-xl transition ${
                      chState.active
                        ? 'bg-accentGold/25 text-accentGold ring-1 ring-accentGold/50'
                        : 'bg-white/5 hover:bg-white/15 text-slate-300'
                    }`}
                  >
                    <span>{ch.icon}</span>
                    <span>{ch.label}</span>
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={chState.volume}
                    onChange={(e) => onSetBgmVolume(ch.id, Number(e.target.value))}
                    className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E6B86A]"
                  />
                  <span className="w-8 text-right text-[10px] text-slate-300">
                    {chState.volume}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 에디터 본문 영역 */}
      <div className="px-5 mt-4">
        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 shadow-sm border border-stone-200/70 dark:border-slate-700/60">
          {/* 폰트 선택 및 사진 첨부 툴바 */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 dark:border-slate-700/70">
            <div className="flex items-center gap-1.5">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFont(f.id)}
                  className={`px-2.5 py-1 rounded-lg transition ${f.className} ${
                    font === f.id
                      ? 'bg-stone-100 dark:bg-slate-700 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <label className="cursor-pointer text-xs flex items-center gap-1 text-slate-500 hover:text-navyHeader dark:hover:text-accentGold bg-stone-100 dark:bg-slate-700 px-2.5 py-1.5 rounded-lg transition">
              <span>📷 사진</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>
          </div>

          {/* 텍스트 입력창 */}
          <textarea
            ref={textareaRef}
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘 하루, 당신의 마음에 머문 조각들을 조용히 적어보세요..."
            className={`w-full bg-transparent resize-none focus:outline-none text-base leading-relaxed text-slate-800 dark:text-slate-100 placeholder:text-slate-400/70 ${font}`}
          />

          {/* 폴라로이드 사진 미리보기 영역 */}
          {photo && (
            <div className="mt-4 mb-2 flex flex-col items-center">
              <div className="polaroid-frame relative max-w-[230px] w-full rounded-sm">
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center shadow-md hover:bg-rose-600"
                >
                  ✕
                </button>
                <img
                  src={photo}
                  alt="일기 사진"
                  className="w-full h-44 object-cover rounded-xs bg-stone-200"
                />
                <input
                  type="text"
                  maxLength={24}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="사진 속 순간을 한 줄로..."
                  className="w-full mt-2.5 text-center font-pen text-lg text-slate-700 bg-transparent focus:outline-none border-b border-dashed border-slate-300"
                />
              </div>
            </div>
          )}

          {/* AI 오늘의 위로 한마디 영역 */}
          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-700/70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-300">
                🌙 오늘의 위로 한마디
              </span>
              <button
                type="button"
                onClick={handleGenerateComfort}
                disabled={isGeneratingComfort}
                className="text-xs font-medium bg-warmCard dark:bg-slate-700/80 hover:bg-stone-200 dark:hover:bg-slate-600 text-navyHeader dark:text-accentGold px-3 py-1.5 rounded-xl transition disabled:opacity-60 flex items-center gap-1"
              >
                <span>{isGeneratingComfort ? '⏳' : '✨'}</span>
                <span>
                  {isGeneratingComfort
                    ? '마음을 읽는 중...'
                    : aiComfort
                      ? '위로 다시 받기'
                      : 'AI 위로 받기'}
                </span>
              </button>
            </div>

            {comfortError && (
              <p className="mt-2 text-xs text-rose-500">{comfortError}</p>
            )}

            {aiComfort && (
              <div className="mt-2.5 bg-warmCard/80 dark:bg-slate-800/70 rounded-2xl p-3.5 border border-accentGold/30 relative animate-fade-in">
                <button
                  type="button"
                  onClick={() => setAiComfort('')}
                  title="위로 한마디 지우기"
                  className="absolute top-2 right-2.5 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
                <p className="text-[11px] font-semibold text-navyHeader dark:text-accentGold mb-1">
                  💌 밤의 동반자가 건네는 말
                </p>
                <p className="text-xs sm:text-sm font-myeongjo leading-relaxed text-slate-700 dark:text-slate-200 pr-4">
                  {aiComfort}
                </p>
              </div>
            )}
          </div>

          {/* 글자 수 & 저장/삭제 버튼 */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 dark:border-slate-700/70">
            <span className="text-xs text-slate-400">{content.length}자</span>
            <div className="flex items-center gap-2">
              {existingEntry && (
                <button
                  type="button"
                  onClick={() => onDeleteEntry(editorDate)}
                  className="text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-2 rounded-xl transition"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="bg-navyHeader dark:bg-accentGold text-white dark:text-navyDeep text-xs font-semibold px-5 py-2.5 rounded-xl shadow hover:opacity-95 active:scale-95 transition"
              >
                조각 저장하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
