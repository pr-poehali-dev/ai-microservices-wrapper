import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NAV_ITEMS = [
  { id: "hero", label: "Главная" },
  { id: "generator", label: "Генератор" },
  { id: "examples", label: "Примеры" },
  { id: "pricing", label: "Тарифы" },
  { id: "docs", label: "Документация" },
  { id: "contacts", label: "Контакты" },
];

const TONES = ["Профессиональный", "Дружелюбный", "Провокационный", "Вдохновляющий", "Юмористический", "Нейтральный"];
const STYLES = ["Storytelling", "Список / Tips", "Экспертный разбор", "Личная история", "Новостной", "Вопрос–ответ"];
const AUDIENCES = ["Предприниматели", "B2B клиенты", "Молодёжь 18–25", "HR и рекрутеры", "Маркетологи", "Широкая аудитория"];

const EXAMPLES = [
  {
    platform: "Instagram",
    tone: "Вдохновляющий",
    text: "Три года назад я боялся запустить первый проект. Сегодня наша команда — 40 человек, а выручка перевалила за 100 млн. Разница между мечтой и реальностью — одно решение. Ты уже сделал его?",
    tags: ["#бизнес", "#мотивация", "#рост"],
    icon: "Instagram",
  },
  {
    platform: "LinkedIn",
    tone: "Профессиональный",
    text: "5 ошибок при масштабировании отдела продаж, которые обошлись нам в 2 млн рублей:\n\n1. Нанимали быстро, обучали медленно\n2. Не считали unit-экономику\n3. Не строили воронку привлечения",
    tags: ["#продажи", "#менеджмент"],
    icon: "Linkedin",
  },
  {
    platform: "Telegram",
    tone: "Дружелюбный",
    text: "Знаете, почему 90% постов не работают? Потому что пишут для себя, а не для читателя. Простое правило: каждый абзац должен давать ценность. Сохраняй, пригодится 👇",
    tags: ["#контент", "#smm"],
    icon: "Send",
  },
];

const PLANS = [
  {
    name: "Старт",
    priceMonth: "0",
    priceYear: "0",
    priceYearTotal: "",
    period: "бесплатно",
    desc: "Для знакомства с сервисом",
    features: ["30 генераций / месяц", "3 тона голоса", "Базовые стили", "Экспорт в текст"],
    cta: "Начать бесплатно",
    highlight: false,
    save: "",
  },
  {
    name: "Про",
    priceMonth: "1 490",
    priceYear: "990",
    priceYearTotal: "11 880",
    period: "₽ / месяц",
    desc: "Для активного контент-мейкера",
    features: ["500 генераций / месяц", "Все тона и стили", "Настройка аудитории", "Ключевые слова SEO", "История генераций", "Приоритетная поддержка"],
    cta: "Выбрать Про",
    highlight: true,
    save: "−34%",
  },
  {
    name: "Команда",
    priceMonth: "4 990",
    priceYear: "3 490",
    priceYearTotal: "41 880",
    period: "₽ / месяц",
    desc: "Для агентств и команд",
    features: ["Безлимит генераций", "До 5 пользователей", "Брендбук и голос бренда", "API доступ", "Аналитика постов", "Персональный менеджер"],
    cta: "Связаться с нами",
    highlight: false,
    save: "−30%",
  },
];

const DOCS = [
  { icon: "BookOpen", title: "Быстрый старт", desc: "Создайте первый пост за 2 минуты", time: "5 мин" },
  { icon: "Settings", title: "Настройка профиля", desc: "Голос бренда и целевая аудитория", time: "10 мин" },
  { icon: "Zap", title: "API интеграция", desc: "Подключите генератор к своим сервисам", time: "30 мин" },
  { icon: "BarChart2", title: "Аналитика", desc: "Анализируйте эффективность постов", time: "7 мин" },
  { icon: "Layers", title: "Шаблоны", desc: "Готовые форматы для разных платформ", time: "3 мин" },
  { icon: "Globe", title: "Мультиязычность", desc: "Генерация на 12 языках", time: "5 мин" },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [tone, setTone] = useState<string[]>([]);
  const [style, setStyle] = useState<string[]>([]);
  const [audience, setAudience] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [charCount, setCharCount] = useState(0);

  const [billingYear, setBillingYear] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS.map(n => document.getElementById(n.id));
      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(NAV_ITEMS[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  const toggle = (arr: string[], val: string, set: (a: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGeneratedText("");
    setCharCount(0);

    const result = `✨ ${tone[0] || "Профессиональный"} тон | ${style[0] || "Storytelling"}\n\n${topic} — это не просто тема для поста. Это точка входа в разговор с вашей аудиторией.\n\nКогда мы говорим о ${keywords || "вашей нише"}, важно помнить: ${audience[0] ? `"${audience[0]}"` : "ваши читатели"} хотят не информации — они хотят решений.\n\nТри ключевых шага:\n1. Определите главную боль аудитории\n2. Покажите трансформацию через ваш продукт\n3. Добавьте призыв к действию\n\nРезультат? Посты, которые не просто читают — на которые реагируют.\n\n#контент #маркетинг #smm`;

    let i = 0;
    const interval = setInterval(() => {
      if (i <= result.length) {
        setGeneratedText(result.slice(0, i));
        setCharCount(i);
        i += 3;
      } else {
        setGenerating(false);
        clearInterval(interval);
      }
    }, 20);
  };

  return (
    <div className="mesh-bg min-h-screen font-golos">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg btn-neon flex items-center justify-center text-sm font-bold font-oswald">P</div>
            <span className="font-oswald font-semibold text-lg tracking-wide">Post<span className="neon-text">AI</span></span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(n => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === n.id ? "text-neon bg-white/5" : "text-white/60 hover:text-white hover:bg-white/5"}`}
              >
                {n.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2">Войти</button>
            <button className="btn-neon text-sm px-5 py-2 rounded-xl font-semibold">Попробовать бесплатно</button>
          </div>

          <button className="md:hidden text-white/70" onClick={() => setMobileMenu(!mobileMenu)}>
            <Icon name={mobileMenu ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden glass border-t border-white/5 px-6 py-4 flex flex-col gap-2 animate-fade-in">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className="text-left py-3 px-4 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm">
                {n.label}
              </button>
            ))}
            <button className="btn-neon mt-2 py-3 rounded-xl text-sm font-semibold">Попробовать бесплатно</button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="hero" className="min-h-screen flex items-center justify-center relative pt-16 overflow-hidden">
        <div className="absolute top-32 left-1/4 w-96 h-96 bg-neon/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 bg-neon rounded-full animate-pulse" />
            <span className="text-white/70 text-sm">ИИ-генератор контента нового поколения</span>
          </div>

          <h1 className="font-oswald text-6xl md:text-8xl font-bold leading-none mb-6 animate-fade-in-up delay-100">
            <span className="text-white">СОЗДАВАЙ</span><br />
            <span className="gradient-text">ПОСТЫ</span><br />
            <span className="text-white">ЗА СЕКУНДЫ</span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
            Настрой тон, стиль и аудиторию — получи готовый текст, который работает.<br />
            Без шаблонов. Без копипасты. Только живой контент.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <button onClick={() => scrollTo("generator")} className="btn-neon px-8 py-4 rounded-2xl text-base font-semibold flex items-center gap-2 justify-center">
              <Icon name="Zap" size={18} />
              Попробовать бесплатно
            </button>
            <button onClick={() => scrollTo("examples")} className="glass px-8 py-4 rounded-2xl text-white/70 hover:text-white transition-all text-base font-medium flex items-center gap-2 justify-center">
              <Icon name="PlayCircle" size={18} />
              Смотреть примеры
            </button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto animate-fade-in-up delay-400">
            {[["50K+", "Пользователей"], ["2М+", "Постов создано"], ["98%", "Довольных клиентов"]].map(([val, lbl]) => (
              <div key={lbl} className="text-center">
                <div className="font-oswald text-3xl font-bold neon-text">{val}</div>
                <div className="text-white/40 text-xs mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float opacity-40">
          <Icon name="ChevronDown" size={24} className="text-white" />
        </div>
      </section>

      {/* GENERATOR */}
      <section id="generator" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
              <Icon name="Sparkles" size={14} className="text-neon" />
              <span className="text-white/60 text-xs uppercase tracking-widest">Генератор</span>
            </div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white mb-4">Настрой и создай</h2>
            <p className="text-white/50 text-lg">Выбери параметры и получи уникальный пост за секунды</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="glass rounded-2xl p-5">
                <label className="text-white/50 text-xs uppercase tracking-widest mb-3 block">Тема поста</label>
                <textarea
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Например: Как наша команда за 3 месяца увеличила конверсию на 40%..."
                  rows={3}
                  className="w-full bg-transparent text-white placeholder-white/25 text-sm resize-none focus:outline-none leading-relaxed"
                />
              </div>

              <div className="glass rounded-2xl p-5">
                <label className="text-white/50 text-xs uppercase tracking-widest mb-3 block">Ключевые слова</label>
                <input
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="маркетинг, продажи, рост, команда..."
                  className="w-full bg-transparent text-white placeholder-white/25 text-sm focus:outline-none"
                />
              </div>

              <div className="glass rounded-2xl p-5">
                <label className="text-white/50 text-xs uppercase tracking-widest mb-3 block">Тон голоса</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <button key={t} onClick={() => toggle(tone, t, setTone)}
                      className={`tag-option text-xs px-3 py-1.5 rounded-lg ${tone.includes(t) ? "selected" : ""}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <label className="text-white/50 text-xs uppercase tracking-widest mb-3 block">Стиль</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(s => (
                    <button key={s} onClick={() => toggle(style, s, setStyle)}
                      className={`tag-option text-xs px-3 py-1.5 rounded-lg ${style.includes(s) ? "selected" : ""}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <label className="text-white/50 text-xs uppercase tracking-widest mb-3 block">Целевая аудитория</label>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCES.map(a => (
                    <button key={a} onClick={() => toggle(audience, a, setAudience)}
                      className={`tag-option text-xs px-3 py-1.5 rounded-lg ${audience.includes(a) ? "selected" : ""}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="btn-neon w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Icon name="Loader2" size={18} className="animate-spin" />
                    Генерирую...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={18} />
                    Сгенерировать пост
                  </>
                )}
              </button>
            </div>

            <div className="glass rounded-2xl p-6 flex flex-col min-h-[500px] relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon" />
                  <span className="text-white/50 text-xs uppercase tracking-widest">Результат</span>
                </div>
                {generatedText && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs">{charCount} симв.</span>
                    <button className="text-white/40 hover:text-neon transition-colors">
                      <Icon name="Copy" size={15} />
                    </button>
                  </div>
                )}
              </div>

              {!generatedText && !generating && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Icon name="FileText" size={48} className="text-white/10 mb-4" />
                  <p className="text-white/30 text-sm">Заполни параметры слева<br />и нажми «Сгенерировать»</p>
                </div>
              )}

              {(generatedText || generating) && (
                <div className="flex-1 text-white/85 text-sm leading-relaxed whitespace-pre-wrap">
                  {generatedText}
                  {generating && <span className="inline-block w-0.5 h-4 bg-neon ml-0.5 animate-pulse" />}
                </div>
              )}

              {generatedText && !generating && (
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                  <button className="flex-1 glass rounded-xl py-2.5 text-xs text-white/60 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Icon name="RefreshCw" size={13} /> Перегенерировать
                  </button>
                  <button className="flex-1 btn-neon rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2">
                    <Icon name="Download" size={13} /> Сохранить
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section id="examples" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
              <Icon name="Star" size={14} className="text-neon" />
              <span className="text-white/60 text-xs uppercase tracking-widest">Примеры</span>
            </div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white mb-4">Что умеет PostAI</h2>
            <p className="text-white/50 text-lg">Реальные примеры постов для разных платформ</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {EXAMPLES.map((ex, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:border-white/15 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center">
                      <Icon name={ex.icon} size={16} className="text-neon" fallback="MessageSquare" />
                    </div>
                    <span className="font-oswald font-semibold text-white text-sm">{ex.platform}</span>
                  </div>
                  <span className="text-xs text-white/30 glass rounded-full px-2 py-0.5">{ex.tone}</span>
                </div>
                <p className="text-white/65 text-sm leading-relaxed mb-4 whitespace-pre-line">{ex.text}</p>
                <div className="flex flex-wrap gap-1">
                  {ex.tags.map(tag => (
                    <span key={tag} className="text-xs text-neon/70 bg-neon/5 rounded-full px-2 py-0.5">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => scrollTo("generator")} className="btn-neon px-8 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 mx-auto">
              <Icon name="Sparkles" size={16} /> Создать похожий пост
            </button>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
              <Icon name="CreditCard" size={14} className="text-neon" />
              <span className="text-white/60 text-xs uppercase tracking-widest">Тарифы</span>
            </div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white mb-4">Выбери свой план</h2>
            <p className="text-white/50 text-lg mb-8">Начни бесплатно, масштабируй по мере роста</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-4 glass rounded-2xl px-2 py-2">
              <button
                onClick={() => setBillingYear(false)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!billingYear ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              >
                Ежемесячно
              </button>
              <button
                onClick={() => setBillingYear(true)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${billingYear ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
              >
                Ежегодно
                <span className="bg-neon text-background text-xs font-bold px-2 py-0.5 rounded-full">−30%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => {
              const price = billingYear ? plan.priceYear : plan.priceMonth;
              return (
                <div key={i} className={`rounded-2xl p-6 relative ${plan.highlight ? "bg-neon/5 border border-neon/30" : "glass"}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon text-background text-xs font-bold px-4 py-1 rounded-full font-oswald">
                      ПОПУЛЯРНЫЙ
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="font-oswald text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-white/40 text-sm mb-4">{plan.desc}</p>
                    <div className="flex items-end gap-2">
                      <span className={`font-oswald text-4xl font-bold transition-all ${plan.highlight ? "text-neon" : "text-white"}`}>{price}</span>
                      <div className="mb-1">
                        <span className="text-white/40 text-sm block">{plan.period}</span>
                        {billingYear && plan.priceYearTotal && (
                          <span className="text-white/25 text-xs">{plan.priceYearTotal} ₽ / год</span>
                        )}
                      </div>
                      {billingYear && plan.save && (
                        <span className="mb-1 text-xs font-bold text-neon bg-neon/10 px-2 py-0.5 rounded-full">{plan.save}</span>
                      )}
                    </div>
                    {!billingYear && plan.save && (
                      <p className="text-white/30 text-xs mt-1">При годовой оплате — экономия {plan.save}</p>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-neon/20" : "bg-white/5"}`}>
                          <Icon name="Check" size={10} className={plan.highlight ? "text-neon" : "text-white/50"} />
                        </div>
                        <span className="text-white/60 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.highlight ? "btn-neon" : "glass text-white/70 hover:text-white"}`}>
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DOCS */}
      <section id="docs" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon/3 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
              <Icon name="BookOpen" size={14} className="text-neon" />
              <span className="text-white/60 text-xs uppercase tracking-widest">Документация</span>
            </div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white mb-4">Всё для работы</h2>
            <p className="text-white/50 text-lg">Гайды, туториалы и API-документация</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {DOCS.map((doc, i) => (
              <button key={i} className="glass rounded-2xl p-5 text-left hover:border-white/15 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-neon/8 flex items-center justify-center group-hover:bg-neon/15 transition-colors">
                    <Icon name={doc.icon} size={18} className="text-neon" fallback="FileText" />
                  </div>
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <Icon name="Clock" size={11} /> {doc.time}
                  </span>
                </div>
                <h4 className="font-semibold text-white mb-1 text-sm group-hover:text-neon transition-colors">{doc.title}</h4>
                <p className="text-white/40 text-xs leading-relaxed">{doc.desc}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-oswald text-lg font-semibold text-white mb-1">Нужна помощь с интеграцией?</h4>
              <p className="text-white/40 text-sm">Наши разработчики помогут подключить PostAI к вашей системе</p>
            </div>
            <button className="btn-neon px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap flex items-center gap-2">
              <Icon name="MessageCircle" size={16} /> Написать в поддержку
            </button>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
              <Icon name="Mail" size={14} className="text-neon" />
              <span className="text-white/60 text-xs uppercase tracking-widest">Контакты</span>
            </div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white mb-4">Свяжитесь с нами</h2>
            <p className="text-white/50 text-lg">Ответим на любые вопросы в течение нескольких часов</p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            <div className="md:col-span-3 glass rounded-2xl p-7">
              <div className="space-y-4">
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">Имя</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full bg-white/5 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-neon/40 transition-all" />
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">Email</label>
                  <input value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                    placeholder="ivan@company.ru"
                    className="w-full bg-white/5 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-neon/40 transition-all" />
                </div>
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">Сообщение</label>
                  <textarea value={contactMsg} onChange={e => setContactMsg(e.target.value)}
                    placeholder="Расскажите о вашем проекте..."
                    rows={4}
                    className="w-full bg-white/5 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-1 focus:ring-neon/40 transition-all resize-none" />
                </div>
                <button className="btn-neon w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                  <Icon name="Send" size={16} /> Отправить сообщение
                </button>
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-4">
              {[
                { icon: "Mail", label: "Email", val: "hello@postai.ru" },
                { icon: "MessageCircle", label: "Telegram", val: "@postai_support" },
                { icon: "Phone", label: "Телефон", val: "+7 (800) 000-00-00" },
              ].map(c => (
                <div key={c.label} className="glass rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neon/8 flex items-center justify-center flex-shrink-0">
                    <Icon name={c.icon} size={18} className="text-neon" fallback="Mail" />
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-0.5">{c.label}</div>
                    <div className="text-white text-sm font-medium">{c.val}</div>
                  </div>
                </div>
              ))}

              <div className="glass rounded-2xl p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-2 h-2 bg-neon rounded-full mb-3 animate-pulse" />
                  <p className="text-white/50 text-sm leading-relaxed">Поддержка работает<br /><span className="text-white font-medium">Пн–Пт, 9:00–21:00 МСК</span></p>
                </div>
                <div className="mt-4 flex gap-2">
                  {["Github", "Twitter", "Linkedin"].map(s => (
                    <button key={s} className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/40 hover:text-neon transition-colors">
                      <Icon name={s} size={16} fallback="Globe" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md btn-neon flex items-center justify-center text-xs font-bold font-oswald">P</div>
            <span className="font-oswald text-white/60 text-sm">Post<span className="text-neon">AI</span> © 2024</span>
          </div>
          <div className="flex gap-6">
            {["Условия", "Конфиденциальность", "Cookies"].map(l => (
              <button key={l} className="text-white/30 hover:text-white/60 text-sm transition-colors">{l}</button>
            ))}
          </div>
          <div className="text-white/20 text-xs">Сделано с ❤️ в России</div>
        </div>
      </footer>
    </div>
  );
}