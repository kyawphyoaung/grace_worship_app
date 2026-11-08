export type Language = "mm" | "en";

export const strings = {
  appName: { en: "Grace", mm: "Grace" },
  nav: {
    home: { en: "Home", mm: "ပင်မ" },
    bible: { en: "Bible", mm: "ကျမ်းစာ" },
    prayer: { en: "Prayer", mm: "ဆုတောင်း" },
    worship: { en: "Worship", mm: "ကိုးကွယ်ခြင်း" },
  },
  auth: {
    loginTitle: { en: "Welcome back", mm: "ပြန်လည်ကြိုဆိုပါသည်" },
    loginDescription: {
      en: "Sign in to continue to Grace",
      mm: "Grace သို့ ဆက်လက်အသုံးပြုရန် ဝင်ရောက်ပါ",
    },
    email: { en: "Email", mm: "အီးမေးလ်" },
    password: { en: "Password", mm: "စကားဝှက်" },
    login: { en: "Login", mm: "ဝင်ရောက်ရန်" },
    loggingIn: { en: "Logging in…", mm: "ဝင်ရောက်နေသည်…" },
    forgotPassword: {
      en: "Forgot your password?",
      mm: "စကားဝှက် မေ့နေပါသလား?",
    },
    logout: { en: "Log out", mm: "ထွက်ရန်" },
  },
  partner: {
    notLinkedTitle: {
      en: "Partner not linked yet",
      mm: "အဖော်နှင့် မချိတ်ဆက်ရသေးပါ",
    },
    notLinkedBody: {
      en: "Your account is ready. Ask the owner to link your partner in Supabase so you can share Bible study, prayer, and worship together.",
      mm: "သင့်အကောင့် အဆင်သင့်ဖြစ်ပါပြီ။ ကျမ်းစာ၊ ဆုတောင်းနှင့် ကိုးကွယ်ခြင်းကို အတူမျှဝေနိုင်ရန် ပိုင်ရှင်အား အဖော်ချိတ်ဆက်ပေးရန် တောင်းဆိုပါ။",
    },
    switchHint: {
      en: "Each of you signs in with your own account. No in-app switch.",
      mm: "တစ်ဦးစီ မိမိအကောင့်ဖြင့် ဝင်ရောက်ပါ။ အက်ပ်အတွင်း ပြောင်းရန် မလိုပါ။",
    },
  },
  language: {
    label: { en: "Language", mm: "ဘာသာစကား" },
    en: { en: "English", mm: "English" },
    mm: { en: "Myanmar", mm: "မြန်မာ" },
  },
  stubs: {
    comingSoon: {
      en: "Coming in a later phase.",
      mm: "နောက်အဆင့်တွင် ရရှိပါမည်။",
    },
    worship: {
      en: "Worship planning will live here.",
      mm: "ကိုးကွယ်ခြင်း စီစဉ်မှု ဤနေရာတွင် ရရှိပါမည်။",
    },
  },
  common: {
    loading: { en: "Loading…", mm: "ဖွင့်နေသည်…" },
    save: { en: "Save", mm: "သိမ်းရန်" },
    cancel: { en: "Cancel", mm: "ပယ်ဖျက်" },
    delete: { en: "Delete", mm: "ဖျက်ရန်" },
    edit: { en: "Edit", mm: "ပြင်ရန်" },
    add: { en: "Add", mm: "ထည့်ရန်" },
    search: { en: "Search", mm: "ရှာရန်" },
    shared: { en: "Shared", mm: "မျှဝေထား" },
    private: { en: "Private", mm: "သီးသန့်" },
    empty: { en: "Nothing here yet.", mm: "မရှိသေးပါ။" },
    done: { en: "Done", mm: "ပြီးပြီ" },
    shareWithName: {
      en: "Share with {name}",
      mm: "{name} နှင့် မျှဝေရန်",
    },
  },
  home: {
    continueReading: { en: "Continue Reading", mm: "ဆက်ဖတ်ရန်" },
    startReading: { en: "Start reading", mm: "စတင်ဖတ်ရန်" },
    lastRead: { en: "Last read", mm: "နောက်ဆုံးဖတ်ခဲ့" },
    togetherFor: { en: "Together for", mm: "အတူတကွ" },
    yearsMonthsDays: {
      en: "{y} years, {m} months, {d} days",
      mm: "{y} နှစ်၊ {m} လ၊ {d} ရက်",
    },
  },
  bible: {
    title: { en: "Bible", mm: "ကျမ်းစာ" },
    read: { en: "Read", mm: "ဖတ်ရန်" },
    search: { en: "Search", mm: "ရှာရန်" },
    streaks: { en: "Streaks", mm: "ဆက်တိုက်" },
    calendar: { en: "Calendar", mm: "ပြက္ခဒိန်" },
    partnerTab: { en: "{name}", mm: "{name}" },
    favorites: { en: "Favorites", mm: "အသည်းစွဲများ" },
    book: { en: "Book", mm: "ကျမ်း" },
    chapter: { en: "Chapter", mm: "အခန်း" },
    searchBooks: { en: "Search books…", mm: "ကျမ်းများ ရှာရန်…" },
    viewBoth: { en: "Both", mm: "နှစ်ဘာသာ" },
    viewMm: { en: "MM", mm: "မြန်မာ" },
    viewEn: { en: "EN", mm: "အင်္ဂလိပ်" },
    markRead: { en: "Mark chapter as read", mm: "အခန်းကို ဖတ်ပြီးဟုမှတ်ရန်" },
    markedRead: { en: "Chapter marked as read", mm: "ဖတ်ပြီးဟု မှတ်ပြီးပါပြီ" },
    saveNote: { en: "Save note", mm: "မှတ်ချက်သိမ်းရန်" },
    notePlaceholder: {
      en: "Write your reflection…",
      mm: "သင့်အတွေးများကို ရေးပါ…",
    },
    selectedVerses: { en: "Verses", mm: "ကျမ်းပိုဒ်" },
    searchPlaceholder: {
      en: "John 3 or a word…",
      mm: "John 3 သို့မဟုတ် စကားလုံး…",
    },
    currentStreak: { en: "Current streak", mm: "လက်ရှိ ဆက်တိုက်" },
    bestStreak: { en: "Best streak", mm: "အကောင်းဆုံး ဆက်တိုက်" },
    streakGift: {
      en: "A gentle gift for the days you showed up.",
      mm: "သင်ရှိနေခဲ့သော နေ့များအတွက် နူးညံ့သော လက်ဆောင်။",
    },
    days: { en: "days", mm: "ရက်" },
    chaptersRead: { en: "Chapters read", mm: "ဖတ်ပြီးသောအခန်းများ" },
    chaptersReadBy: {
      en: "Chapters {name} has read",
      mm: "{name} ဖတ်ခဲ့ပြီးသောအခန်းများ",
    },
    sharedNotesBy: {
      en: "Shared notes from {name}",
      mm: "{name} ၏ မျှဝေမှတ်ချက်များ",
    },
    sharedFavoritesBy: {
      en: "Shared favorites from {name}",
      mm: "{name} ၏ မျှဝေအသည်းစွဲများ",
    },
    noBooks: {
      en: "Bible data is not seeded yet. Run scripts/seed-bible.ts — see README.",
      mm: "ကျမ်းစာဒေတာ မထည့်ရသေးပါ။ README ကို ကြည့်ပြီး seed script ကို run ပါ။",
    },
    yourNotes: { en: "Your notes", mm: "သင့်မှတ်ချက်များ" },
    highlight: { en: "Highlight", mm: "အရောင်ခြယ်" },
    favorite: { en: "Favorite", mm: "အသည်းစွဲ" },
    removeFavorite: { en: "Remove", mm: "ဖယ်ရှား" },
    emptyPartner: {
      en: "{name} hasn’t shared reading activity yet.",
      mm: "{name} သည် ဖတ်ရှုမှု မမျှဝေရသေးပါ။",
    },
    emptyFavorites: {
      en: "No favorites yet. Long-press a verse or highlight text.",
      mm: "အသည်းစွဲများ မရှိသေးပါ။ ကျမ်းပိုဒ်ကို ကြာကြာနှိပ်ပါ သို့မဟုတ် စာသားကို အရောင်ခြယ်ပါ။",
    },
    last30Days: { en: "Last 30 days", mm: "နောက်ဆုံး ၃၀ ရက်" },
  },
  prayer: {
    title: { en: "Prayer", mm: "ဆုတောင်း" },
    prayers: { en: "Prayers", mm: "ဆုတောင်းများ" },
    journal: { en: "Private journal", mm: "သီးသန့်မှတ်တမ်း" },
    gratitude: { en: "Gratitude", mm: "ကျေးဇူးတင်" },
    settings: { en: "Settings", mm: "ဆက်တင်" },
    filterAll: { en: "All", mm: "အားလုံး" },
    filterPending: { en: "Pending", mm: "ဆိုင်းငံ့" },
    filterAnswered: { en: "Answered", mm: "ဖြေကြားပြီး" },
    filterShared: { en: "Shared", mm: "မျှဝေ" },
    filterPrivate: { en: "Private", mm: "သီးသန့်" },
    addPrayer: { en: "Add prayer", mm: "ဆုတောင်းထည့်ရန်" },
    editPrayer: { en: "Edit prayer", mm: "ဆုတောင်းပြင်ရန်" },
    titleField: { en: "Title", mm: "ခေါင်းစဉ်" },
    contentField: { en: "Prayer", mm: "ဆုတောင်းစာ" },
    markAnswered: { en: "Mark answered", mm: "ဖြေကြားပြီးဟုမှတ်ရန်" },
    answeredDate: { en: "Answered on", mm: "ဖြေကြားသည့်နေ့" },
    testimony: { en: "Testimony", mm: "သက်သေခံချက်" },
    iPrayed: { en: "I prayed for this", mm: "ဤအတွက် ဆုတောင်းခဲ့သည်" },
    encourage: { en: "Encourage", mm: "အားပေးရန်" },
    encouragementNote: {
      en: "Encouragement note",
      mm: "အားပေးစာ",
    },
    reminderTime: {
      en: "Daily prayer reminder",
      mm: "နေ့စဉ် ဆုတောင်း သတိပေးချိန်",
    },
    reminderHint: {
      en: "Saved now. Notifications will arrive in a later phase.",
      mm: "သိမ်းပြီးပါပြီ။ အသိပေးချက်များကို နောက်အဆင့်တွင် ချိတ်ဆက်ပါမည်။",
    },
    namePrayed: {
      en: "{name} prayed",
      mm: "{name} ဆုတောင်းခဲ့သည်",
    },
  },
  gratitude: {
    title: { en: "Gratitude", mm: "ကျေးဇူးတင်ခြင်း" },
    addEntry: { en: "Add gratitude", mm: "ကျေးဇူးတင်ချက် ထည့်ရန်" },
    placeholder: {
      en: "What are you thankful for today?",
      mm: "ယနေ့ ဘာအတွက် ကျေးဇူးတင်သလဲ?",
    },
    list: { en: "List", mm: "စာရင်း" },
    calendar: { en: "Calendar", mm: "ပြက္ခဒိန်" },
    monthly: { en: "Monthly", mm: "လစဉ်" },
    searchPlaceholder: {
      en: "Search gratitude…",
      mm: "ကျေးဇူးတင်ချက် ရှာရန်…",
    },
    thisMonth: {
      en: "This month’s gratitude",
      mm: "ဤလ၏ ကျေးဇူးတင်ချက်များ",
    },
    entriesCount: { en: "entries", mm: "ခု" },
  },
} as const;

type Leaf = { readonly en: string; readonly mm: string };

type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends Leaf
    ? Prefix extends ""
      ? K
      : `${Prefix}.${K}`
    : Paths<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
}[keyof T & string];

export type StringKey = Paths<typeof strings>;
