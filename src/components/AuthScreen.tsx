import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { GreenApiService } from '../services/greenApi';
import { MessengerType } from '../types';
import { Send, KeyRound, Globe, Server, AlertCircle, Loader2, MessageSquare } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const setCredentials = useChatStore((s) => s.setCredentials);
  const setInstanceState = useChatStore((s) => s.setInstanceState);

  const [messengerType, setMessengerType] = useState<MessengerType>('telegram');
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMax = messengerType === 'max';

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
      messengerType,
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
      <div className="w-full max-w-md bg-[#17212b] rounded-2xl shadow-2xl border border-[#232e3c] overflow-hidden">
        {/* Messenger Switcher Tabs */}
        <div className="grid grid-cols-2 border-b border-[#232e3c] bg-[#121a22]">
          <button
            type="button"
            onClick={() => {
              setMessengerType('telegram');
              setError(null);
            }}
            className={`py-3.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              messengerType === 'telegram'
                ? 'border-[#2481cc] text-[#54a9eb] bg-[#17212b]'
                : 'border-transparent text-[#7f91a4] hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 -rotate-12" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMessengerType('max');
              setError(null);
            }}
            className={`py-3.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              messengerType === 'max'
                ? 'border-purple-500 text-purple-400 bg-[#17212b]'
                : 'border-transparent text-[#7f91a4] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>MAX Messenger</span>
          </button>
        </div>

        <div className="p-8">
          {/* Brand Icon and Header */}
          <div className="text-center mb-7">
            {isMax ? (
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/25 mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-[#2481cc] rounded-full mx-auto flex items-center justify-center shadow-lg shadow-[#2481cc]/25 mb-4">
                <Send className="w-8 h-8 text-white -rotate-12 translate-x-0.5" />
              </div>
            )}

            <h1 className="text-2xl font-bold text-white tracking-wide">
              {isMax ? 'MAX Messenger Web' : 'Telegram Web'}
            </h1>
            <p className="text-sm text-[#7f91a4] mt-1.5">
              Подключение через{' '}
              <span className={`font-medium ${isMax ? 'text-purple-400' : 'text-[#54a9eb]'}`}>
                GREEN-API ({isMax ? 'MAX' : 'Telegram'})
              </span>
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
                  className={`mt-2 text-xs hover:underline block ${
                    isMax ? 'text-purple-400' : 'text-[#54a9eb]'
                  }`}
                >
                  Пропустить проверку и войти принудительно →
                </button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e, false)} className="space-y-4">
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
                  className={`w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none transition-colors ${
                    isMax ? 'focus:border-purple-500' : 'focus:border-[#2481cc]'
                  }`}
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
                  className={`w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none transition-colors ${
                    isMax ? 'focus:border-purple-500' : 'focus:border-[#2481cc]'
                  }`}
                />
              </div>
            </div>

            {/* apiUrl (optional) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7f91a4]">
                  API URL (Хост)
                </label>
                <span className={`text-xs ${isMax ? 'text-purple-400/80' : 'text-[#54a9eb]/70'}`}>
                  Опционально
                </span>
              </div>
              <div className="relative">
                <Globe className="w-5 h-5 text-[#7f91a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.green-api.com"
                  className={`w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none transition-colors ${
                    isMax ? 'focus:border-purple-500' : 'focus:border-[#2481cc]'
                  }`}
                />
              </div>
              <p className="text-[11px] text-[#7f91a4] mt-1.5">
                Укажите выделенный хост (например, <code className={isMax ? 'text-purple-400' : 'text-[#54a9eb]'}>https://7103.api.green-api.com</code>) или оставьте пустым.
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-2 text-white font-medium py-3 px-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                isMax
                  ? 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 shadow-purple-600/25'
                  : 'bg-[#2481cc] hover:bg-[#1e72b6] active:bg-[#1965a3] shadow-[#2481cc]/25'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Проверка подключения...</span>
                </>
              ) : (
                <span>Подключиться к {isMax ? 'MAX' : 'Telegram'}</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#232e3c] text-center">
            <p className="text-xs text-[#7f91a4]">
              Данные инстанса можно получить на{' '}
              <a
                href={isMax ? 'https://green-api.com/max' : 'https://green-api.com'}
                target="_blank"
                rel="noreferrer"
                className={`hover:underline font-medium ${isMax ? 'text-purple-400' : 'text-[#54a9eb]'}`}
              >
                {isMax ? 'green-api.com/max' : 'green-api.com'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
