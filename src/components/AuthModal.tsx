import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/d91d9faa-15ce-4946-9029-5a689d818db9";

interface User {
  id: number;
  email: string | null;
  name: string;
  avatar_url: string | null;
  provider: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: User, token: string) => void;
}

type Tab = "login" | "register";

async function apiCall(action: string, data: Record<string, unknown> = {}, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, ...data }),
  });
  return res.json();
}

const OAUTH_PROVIDERS = [
  {
    id: "google",
    label: "Google",
    icon: "Chrome",
    color: "hover:border-red-500/40 hover:bg-red-500/5",
    iconColor: "text-red-400",
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "vk",
    label: "ВКонтакте",
    icon: "MessageSquare",
    color: "hover:border-blue-500/40 hover:bg-blue-500/5",
    iconColor: "text-blue-400",
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#5181B8">
        <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.5h-1.55c-.59 0-.77-.47-1.82-1.54-1-.99-1.45-.81-1.45.17v1.39c0 .34-.1.54-1.08.54-1.56 0-3.28-.93-4.49-2.67-1.82-2.57-2.32-4.49-2.32-4.88 0-.19.07-.37.27-.37h1.55c.41 0 .56.19.72.63.79 2.28 2.1 4.28 2.64 4.28.2 0 .3-.1.3-.63V9.67c-.07-1.13-.66-1.22-.66-1.63 0-.2.16-.4.41-.4h2.45c.34 0 .46.18.46.57v3.05c0 .34.15.46.24.46.2 0 .37-.12.74-.5 1.15-1.28 1.97-3.26 1.97-3.26.11-.23.3-.44.72-.44h1.55c.47 0 .57.24.47.57-.2.89-2.08 3.57-2.08 3.57-.16.27-.22.38 0 .68.16.22.68.68 1.03 1.09.65.74 1.14 1.36 1.27 1.79.14.42-.08.63-.5.63z"/>
      </svg>
    ),
  },
  {
    id: "yandex",
    label: "Яндекс",
    icon: "Search",
    color: "hover:border-yellow-500/40 hover:bg-yellow-500/5",
    iconColor: "text-yellow-400",
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#FC3F1D">
        <path d="M14.341 21H17V3h-2.959c-3.769 0-5.75 1.985-5.75 4.926 0 2.716 1.244 4.254 3.748 5.933L9 21h2.833l3.28-7.685-1.572-1.067C11.833 11.014 11 9.951 11 7.926c0-1.724 1.164-2.926 3.341-2.926V21z"/>
      </svg>
    ),
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "Send",
    color: "hover:border-sky-500/40 hover:bg-sky-500/5",
    iconColor: "text-sky-400",
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#29B6F6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.96c-.12.56-.46.7-.93.43l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.53.26l.19-2.65 4.83-4.36c.21-.19-.05-.29-.32-.11L7.4 14.77l-2.54-.79c-.55-.17-.56-.55.12-.82l9.91-3.82c.46-.17.86.11.75.46z"/>
      </svg>
    ),
  },
];

export default function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setEmail("");
      setPassword("");
      setName("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.data?.type === "oauth_callback") {
        const { provider, access_token, user_data } = e.data;
        setOauthLoading(provider);
        try {
          const res = await apiCall("oauth", { provider, access_token, user_data });
          if (res.token) {
            localStorage.setItem("auth_token", res.token);
            onAuth(res.user, res.token);
            onClose();
          } else {
            setError(res.error || "Ошибка OAuth");
          }
        } catch {
          setError("Ошибка подключения");
        } finally {
          setOauthLoading(null);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onAuth, onClose]);

  const handleEmailAuth = async () => {
    if (!email || !password) return setError("Заполните все поля");
    setLoading(true);
    setError("");
    try {
      const action = tab === "login" ? "login" : "register";
      const data = tab === "register" ? { email, password, name } : { email, password };
      const res = await apiCall(action, data);
      if (res.token) {
        localStorage.setItem("auth_token", res.token);
        onAuth(res.user, res.token);
        onClose();
      } else {
        setError(res.error || "Ошибка авторизации");
      }
    } catch {
      setError("Ошибка подключения к серверу");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = useCallback(async (providerId: string) => {
    if (providerId === "telegram") {
      const res = await apiCall("oauth_url", { provider: "telegram" });
      const botName = res.bot_name;
      if (!botName) return setError("Telegram бот не настроен. Добавьте TELEGRAM_BOT_NAME в секреты.");
      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", botName);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-onauth", "onTelegramAuth");
      script.setAttribute("data-request-access", "write");
      (window as Record<string, unknown>).onTelegramAuth = (user: Record<string, unknown>) => {
        window.postMessage({ type: "oauth_callback", provider: "telegram", user_data: user }, "*");
      };
      document.getElementById("tg-widget-container")?.appendChild(script);
      return;
    }

    setOauthLoading(providerId);
    try {
      const redirectUri = encodeURIComponent(window.location.origin + "/oauth-callback");
      const res = await apiCall("oauth_url", { provider: providerId, redirect_uri: redirectUri });
      if (res.url) {
        const popup = window.open(res.url, "oauth", "width=600,height=700,left=300,top=100");
        if (!popup) setError("Разрешите всплывающие окна в браузере");
      } else {
        setError(res.error || "Не удалось получить URL");
      }
    } catch {
      setError("Ошибка подключения");
    } finally {
      setOauthLoading(null);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-3xl w-full max-w-md p-8 border border-white/10 animate-scale-in shadow-2xl">
        {/* Close */}
        <button onClick={onClose} className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors">
          <Icon name="X" size={18} />
        </button>

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-2xl btn-neon flex items-center justify-center text-xl font-bold font-oswald mx-auto mb-3">P</div>
          <h2 className="font-oswald text-2xl font-bold text-white">
            {tab === "login" ? "Добро пожаловать" : "Создать аккаунт"}
          </h2>
          <p className="text-white/40 text-sm mt-1">
            {tab === "login" ? "Войдите в Post" : "Начните работу с Post"}<span className="text-neon">AI</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 mb-6">
          {(["login", "register"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
              {t === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        {/* OAuth buttons */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {OAUTH_PROVIDERS.map(p => (
            <button key={p.id} onClick={() => handleOAuth(p.id)} disabled={!!oauthLoading}
              className={`glass rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-white/5 transition-all ${p.color} disabled:opacity-50`}>
              <span className="flex-shrink-0">{p.logo}</span>
              <span className="text-white/70 text-sm font-medium truncate">{p.label}</span>
              {oauthLoading === p.id && <Icon name="Loader2" size={13} className="text-white/40 animate-spin ml-auto" />}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-white/25 text-xs">или через email</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Email form */}
        <div className="space-y-3">
          {tab === "register" && (
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full bg-white/5 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-neon/40 transition-all" />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)}
            type="email" placeholder="Email адрес"
            onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-neon/40 transition-all" />
          <div className="relative">
            <input value={password} onChange={e => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"} placeholder="Пароль"
              onKeyDown={e => e.key === "Enter" && handleEmailAuth()}
              className="w-full bg-white/5 rounded-xl px-4 py-3 pr-11 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-neon/40 transition-all" />
            <button onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <Icon name="AlertCircle" size={15} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleEmailAuth} disabled={loading}
          className="btn-neon w-full mt-4 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? <><Icon name="Loader2" size={16} className="animate-spin" /> Входим...</> :
            tab === "login" ? <><Icon name="LogIn" size={16} /> Войти</> : <><Icon name="UserPlus" size={16} /> Создать аккаунт</>}
        </button>

        {/* Telegram widget container (hidden) */}
        <div id="tg-widget-container" className="hidden" />

        <p className="text-white/20 text-xs text-center mt-4">
          Нажимая «Войти», вы соглашаетесь с{" "}
          <button className="text-white/40 hover:text-white underline">условиями использования</button>
        </p>
      </div>
    </div>
  );
}