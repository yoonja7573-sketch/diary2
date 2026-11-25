import { useEffect, useState } from 'react';

interface PinLockScreenProps {
  mode: 'unlock' | 'setup';
  savedPin: string | null;
  onUnlockSuccess: () => void;
  onSetupSuccess: (newPin: string) => void;
  onCancelSetup: () => void;
}

export default function PinLockScreen({
  mode,
  savedPin,
  onUnlockSuccess,
  onSetupSuccess,
  onCancelSetup,
}: PinLockScreenProps) {
  const [pinBuffer, setPinBuffer] = useState('');
  const [setupStep, setSetupStep] = useState<'new' | 'confirm'>('new');
  const [tempNewPin, setTempNewPin] = useState('');
  const [promptText, setPromptText] = useState(
    mode === 'setup'
      ? '새로 설정할 비밀번호 4자리를 입력하세요'
      : '비밀번호 4자리를 입력해 주세요'
  );

  useEffect(() => {
    setPinBuffer('');
    setSetupStep('new');
    setTempNewPin('');
    setPromptText(
      mode === 'setup'
        ? '새로 설정할 비밀번호 4자리를 입력하세요'
        : '비밀번호 4자리를 입력해 주세요'
    );
  }, [mode]);

  useEffect(() => {
    if (pinBuffer.length !== 4) return;

    const timer = window.setTimeout(() => {
      if (mode === 'setup') {
        if (setupStep === 'new') {
          setTempNewPin(pinBuffer);
          setPinBuffer('');
          setSetupStep('confirm');
          setPromptText('확인을 위해 한 번 더 입력해 주세요');
        } else {
          if (pinBuffer === tempNewPin) {
            onSetupSuccess(pinBuffer);
          } else {
            setPinBuffer('');
            setSetupStep('new');
            setPromptText('일치하지 않습니다. 처음부터 다시 입력하세요');
          }
        }
      } else {
        if (pinBuffer === savedPin) {
          setPinBuffer('');
          onUnlockSuccess();
        } else {
          setPinBuffer('');
          setPromptText('비밀번호가 올바르지 않습니다');
        }
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [pinBuffer, mode, setupStep, tempNewPin, savedPin, onUnlockSuccess, onSetupSuccess]);

  const pressPin = (digit: string) => {
    if (pinBuffer.length >= 4) return;
    setPinBuffer((prev) => prev + digit);
  };

  const deletePin = () => {
    setPinBuffer((prev) => prev.slice(0, -1));
  };

  return (
    <div className="absolute inset-0 z-50 bg-navyHeader text-white flex flex-col items-center justify-center p-8">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 text-3xl">
          🌙
        </div>
        <h2 className="text-xl font-myeongjo font-bold tracking-wide">밤의 조각</h2>
        <p className="text-sm text-slate-300 mt-2">{promptText}</p>
      </div>

      {/* PIN 입력 점 표시 */}
      <div className="flex gap-4 my-6">
        {[0, 1, 2, 3].map((idx) => (
          <span
            key={idx}
            className={`w-3.5 h-3.5 rounded-full border border-accentGold transition-all ${
              idx < pinBuffer.length ? 'bg-accentGold scale-110' : ''
            }`}
          />
        ))}
      </div>

      {/* 숫자 키패드 */}
      <div className="grid grid-cols-3 gap-4 w-64 mt-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => pressPin(digit)}
            className="h-14 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xl font-medium transition"
          >
            {digit}
          </button>
        ))}

        {mode === 'setup' ? (
          <button
            type="button"
            onClick={onCancelSetup}
            className="h-14 rounded-full text-xs text-slate-400 hover:text-white transition"
          >
            취소
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => pressPin('0')}
          className="h-14 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xl font-medium transition"
        >
          0
        </button>

        <button
          type="button"
          onClick={deletePin}
          className="h-14 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-sm text-slate-300 transition"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
