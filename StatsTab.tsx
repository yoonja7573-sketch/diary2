import { useEffect, useRef } from 'react';
import {
  ArcElement,
  Chart,
  DoughnutController,
  Tooltip,
} from 'chart.js';
import { MOODS } from '../constants';
import type { DiaryEntry, MoodId } from '../types';

Chart.register(DoughnutController, ArcElement, Tooltip);

interface StatsTabProps {
  viewYear: number;
  viewMonth: number;
  entries: Record<string, DiaryEntry>;
}

export default function StatsTab({ viewYear, viewMonth, entries }: StatsTabProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart<'doughnut'> | null>(null);

  const month = viewMonth + 1;
  const prefix = `${viewYear}-${String(month).padStart(2, '0')}`;
  const monthEntries = Object.values(entries).filter((e) => e.date.startsWith(prefix));
  const totalCount = monthEntries.length;

  const counts: Record<MoodId, number> = {
    happy: 0,
    calm: 0,
    excited: 0,
    sad: 0,
    anxious: 0,
    angry: 0,
  };

  let totalChars = 0;
  monthEntries.forEach((e) => {
    if (counts[e.mood] !== undefined) {
      counts[e.mood] += 1;
    }
    totalChars += (e.content || '').length;
  });

  const activeMoods = MOODS.map((m) => ({
    ...m,
    count: counts[m.id],
    percent: totalCount > 0 ? Math.round((counts[m.id] / totalCount) * 100) : 0,
  }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const avgChars = totalCount > 0 ? Math.round(totalChars / totalCount) : 0;
  const summaryComment =
    totalCount === 0
      ? '이번 달의 첫 번째 감정 조각을 기록해 보세요. 작은 기록이 모여 나를 이해하는 지도가 됩니다.'
      : activeMoods[0].comment;

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (totalCount === 0 || !canvasRef.current) {
      return;
    }

    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: activeMoods.map((m) => m.label),
        datasets: [
          {
            data: activeMoods.map((m) => m.count),
            backgroundColor: activeMoods.map((m) => m.color),
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [viewYear, viewMonth, totalCount, entries]);

  return (
    <section className="animate-fade-in">
      {/* 상단 딥 네이비 헤더 */}
      <div className="bg-navyHeader text-white pt-6 pb-8 px-6 rounded-b-[32px] shadow-md">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-3">
          <span>REPORT</span>
          <span className="font-medium text-accentGold">월간 통계</span>
          <span className="text-slate-300">
            {viewYear}.{String(month).padStart(2, '0')}
          </span>
        </div>
        <h2 className="text-2xl font-myeongjo font-bold">{month}월의 감정 통계</h2>
        <p className="text-xs text-slate-300 mt-1">한 달 동안 쌓인 마음의 결을 돌아봅니다</p>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        {/* 도넛 차트 카드 */}
        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 shadow-sm border border-stone-200/70 dark:border-slate-700/60">
          <div className="relative h-52 flex items-center justify-center">
            {totalCount === 0 ? (
              <div className="text-center text-sm text-slate-400">
                <p className="text-2xl mb-2">🌙</p>
                <p>이번 달에 기록된 조각이 아직 없어요.</p>
              </div>
            ) : (
              <canvas ref={canvasRef} />
            )}
          </div>

          {/* 감정별 비율 리스트 */}
          {totalCount > 0 && (
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-stone-100 dark:border-slate-700/60">
              {activeMoods.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between bg-stone-50 dark:bg-slate-800/70 px-3 py-2 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: m.color }}
                    />
                    <span className="text-xs font-medium">
                      {m.emoji} {m.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {m.percent}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 평균 기록 지표 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-darkCard rounded-2xl p-4 shadow-sm border border-stone-200/70 dark:border-slate-700/60">
            <span className="text-xs text-slate-400">이번 달 기록일</span>
            <p className="text-xl font-bold text-navyHeader dark:text-accentGold mt-1">
              {totalCount}일
            </p>
          </div>
          <div className="bg-white dark:bg-darkCard rounded-2xl p-4 shadow-sm border border-stone-200/70 dark:border-slate-700/60">
            <span className="text-xs text-slate-400">평균 글자 수</span>
            <p className="text-xl font-bold text-navyHeader dark:text-accentGold mt-1">
              {avgChars}자
            </p>
          </div>
        </div>

        {/* 이달의 마음 결산 코멘트 카드 */}
        <div className="bg-warmCard dark:bg-slate-800/80 rounded-2xl p-4 border border-stone-200/80 dark:border-slate-700">
          <p className="text-xs font-semibold text-navyHeader dark:text-accentGold mb-1">
            💌 이달의 마음 코멘트
          </p>
          <p className="text-sm font-myeongjo leading-relaxed text-slate-700 dark:text-slate-200">
            {summaryComment}
          </p>
        </div>
      </div>
    </section>
  );
}
