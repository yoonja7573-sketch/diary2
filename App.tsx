import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  applyBgmChannelVolume,
  ensureAudioStarted,
  startBgmChannel,
  stopAllBgmChannels,
  stopBgmChannel,
} from './audio/bgmEngine';
import CalendarTab from './components/CalendarTab';
import EditorTab from './components/EditorTab';
import PinLockScreen from './components/PinLockScreen';
import SettingsTab from './components/SettingsTab';
import StatsTab from './components/StatsTab';
import {
  STORAGE_KEY_ENTRIES,
  STORAGE_KEY_SETTINGS,
  buildSampleEntries,
  formatKoreanDate,
  getTodayStr,
} from './constants';
import type {
  AppSettings,
  BgmChannel,
  BgmMixerState,
  DiaryEntry,
  TabName,
} from './types';

function loadInitialEntries(): Record<string, DiaryEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, DiaryEntry>;
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('로컬 스토리지 일기 로드 오류:', err);
  }
  const now = new Date();
  const seeded = buildSampleEntries(now.getFullYear(), now.getMonth());
  try {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(seeded));
  } catch {
    // ignore storage quota errors on seed
  }
  return seeded;
}

function loadInitialSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        darkMode: Boolean(parsed.darkMode),
        pinCode: parsed.pinCode ?? null,
      };
    }
  } catch (err) {
    console.error('로컬 스토리지 설정 로드 오류:', err);
  }
  return { darkMode: false, pinCode: null };
}

export default function App() {
  const now = new Date();
  const [currentTab, setCurrentTab] = useState<TabName>('calendar');
  const [viewYear, setViewYear] = useState<number>(now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [editorDate, setEditorDate] = useState<string>(getTodayStr());
  const [editorSessionKey, setEditorSessionKey] = useState<number>(0);

  const [entries, setEntries] = useState<Record<string, DiaryEntry>>(loadInitialEntries);
  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings);

  const [bgmMixer, setBgmMixer] = useState<BgmMixerState>({
    rain: { active: false, volume: 60 },
    fire: { active: false, volume: 55 },
    piano: { active: false, volume: 65 },
  });

  const [pinOverlayMode, setPinOverlayMode] = useState<'unlock' | 'setup' | null>(() =>
    loadInitialSettings().pinCode ? 'unlock' : null
  );

  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  const [toast, setToast] = useState<{ visible: boolean; msg: string; icon: string }>({
    visible: false,
    msg: '알림 메시지',
    icon: '✨',
  });
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string, icon = '✨') => {
    setToast({ visible: true, msg, icon });
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2400);
  }, []);

  // 다크 모드 클래스 동기화
  useEffect(() => {
    const htmlEl = document.documentElement;
    if (settings.darkMode) {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // 오디오 노드 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAllBgmChannels();
    };
  }, []);

  const persistEntries = useCallback(
    (nextEntries: Record<string, DiaryEntry>) => {
      setEntries(nextEntries);
      try {
        localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(nextEntries));
      } catch {
        showToast('저장 공간이 부족합니다. 사진 크기를 줄여보세요.', '⚠️');
      }
    },
    [showToast]
  );

  const persistSettings = useCallback((nextSettings: AppSettings) => {
    setSettings(nextSettings);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(nextSettings));
  }, []);

  const handleChangeMonth = (delta: number) => {
    let nextMonth = viewMonth + delta;
    let nextYear = viewYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setViewYear(nextYear);
    setViewMonth(nextMonth);
  };

  const handleGoToToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(getTodayStr());
  };

  const handleOpenEditorForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditorDate(dateStr);
    setEditorSessionKey((k) => k + 1);
    setCurrentTab('editor');
  };

  const handleSwitchTab = (tab: TabName) => {
    if (tab === 'editor' && editorDate !== selectedDate) {
      setEditorDate(selectedDate);
      setEditorSessionKey((k) => k + 1);
    }
    setCurrentTab(tab);
  };

  const handleRandomMemory = () => {
    const keys = Object.keys(entries);
    if (keys.length === 0) {
      showToast('아직 꺼내볼 추억 조각이 없어요', '🌙');
      return;
    }
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const [y, m] = randomKey.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    setSelectedDate(randomKey);
    showToast(`${formatKoreanDate(randomKey)}의 기억을 꺼내왔어요`, '🕯️');
  };

  const handleSaveEntry = (entry: DiaryEntry) => {
    const next = { ...entries, [entry.date]: entry };
    persistEntries(next);
    showToast('오늘의 조각이 안전하게 저장되었습니다', '🌙');
    setCurrentTab('calendar');
  };

  const handleDeleteEntry = (dateStr: string) => {
    if (!entries[dateStr]) return;
    const next = { ...entries };
    delete next[dateStr];
    persistEntries(next);
    showToast('기록된 조각을 삭제했습니다', '🗑️');
    setCurrentTab('calendar');
  };

  const handleToggleBgmChannel = async (channel: BgmChannel) => {
    await ensureAudioStarted();
    setBgmMixer((prev) => {
      const current = prev[channel];
      const nextActive = !current.active;
      const nextVolume = nextActive && current.volume === 0 ? 50 : current.volume;

      if (nextActive) {
        startBgmChannel(channel, nextVolume);
      } else {
        stopBgmChannel(channel);
      }

      return {
        ...prev,
        [channel]: { active: nextActive, volume: nextVolume },
      };
    });
  };

  const handleSetBgmVolume = async (channel: BgmChannel, volume: number) => {
    const wasInactive = !bgmMixer[channel].active;
    if (volume > 0 && wasInactive) {
      await ensureAudioStarted();
      startBgmChannel(channel, volume);
    } else if (volume === 0 && bgmMixer[channel].active) {
      stopBgmChannel(channel);
    } else if (bgmMixer[channel].active) {
      applyBgmChannelVolume(channel, volume);
    }

    setBgmMixer((prev) => ({
      ...prev,
      [channel]: {
        active: volume > 0 ? true : false,
        volume,
      },
    }));
  };

  const handleMuteAllBgm = () => {
    stopAllBgmChannels();
    setBgmMixer((prev) => ({
      rain: { ...prev.rain, active: false },
      fire: { ...prev.fire, active: false },
      piano: { ...prev.piano, active: false },
    }));
    showToast('모든 배경음을 껐습니다', '🔇');
  };

  const handleToggleDarkMode = () => {
    persistSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const handlePinSettingClick = () => {
    if (settings.pinCode) {
      persistSettings({ ...settings, pinCode: null });
      showToast('PIN 번호 잠금이 해제되었습니다', '🔓');
    } else {
      setPinOverlayMode('setup');
    }
  };

  const handleExportJson = () => {
    const payload = {
      app: 'PiecesOfNight',
      exportedAt: new Date().toISOString(),
      entries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `밤의조각_백업_${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('일기 백업 파일이 다운로드되었습니다', '📤');
  };

  const handleImportJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const parsed = JSON.parse(result);
        const importedEntries = parsed.entries || parsed;
        if (typeof importedEntries === 'object' && importedEntries !== null) {
          persistEntries({ ...entries, ...importedEntries });
          showToast('백업 데이터를 성공적으로 복원했습니다', '📥');
        } else {
          showToast('올바른 백업 파일 형식이 아닙니다', '⚠️');
        }
      } catch {
        showToast('파일을 읽는 중 오류가 발생했습니다', '⚠️');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDownloadSourceCode = async () => {
    try {
      const response = await fetch('/api/download-code');
      if (!response.ok) {
        showToast('소스 코드 다운로드에 실패했습니다', '⚠️');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `밤의조각_소스코드_${getTodayStr()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('소스 코드 ZIP 파일이 다운로드되었습니다', '💻');
    } catch {
      showToast('소스 코드 다운로드 중 오류가 발생했습니다', '⚠️');
    }
  };

  const handleLoadSamples = () => {
    const samples = buildSampleEntries(viewYear, viewMonth);
    persistEntries({ ...entries, ...samples });
    showToast('감성 샘플 일기가 추가되었습니다', '✨');
  };

  const handleConfirmResetAll = () => {
    localStorage.removeItem(STORAGE_KEY_ENTRIES);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    setEntries({});
    setSettings({ darkMode: false, pinCode: null });
    setConfirmResetOpen(false);
    showToast('모든 데이터가 초기화되었습니다', '🧹');
  };

  const navTabs: { id: TabName; icon: string; label: string }[] = [
    { id: 'calendar', icon: '🗓️', label: '월간 회고' },
    { id: 'editor', icon: '✍️', label: '오늘의 기록' },
    { id: 'stats', icon: '📊', label: '월간 통계' },
    { id: 'settings', icon: '🌙', label: '나의 공간' },
  ];

  return (
    <div className="w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[880px] bg-warmPaper dark:bg-navyDeep sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col relative border border-stone-300/60 dark:border-slate-800">
      {/* 0. PIN 잠금 화면 오버레이 */}
      {pinOverlayMode && (
        <PinLockScreen
          mode={pinOverlayMode}
          savedPin={settings.pinCode}
          onUnlockSuccess={() => setPinOverlayMode(null)}
          onSetupSuccess={(newPin) => {
            persistSettings({ ...settings, pinCode: newPin });
            setPinOverlayMode(null);
            showToast('PIN 번호 잠금이 설정되었습니다', '🔒');
          }}
          onCancelSetup={() => setPinOverlayMode(null)}
        />
      )}

      {/* 공통 토스트 알림 메시지 박스 */}
      <div
        className={`pointer-events-none fixed sm:absolute top-5 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 bg-navyHeader/95 text-white text-xs px-4 py-2.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2 whitespace-nowrap ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <span>{toast.icon}</span>
        <span>{toast.msg}</span>
      </div>

      {/* 메인 콘텐츠 스크롤 영역 */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        {currentTab === 'calendar' && (
          <CalendarTab
            viewYear={viewYear}
            viewMonth={viewMonth}
            selectedDate={selectedDate}
            entries={entries}
            onChangeMonth={handleChangeMonth}
            onGoToToday={handleGoToToday}
            onSelectDate={setSelectedDate}
            onOpenEditor={handleOpenEditorForDate}
            onRandomMemory={handleRandomMemory}
          />
        )}

        {currentTab === 'editor' && (
          <EditorTab
            key={`${editorDate}-${editorSessionKey}`}
            editorDate={editorDate}
            existingEntry={entries[editorDate]}
            bgmMixer={bgmMixer}
            onBackToCalendar={() => setCurrentTab('calendar')}
            onSaveEntry={handleSaveEntry}
            onDeleteEntry={handleDeleteEntry}
            onToggleBgmChannel={handleToggleBgmChannel}
            onSetBgmVolume={handleSetBgmVolume}
            onMuteAllBgm={handleMuteAllBgm}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'stats' && (
          <StatsTab viewYear={viewYear} viewMonth={viewMonth} entries={entries} />
        )}

        {currentTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onToggleDarkMode={handleToggleDarkMode}
            onPinSettingClick={handlePinSettingClick}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onDownloadSourceCode={handleDownloadSourceCode}
            onLoadSamples={handleLoadSamples}
            onConfirmResetAll={() => setConfirmResetOpen(true)}
          />
        )}
      </main>

      {/* 하단 네비게이션 탭 바 */}
      <nav className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-navyHeader/95 backdrop-blur-md border-t border-stone-200/80 dark:border-slate-800 px-4 py-2.5 flex justify-around items-center z-30">
        {navTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSwitchTab(tab.id)}
              className={`flex flex-col items-center gap-1 text-[11px] px-3 py-1 rounded-xl transition ${
                isActive
                  ? 'text-navyHeader dark:text-accentGold font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 초기화 확인 커스텀 모달 */}
      {confirmResetOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white dark:bg-darkCard rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-stone-200 dark:border-slate-700 text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <h4 className="font-bold text-base mb-1">정말 초기화할까요?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              저장된 모든 일기와 설정이 영구적으로 삭제됩니다.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-700 text-xs font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmResetAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-semibold"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
