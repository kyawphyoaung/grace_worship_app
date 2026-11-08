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
    home: {
      en: "Your shared home for gentle rhythms of faith.",
      mm: "ယုံကြည်ခြင်း၏ နူးညံ့သော အလေ့အကျင့်များအတွက် သင်တို့၏ ပင်မစာမျက်နှာ။",
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
    shareWithPartner: {
      en: "Share with partner",
      mm: "အဖော်နှင့် မျှဝေရန်",
    },
  },
  bible: {
    title: { en: "Bible", mm: "ကျမ်းစာ" },
    read: { en: "Read", mm: "ဖတ်ရန်" },
    search: { en: "Search", mm: "ရှာရန်" },
    streaks: { en: "Streaks", mm: "ဆက်တိုက်" },
    calendar: { en: "Calendar", mm: "ပြက္ခဒိန်" },
    partner: { en: "Partner", mm: "အဖော်" },
    book: { en: "Book", mm: "ကျမ်း" },
    chapter: { en: "Chapter", mm: "အခန်း" },
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
    partnerProgress: {
      en: "Partner chapters read",
      mm: "အဖော် ဖတ်ပြီးသော အခန်းများ",
    },
    partnerNotes: {
      en: "Shared partner notes",
      mm: "အဖော်၏ မျှဝေမှတ်ချက်များ",
    },
    noBooks: {
      en: "Bible data is not seeded yet. Run scripts/seed-bible.ts — see README.",
      mm: "ကျမ်းစာဒေတာ မထည့်ရသေးပါ။ README ကို ကြည့်ပြီး seed script ကို run ပါ။",
    },
    yourNotes: { en: "Your notes", mm: "သင့်မှတ်ချက်များ" },
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
    partnerPrayed: {
      en: "Partner prayed",
      mm: "အဖော် ဆုတောင်းခဲ့သည်",
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
