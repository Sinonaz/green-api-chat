import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { GreenApiService } from '../services/greenApi';
import {
  X,
  Globe,
  Radio,
  Trash2,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const credentials = useChatStore((s) => s.credentials);
  const setCredentials = useChatStore((s) => s.setCredentials);
  const isPollingActive = useChatStore((s) => s.isPollingActive);
  const lastPollError = useChatStore((s) => s.lastPollError);
  const logout = useChatStore((s) => s.logout);

  const [apiUrl, setApiUrl] = useState(credentials?.apiUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen || !credentials) return null;

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = (apiUrl.trim() || 'https://api.green-api.com').replace(/\/+$/, '');
    setCredentials({
      ...credentials,
      apiUrl: cleanUrl,
    });
    setTestResult('Хост сохранен успешно');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const api = new GreenApiService({
        ...credentials,
        apiUrl: apiUrl.trim() || credentials.apiUrl,
      });
      const res = await api.getStateInstance();
      setTestResult(`Статус инстанса: ${res.stateInstance || 'authorized'}`);
    } catch (err: any) {
      setTestResult(`Ошибка: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#17212b] border border-[#232e3c] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232e3c]">
          <h2 className="text-base font-semibold text-white">Настройки инстанса</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7f91a4] hover:text-white hover:bg-[#202b36] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status info */}
          <div className="p-3.5 bg-[#0e1621] rounded-xl border border-[#232e3c] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7f91a4]">Служба приёма (HTTP API):</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <Radio className={`w-3 h-3 ${isPollingActive ? 'animate-pulse' : ''}`} />
                {isPollingActive ? 'Активна (Long Polling)' : 'Остановлена'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#7f91a4]">idInstance:</span>
              <span className="font-mono text-white">{credentials.idInstance}</span>
            </div>

            {lastPollError && (
              <div className="pt-2 border-t border-[#232e3c] text-[11px] text-amber-400 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{lastPollError}</span>
              </div>
            )}
          </div>

          {/* API Host form */}
          <form onSubmit={handleSaveApiUrl} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7f91a4]">
              Адрес сервера (apiUrl)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-[#7f91a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.green-api.com"
                className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-[#2481cc] hover:bg-[#1e72b6] text-white text-xs font-medium rounded-xl transition-all"
              >
                Сохранить хост
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="py-2 px-3 bg-[#202b36] hover:bg-[#2b5278] text-white text-xs font-medium rounded-xl transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Тест</span>
              </button>
            </div>

            {testResult && (
              <p className="text-xs text-[#54a9eb] flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {testResult}
              </p>
            )}
          </form>

          {/* Danger zone / logout */}
          <div className="pt-4 border-t border-[#232e3c] flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (confirm('Сбросить все сохранённые чаты и сообщения?')) {
                  localStorage.removeItem('green-api-telegram-storage');
                  window.location.reload();
                }
              }}
              className="px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить историю</span>
            </button>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выйти из аккаунта</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
