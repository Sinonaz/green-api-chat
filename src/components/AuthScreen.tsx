import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { GreenApiService } from '../services/greenApi';
import { Send, KeyRound, Globe, Server, AlertCircle, Loader2 } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const setCredentials = useChatStore((s) => s.setCredentials);
  const setInstanceState = useChatStore((s) => s.setInstanceState);

  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent, skipValidation = false) => {
    e.preventDefault();
    setError(null);

    const cleanId = idInstance.trim();
    const cleanToken = apiTokenInstance.trim();
    const cleanUrl = (apiUrl.trim() || 'https://api.green-api.com').replace(/\/+$/, '');

    if (!cleanId || !cleanToken) {
      setError('Пожалуйста, заполните idInstance и apiTokenInstance');
      return;
    }

    const creds = {
      idInstance: cleanId,
      apiTokenInstance: cleanToken,
      apiUrl: cleanUrl,
    };

    if (skipValidation) {
      setCredentials(creds);
      return;
    }

    setIsLoading(true);
    try {
      const apiService = new GreenApiService(creds);
      const res = await apiService.getStateInstance();
      setInstanceState(res.stateInstance || 'authorized');
      setCredentials(creds);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Не удалось подключиться к инстансу. Проверьте правильность введенных данных.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1621] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#17212b] rounded-2xl shadow-2xl border border-[#232e3c] p-8">
        {/* Telegram icon and title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#2481cc] rounded-full mx-auto flex items-center justify-center shadow-lg shadow-[#2481cc]/20 mb-4">
            <Send className="w-8 h-8 text-white -rotate-12 translate-x-0.5" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Telegram Web</h1>
          <p className="text-sm text-[#7f91a4] mt-1.5">
            Подключение через <span className="text-[#54a9eb] font-medium">GREEN-API</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              <button
                type="button"
                onClick={(e) => handleLogin(e, true)}
                className="mt-2 text-xs text-[#54a9eb] hover:underline block"
              >
                Пропустить проверку и войти принудительно →
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e, false)} className="space-y-5">
          {/* idInstance */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7f91a4] mb-2">
              idInstance <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Server className="w-5 h-5 text-[#7f91a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={idInstance}
                onChange={(e) => setIdInstance(e.target.value)}
                placeholder="например: 1101823456"
                className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
              />
            </div>
          </div>

          {/* apiTokenInstance */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7f91a4] mb-2">
              apiTokenInstance <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-[#7f91a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={apiTokenInstance}
                onChange={(e) => setApiTokenInstance(e.target.value)}
                placeholder="Токен инстанса из кабинета"
                className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
              />
            </div>
          </div>

          {/* apiUrl (optional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7f91a4]">
                API URL (Хост)
              </label>
              <span className="text-xs text-[#54a9eb]/70">Опционально</span>
            </div>
            <div className="relative">
              <Globe className="w-5 h-5 text-[#7f91a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.green-api.com"
                className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
              />
            </div>
            <p className="text-[11px] text-[#7f91a4] mt-1.5">
              Укажите выделенный хост (например, <code className="text-[#54a9eb]">https://7103.api.green-api.com</code>) или оставьте пустым.
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#2481cc] hover:bg-[#1e72b6] active:bg-[#1965a3] text-white font-medium py-3 px-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#2481cc]/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Проверка подключения...</span>
              </>
            ) : (
              <span>Подключиться к чату</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#232e3c] text-center">
          <p className="text-xs text-[#7f91a4]">
            Данные можно получить в личном кабинете{' '}
            <a
              href="https://green-api.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#54a9eb] hover:underline font-medium"
            >
              green-api.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
