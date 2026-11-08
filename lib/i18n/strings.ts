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
    bible: {
      en: "Bible study will live here.",
      mm: "ကျမ်းစာလေ့လာခြင်း ဤနေရာတွင် ရရှိပါမည်။",
    },
    prayer: {
      en: "Prayer and gratitude will live here.",
      mm: "ဆုတောင်းနှင့် ကျေးဇူးတင်ခြင်း ဤနေရာတွင် ရရှိပါမည်။",
    },
    worship: {
      en: "Worship planning will live here.",
      mm: "ကိုးကွယ်ခြင်း စီစဉ်မှု ဤနေရာတွင် ရရှိပါမည်။",
    },
  },
  common: {
    loading: { en: "Loading…", mm: "ဖွင့်နေသည်…" },
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
