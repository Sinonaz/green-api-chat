import React, { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { GreenApiService } from '../services/greenApi';
import { X, Phone, AtSign, Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const credentials = useChatStore((s) => s.credentials);
  const addChat = useChatStore((s) => s.addChat);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);

  const [mode, setMode] = useState<'phone' | 'identifier'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [contactName, setContactName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<{ chatId?: string; username?: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!credentials) return;
    setError(null);

    const inputVal = mode === 'phone' ? phoneNumber.trim() : identifier.trim();
    if (!inputVal) {
      setError('Пожалуйста, введите контактные данные получателя');
      return;
    }

    // Cleaned phone or identifier
    const cleanedDigits = inputVal.replace(/[^\d]/g, '');

    if (!force) {
      setIsLoading(true);
      try {
        const api = new GreenApiService(credentials);
        const checkResult = await api.checkAccount(inputVal);

        if (checkResult && checkResult.exist) {
          const finalChatId = checkResult.chatId || (mode === 'phone' ? cleanedDigits : inputVal.replace(/^@/, ''));
          const displayName = contactName.trim() || checkResult.username || inputVal;

          addChat({
            id: String(finalChatId),
            name: displayName,
            phoneNumber: mode === 'phone' ? inputVal : undefined,
            username: checkResult.username || (mode === 'identifier' ? inputVal.replace(/^@/, '') : undefined),
            createdAt: Date.now(),
          });

          setActiveChatId(String(finalChatId));
          onClose();
          return;
        } else {
          setAccountInfo({
            chatId: mode === 'phone' ? cleanedDigits : inputVal,
            username: mode === 'identifier' ? inputVal.replace(/^@/, '') : undefined,
          });
          setError('Аккаунт не найден автоматически в Telegram через checkAccount. Вы можете всё равно создать чат.');
          return;
        }
      } catch (err: any) {
        console.warn('CheckAccount error:', err);
        setError('Не удалось проверить аккаунт через API. Вы можете создать чат напрямую.');
        setAccountInfo({
          chatId: mode === 'phone' ? cleanedDigits : inputVal,
        });
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Direct / Force creation
    const finalChatId = accountInfo?.chatId || (mode === 'phone' ? cleanedDigits : inputVal.replace(/^@/, ''));
    const displayName = contactName.trim() || inputVal;

    addChat({
      id: String(finalChatId),
      name: displayName,
      phoneNumber: mode === 'phone' ? inputVal : undefined,
      username: mode === 'identifier' ? inputVal.replace(/^@/, '') : undefined,
      createdAt: Date.now(),
    });

    setActiveChatId(String(finalChatId));
    onClose();
  };

  const isMax = credentials?.messengerType === 'max';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#17212b] border border-[#232e3c] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232e3c]">
          <div className="flex items-center gap-2.5">
            <UserPlus className={`w-5 h-5 ${isMax ? 'text-purple-400' : 'text-[#54a9eb]'}`} />
            <h2 className="text-lg font-semibold text-white">
              Новый чат в {isMax ? 'MAX' : 'Telegram'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7f91a4] hover:text-white hover:bg-[#202b36] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex border-b border-[#232e3c] bg-[#131b24]">
          <button
            type="button"
            onClick={() => {
              setMode('phone');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              mode === 'phone'
                ? isMax
                  ? 'border-purple-500 text-purple-400 bg-[#17212b]'
                  : 'border-[#2481cc] text-[#54a9eb] bg-[#17212b]'
                : 'border-transparent text-[#7f91a4] hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Номер телефона</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('identifier');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              mode === 'identifier'
                ? isMax
                  ? 'border-purple-500 text-purple-400 bg-[#17212b]'
                  : 'border-[#2481cc] text-[#54a9eb] bg-[#17212b]'
                : 'border-transparent text-[#7f91a4] hover:text-white'
            }`}
          >
            <AtSign className="w-4 h-4" />
            <span>{isMax ? 'Chat ID' : 'Username / Chat ID'}</span>
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="mt-2 text-[#54a9eb] font-semibold hover:underline block"
                >
                  Создать чат без подтверждения →
                </button>
              </div>
            </div>
          )}

          {mode === 'phone' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7f91a4] mb-2">
                Номер телефона получателя
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#7f91a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  autoFocus
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Например: 79991234567"
                  className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
                />
              </div>
              <p className="text-[11px] text-[#7f91a4] mt-1.5">
                Введите номер в международном формате без плюса или спецсимволов.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7f91a4] mb-2">
                Telegram Username или Chat ID
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-[#7f91a4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="durov или 123456789"
                  className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
                />
              </div>
              <p className="text-[11px] text-[#7f91a4] mt-1.5">
                Имя пользователя Telegram (с @ или без) либо уникальный numeric ID.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7f91a4] mb-2">
              Имя контакта <span className="text-xs text-[#7f91a4] font-normal">(опционально)</span>
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Как отображать в списке чатов"
              className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl py-2.5 px-4 text-white text-sm placeholder-[#4e5d6e] focus:outline-none focus:border-[#2481cc] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-[#7f91a4] hover:text-white hover:bg-[#202b36] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 ${
                isMax
                  ? 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 shadow-purple-600/20'
                  : 'bg-[#2481cc] hover:bg-[#1e72b6] active:bg-[#1965a3] shadow-[#2481cc]/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Поиск в {isMax ? 'MAX' : 'Telegram'}...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Создать чат</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
