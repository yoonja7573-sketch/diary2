import { MOODS, formatKoreanDate, getTodayStr } from '../constants';
import type { DiaryEntry } from '../types';

interface CalendarTabProps {
  viewYear: number;
  viewMonth: number;
  selectedDate: string;
  entries: Record<string, DiaryEntry>;
  onChangeMonth: (delta: number) => void;
  onGoToToday: () => void;
  onSelectDate: (dateStr: string) => void;
  onOpenEditor: (dateStr: string) => void;
  onRandomMemory: () => void;
}

export default function CalendarTab({
  viewYear,
  viewMonth,
  selectedDate,
  entries,
  onChangeMonth,
  onGoToToday,
  onSelectDate,
  onOpenEditor,
  onRandomMemory,
}: CalendarTabProps) {
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = getTodayStr();

  const emptyCells = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: lastDate }, (_, i) => i + 1);

  const selectedEntry = entries[selectedDate];
  const selectedMoodObj = selectedEntry
    ? MOODS.find((m) => m.id === selectedEntry.mood) || MOODS[0]
    : null;

  return (
    <section className="animate-fade-in">
      {/* 상단 딥 네이비 헤더 */}
      <div className="bg-navyHeader text-white pt-6 pb-8 px-6 rounded-b-[32px] shadow-md relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-accentGold/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-slate-300 mb-4">
          <span className="tracking-widest font-light">PIECES OF NIGHT</span>
          <span className="font-medium text-accentGold">월간 회고</span>
          <button
            type="button"
            onClick={onRandomMemory}
            title="추억 꺼내보기"
            className="p-1.5 rounded-full hover:bg-white/10 transition"
          >
            🔔
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-myeongjo font-bold tracking-tight">
              {viewMonth + 1}월의 마음 기록
            </h1>
            <p className="text-xs text-slate-300 mt-1">오늘 하루는 어떤 색으로 남았나요?</p>
          </div>
          <button
            type="button"
            onClick={onGoToToday}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
          >
            오늘
          </button>
        </div>
      </div>

      {/* 캘린더 카드 본문 */}
      <div className="px-5 -mt-4">
        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 shadow-sm border border-stone-200/70 dark:border-slate-700/60">
          {/* 연월 네비게이션 */}
          <div className="flex items-center justify-between mb-4 px-2">
            <button
              type="button"
              onClick={() => onChangeMonth(-1)}
              className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition"
            >
              ◀
            </button>
            <span className="font-semibold text-base tracking-wide text-slate-700 dark:text-slate-200">
              {viewYear}년 {viewMonth + 1}월
            </span>
            <button
              type="button"
              onClick={() => onChangeMonth(1)}
              className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition"
            >
              ▶
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400 mb-3">
            <div className="text-rose-400">일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div className="text-sky-400">토</div>
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-2.5 text-center">
            {emptyCells.map((idx) => (
              <div key={`empty-${idx}`} />
            ))}
            {days.map((d) => {
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(
                d
              ).padStart(2, '0')}`;
              const entry = entries[dateStr];
              const moodObj = entry ? MOODS.find((m) => m.id === entry.mood) : null;
              const isSelected = selectedDate === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition ${
                    isSelected
                      ? 'bg-navyHeader/10 dark:bg-accentGold/20 ring-1 ring-navyHeader/40 dark:ring-accentGold'
                      : 'hover:bg-stone-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`text-[11px] mb-1 ${
                      isToday
                        ? 'font-bold text-accentGold underline'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {d}
                  </span>
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-base ${
                      moodObj
                        ? 'bg-warmCard dark:bg-slate-700/80 shadow-xs'
                        : 'border border-dashed border-stone-300 dark:border-slate-700 text-transparent'
                    }`}
                  >
                    {moodObj ? moodObj.emoji : '·'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 날짜의 일기 미리보기 카드 */}
        <div className="mt-5 bg-white dark:bg-darkCard rounded-3xl p-5 shadow-sm border border-stone-200/70 dark:border-slate-700/60 transition-all">
          {!selectedEntry ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{formatKoreanDate(selectedDate)}</p>
                <p className="text-sm font-myeongjo text-slate-600 dark:text-slate-300 mt-1">
                  아직 남겨진 마음의 조각이 없어요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenEditor(selectedDate)}
                className="text-xs font-medium bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition"
              >
                기록하기 →
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedMoodObj?.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {formatKoreanDate(selectedDate)} · {selectedEntry.weather || '☀️'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {selectedMoodObj?.label}의 기록
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenEditor(selectedDate)}
                  className="text-xs text-navyHeader dark:text-accentGold font-medium hover:underline"
                >
                  수정하기
                </button>
              </div>

              <p
                className={`text-sm leading-relaxed text-slate-700 dark:text-slate-200 ${
                  selectedEntry.font || 'font-myeongjo'
                } whitespace-pre-line line-clamp-4`}
              >
                {selectedEntry.content}
              </p>

              {selectedEntry.aiComfort && (
                <div className="mt-3 bg-warmCard/80 dark:bg-slate-800/70 rounded-2xl p-3 border border-accentGold/25">
                  <p className="text-[11px] font-semibold text-navyHeader dark:text-accentGold mb-1">
                    💌 AI의 위로 한마디
                  </p>
                  <p className="text-xs font-myeongjo leading-relaxed text-slate-700 dark:text-slate-200">
                    {selectedEntry.aiComfort}
                  </p>
                </div>
              )}

              {selectedEntry.photo && (
                <div className="mt-3 flex justify-center">
                  <div className="polaroid-frame max-w-[180px] w-full">
                    <img
                      src={selectedEntry.photo}
                      alt="첨부 사진"
                      className="w-full h-32 object-cover"
                    />
                    {selectedEntry.caption && (
                      <p className="text-center font-pen text-base text-slate-700 mt-1.5">
                        {selectedEntry.caption}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 우측 하단 + Add 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => onOpenEditor(selectedDate)}
        className="fixed sm:absolute bottom-24 right-6 z-20 bg-navyHeader dark:bg-accentGold text-white dark:text-navyDeep font-semibold text-sm px-5 py-3.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition flex items-center gap-1.5"
      >
        <span className="text-lg leading-none">+</span>
        <span>Add</span>
      </button>
    </section>
  );
}
