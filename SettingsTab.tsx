import type { ChangeEvent } from 'react';
import type { AppSettings } from '../types';

interface SettingsTabProps {
  settings: AppSettings;
  onToggleDarkMode: () => void;
  onPinSettingClick: () => void;
  onExportJson: () => void;
  onImportJson: (event: ChangeEvent<HTMLInputElement>) => void;
  onDownloadSourceCode: () => void;
  onLoadSamples: () => void;
  onConfirmResetAll: () => void;
}

export default function SettingsTab({
  settings,
  onToggleDarkMode,
  onPinSettingClick,
  onExportJson,
  onImportJson,
  onDownloadSourceCode,
  onLoadSamples,
  onConfirmResetAll,
}: SettingsTabProps) {
  return (
    <section className="animate-fade-in">
      <div className="bg-navyHeader text-white pt-6 pb-8 px-6 rounded-b-[32px] shadow-md">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-3">
          <span>MY SPACE</span>
          <span className="font-medium text-accentGold">나의 공간</span>
          <span>v1.0</span>
        </div>
        <h2 className="text-2xl font-myeongjo font-bold">설정 및 보관함</h2>
        <p className="text-xs text-slate-300 mt-1">
          모든 일기는 현재 브라우저에 안전하게 보관됩니다
        </p>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        {/* 화면 테마 설정 */}
        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 shadow-sm border border-stone-200/70 dark:border-slate-700/60 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            화면 및 감성 설정
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">밤의 다크 모드</p>
              <p className="text-xs text-slate-400">어두운 밤 눈이 편안한 딥 네이비 테마</p>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-12 h-6 rounded-full bg-stone-300 dark:bg-accentGold relative transition-colors p-0.5"
            >
              <span className="block w-5 h-5 rounded-full bg-white shadow transform transition-transform dark:translate-x-6" />
            </button>
          </div>
        </div>

        {/* 보안 잠금 설정 */}
        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 shadow-sm border border-stone-200/70 dark:border-slate-700/60 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            프라이버시 잠금
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">4자리 PIN 번호 잠금</p>
              <p className="text-xs text-slate-400">
                {settings.pinCode
                  ? '잠금이 활성화되어 있습니다'
                  : '현재 잠금이 해제되어 있습니다'}
              </p>
            </div>
            <button
              type="button"
              onClick={onPinSettingClick}
              className="text-xs font-medium bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition"
            >
              {settings.pinCode ? '잠금 해제' : '설정하기'}
            </button>
          </div>
        </div>

        {/* 데이터 백업 및 복원 (JSON) */}
        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 shadow-sm border border-stone-200/70 dark:border-slate-700/60 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            데이터 백업 및 관리
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            브라우저 캐시 삭제 시 데이터가 지워질 수 있습니다. 주기적으로 JSON 파일로 백업해 두세요.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onExportJson}
              className="flex items-center justify-center gap-1.5 bg-navyHeader text-white text-xs font-medium py-3 rounded-xl hover:opacity-90 transition"
            >
              <span>📤</span>
              <span>백업 내보내기</span>
            </button>
            <label className="flex items-center justify-center gap-1.5 bg-stone-100 dark:bg-slate-700 text-xs font-medium py-3 rounded-xl cursor-pointer hover:bg-stone-200 dark:hover:bg-slate-600 transition">
              <span>📥</span>
              <span>백업 불러오기</span>
              <input
                type="file"
                accept=".json"
                onChange={onImportJson}
                className="sr-only"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-stone-100 dark:border-slate-700/60 flex justify-between items-center">
            <button
              type="button"
              onClick={onLoadSamples}
              className="text-xs text-slate-400 hover:text-navyHeader dark:hover:text-accentGold underline"
            >
              감성 샘플 데이터 채우기
            </button>
            <button
              type="button"
              onClick={onConfirmResetAll}
              className="text-xs text-rose-400 hover:text-rose-500"
            >
              전체 초기화
            </button>
          </div>
        </div>

        {/* 소스 코드 다운로드 */}
        <div className="bg-white dark:bg-darkCard rounded-3xl p-5 shadow-sm border border-stone-200/70 dark:border-slate-700/60 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            앱 소스 코드 다운로드
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            현재 앱의 전체 소스 코드를 ZIP 압축 파일로 내려받을 수 있습니다. (API 키 등 시크릿은 제외됩니다)
          </p>
          <button
            type="button"
            onClick={onDownloadSourceCode}
            className="w-full flex items-center justify-center gap-1.5 bg-warmCard dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-navyHeader dark:text-accentGold text-xs font-semibold py-3 rounded-xl transition"
          >
            <span>💻</span>
            <span>소스 코드 ZIP 다운로드</span>
          </button>
        </div>
      </div>
    </section>
  );
}
