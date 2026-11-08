export type DailyVerse = {
  ref_mm: string;
  ref_en: string;
  text_mm: string;
  text_en: string;
};

/** Curated bilingual verses for the home card (hardcoded, not from DB). */
export const DAILY_VERSES: DailyVerse[] = [
  {
    ref_mm: "ယောဟန် ၃:၁၆",
    ref_en: "John 3:16",
    text_mm:
      "ဘုရားသခင်သည် မိမိ၏ တစ်ပါးတည်းသောသားတော်ကို စွန့်တော်မူသည်တိုင်အောင် လောကီကို ချစ်တော်မူ၏။",
    text_en:
      "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
  },
  {
    ref_mm: "ဆာလံ ၂၃:၁",
    ref_en: "Psalm 23:1",
    text_mm: "ထာဝရဘုရားသည် ငါ၏ သိုးထိန်းဖြစ်တော်မူ၏။ ငါသည် မဆင်းရဲရ။",
    text_en: "The Lord is my shepherd; I shall not want.",
  },
  {
    ref_mm: "ဖိလိပ္ပိ ၄:၁၃",
    ref_en: "Philippians 4:13",
    text_mm: "ငါ့ကို ခွန်အားပေးတော်မူသောသူအားဖြင့် ခပ်သိမ်းသောအမှုတို့ကို ငါတတ်နိုင်၏။",
    text_en: "I can do all things through him who strengthens me.",
  },
  {
    ref_mm: "ယေရမိ ၂၉:၁၁",
    ref_en: "Jeremiah 29:11",
    text_mm:
      "သင်တို့အဘို့ ငါကြံစည်သော အကြံအစည်တို့ကို ငါသိ၏။ ဘေးကို မကြံ၊ ချမ်းသာကိုသာ ကြံ၏။",
    text_en:
      "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
  },
  {
    ref_mm: "သုတ္တံ ၃:၅-၆",
    ref_en: "Proverbs 3:5-6",
    text_mm:
      "စိတ်နှလုံးအကြွင်းမဲ့ ထာဝရဘုရားကို ကိုးစားလော့။ ကိုယ်ဉာဏ်ကို မမှီဝဲနှင့်။ သွားရာလမ်းရှိသမျှတို့၌ ကိုယ်တော်ကို အသိအမှတ်ပြုလော့။",
    text_en:
      "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
  },
  {
    ref_mm: "ရောမ ၈:၂၈",
    ref_en: "Romans 8:28",
    text_mm:
      "ဘုရားသခင်ကို ချစ်သောသူတို့အဘို့ ခပ်သိမ်းသောအမှုတို့သည် အကျိုးရှိစေခြင်းငှာ သက်ရောက်သည်ကို ငါတို့သိကြ၏။",
    text_en:
      "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
  },
  {
    ref_mm: "ဧဖက် ၄:၂",
    ref_en: "Ephesians 4:2",
    text_mm:
      "နှိမ့်ချခြင်း၊ နူးညံ့သိမ်မွေ့ခြင်း၊ စိတ်ရှည်ခြင်းနှင့် ပြည့်စုံ၍ ချစ်ခြင်းမေတ္တာအားဖြင့် တစ်ဦးကိုတစ်ဦး သည်းခံကြလော့။",
    text_en:
      "With all humility and gentleness, with patience, bearing with one another in love.",
  },
  {
    ref_mm: "ကောလောသဲ ၃:၁၄",
    ref_en: "Colossians 3:14",
    text_mm:
      "ဤအမှုရှိသမျှတို့အပေါ်၌ စုံလင်ခြင်း၏နှောင်ကြိုးဖြစ်သော ချစ်ခြင်းမေတ္တာကို ဝတ်ကြလော့။",
    text_en:
      "And above all these put on love, which binds everything together in perfect harmony.",
  },
  {
    ref_mm: "၁ ကောရိန္သု ၁၃:၄",
    ref_en: "1 Corinthians 13:4",
    text_mm:
      "ချစ်ခြင်းမေတ္တာသည် စိတ်ရှည်တတ်၏။ ကရုဏာနှင့် ပြည့်စုံ၏။ မချစ်မုန်း၊ မဝါကြွား၊ မာန်မမူ။",
    text_en:
      "Love is patient and kind; love does not envy or boast; it is not arrogant.",
  },
  {
    ref_mm: "၁ ကောရိန္သု ၁၃:၇",
    ref_en: "1 Corinthians 13:7",
    text_mm: "ခပ်သိမ်းသောအမှုကို သည်းခံ၏။ ယုံ၏။ မျှော်လင့်၏။ ခံနိုင်၏။",
    text_en: "Love bears all things, believes all things, hopes all things, endures all things.",
  },
  {
    ref_mm: "မဿဲ ၁၁:၂၈",
    ref_en: "Matthew 11:28",
    text_mm:
      "ပင်ပန်း၍ ဝန်လေးသောသူအပေါင်းတို့၊ ငါ့ထံသို့ လာကြလော့။ ငါသည် သင်တို့ကို ချမ်းသာပေးမည်။",
    text_en:
      "Come to me, all who labor and are heavy laden, and I will give you rest.",
  },
  {
    ref_mm: "မဿဲ ၆:၃၃",
    ref_en: "Matthew 6:33",
    text_mm:
      "ဘုရားသခင်၏နိုင်ငံတော်နှင့် သူ၏ဖြောင့်မတ်ခြင်းကို ရှာကြလော့။ ဤအရာရှိသမျှကို သင်တို့အား ပေးတော်မူလတံ့။",
    text_en:
      "But seek first the kingdom of God and his righteousness, and all these things will be added to you.",
  },
  {
    ref_mm: "ယောရှု ၁:၉",
    ref_en: "Joshua 1:9",
    text_mm:
      "ခိုင်ခံ့သောစိတ်ရှိလော့။ ရဲရင့်လော့။ သင်သွားရာအရပ်ရှိသမျှတို့၌ သင်၏ဘုရားသခင် ထာဝရဘုရားသည် ပါတော်မူ၏။",
    text_en:
      "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.",
  },
  {
    ref_mm: "ဟေရှာယ ၄၀:၃၁",
    ref_en: "Isaiah 40:31",
    text_mm:
      "ထာဝရဘုရားကို မြော်လင့်သောသူတို့မူကား အားသစ်ရကြလိမ့်မည်။ လင်းယုန်ကဲ့သို့ အတောင်နှင့် တက်ကြလိမ့်မည်။",
    text_en:
      "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles.",
  },
  {
    ref_mm: "ဆာလံ ၄၆:၁၀",
    ref_en: "Psalm 46:10",
    text_mm: "ငြိမ်ဝပ်စွာနေ၍ ငါသည် ဘုရားသခင်ဖြစ်သည်ကို သိမှတ်ကြလော့။",
    text_en: "Be still, and know that I am God.",
  },
  {
    ref_mm: "ဆာလံ ၁၁၈:၂၄",
    ref_en: "Psalm 118:24",
    text_mm: "ဤနေ့ရက်သည် ထာဝရဘုရား ဖန်ဆင်းတော်မူသောနေ့ဖြစ်၏။ ရွှင်လန်းဝမ်းမြောက်ကြကုန်အံ့။",
    text_en: "This is the day that the Lord has made; let us rejoice and be glad in it.",
  },
  {
    ref_mm: "ဆာလံ ၁၃၉:၁၄",
    ref_en: "Psalm 139:14",
    text_mm:
      "အံ့ဩဖွယ်ရာ၊ ထူးဆန်းစွာ ဖန်ဆင်းတော်မူသောကြောင့် ကိုယ်တော်ကို ချီးမွမ်းပါ၏။",
    text_en:
      "I praise you, for I am fearfully and wonderfully made. Wonderful are your works.",
  },
  {
    ref_mm: "မိက္ခာ ၆:၈",
    ref_en: "Micah 6:8",
    text_mm:
      "တရားသဖြင့် ပြုခြင်း၊ ကရုဏာကို နှစ်သက်ခြင်း၊ ဘုရားသခင်နှင့်အတူ နှိမ့်ချစွာ ကျင်လည်ခြင်းကိုသာ တောင်းတော်မူ၏။",
    text_en:
      "He has told you, O man, what is good; and what does the Lord require of you but to do justice, and to love kindness, and to walk humbly with your God?",
  },
  {
    ref_mm: "ဂလာတိ ၅:၂၂-၂၃",
    ref_en: "Galatians 5:22-23",
    text_mm:
      "ဝိညာဉ်တော်၏အသီးမူကား ချစ်ခြင်း၊ ဝမ်းမြောက်ခြင်း၊ ငြိမ်သက်ခြင်း၊ စိတ်ရှည်ခြင်း၊ ကြင်နာခြင်း၊ ကောင်းမြတ်ခြင်း၊ သစ္စာရှိခြင်း၊ နူးညံ့သိမ်မွေ့ခြင်း၊ မိမိကိုယ်ကို ချုပ်တည်းခြင်းတို့ပေတည်း။",
    text_en:
      "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.",
  },
  {
    ref_mm: "ဟေဗြဲ ၁၃:၅",
    ref_en: "Hebrews 13:5",
    text_mm: "ငါသည် သင့်ကို အလျှင်းစွန့်မည်မဟုတ်။ သင့်ကို အလျှင်းစွန့်ပစ်မည်မဟုတ်ဟု မိန့်တော်မူ၏။",
    text_en: "I will never leave you nor forsake you.",
  },
  {
    ref_mm: "၂ တိမောသေ ၁:၇",
    ref_en: "2 Timothy 1:7",
    text_mm:
      "ဘုရားသခင်သည် ကြောက်ရွံ့သောစိတ်ကို ငါတို့အား မပေးဘဲ၊ တန်ခိုး၊ ချစ်ခြင်း၊ သတိဆင်ခြင်ခြင်း စိတ်ကို ပေးတော်မူ၏။",
    text_en:
      "For God gave us a spirit not of fear but of power and love and self-control.",
  },
  {
    ref_mm: "ယာကုပ် ၁:၁၇",
    ref_en: "James 1:17",
    text_mm:
      "ကောင်းမြတ်သောအရာ၊ စုံလင်သောဆုတိုင်းသည် အထက်မှ အလင်း၏အဘထံတော်မှ ဆင်းသက်၏။",
    text_en:
      "Every good gift and every perfect gift is from above, coming down from the Father of lights.",
  },
  {
    ref_mm: "၁ ယောဟန် ၄:၁၉",
    ref_en: "1 John 4:19",
    text_mm: "ကိုယ်တော်သည် အရင် ငါတို့ကို ချစ်တော်မူသောကြောင့် ငါတို့သည် ချစ်ကြ၏။",
    text_en: "We love because he first loved us.",
  },
  {
    ref_mm: "ရောမ ၁၂:၁၂",
    ref_en: "Romans 12:12",
    text_mm: "မျှော်လင့်ခြင်း၌ ရွှင်လန်းကြလော့။ ဆင်းရဲခြင်း၌ သည်းခံကြလော့။ ဆုတောင်းခြင်း၌ မြဲမြံကြလော့။",
    text_en: "Rejoice in hope, be patient in tribulation, be constant in prayer.",
  },
  {
    ref_mm: "ကောလောသဲ ၃:၂၃",
    ref_en: "Colossians 3:23",
    text_mm: "ပြုသောအမှုရှိသမျှတို့ကို လူတို့အဘို့ မဟုတ်၊ ထာဝရဘုရားအဘို့ကဲ့သို့ စိတ်နှလုံးအကြွင်းမဲ့ ပြုကြလော့။",
    text_en:
      "Whatever you do, work heartily, as for the Lord and not for men.",
  },
  {
    ref_mm: "ဆာလံ ၃၄:၈",
    ref_en: "Psalm 34:8",
    text_mm: "ထာဝရဘုရားသည် ကောင်းမြတ်တော်မူကြောင်းကို မြည်းစမ်း၍ ကြည့်ရှုကြလော့။",
    text_en: "Oh, taste and see that the Lord is good!",
  },
  {
    ref_mm: "ယောဟန် ၁၄:၂၇",
    ref_en: "John 14:27",
    text_mm:
      "ငြိမ်သက်ခြင်းကို ငါထားခဲ့၏။ ငါ၏ငြိမ်သက်ခြင်းကို သင်တို့အား ငါပေး၏။ လောကီပေးသကဲ့သို့ ငါမပေး။",
    text_en:
      "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you.",
  },
  {
    ref_mm: "ယောဟန် ၁၅:၅",
    ref_en: "John 15:5",
    text_mm: "ငါသည် စပျစ်နွယ်ပင်ဖြစ်၏။ သင်တို့သည် အခက်များဖြစ်ကြ၏။ ငါနှင့်စပ်သောသူသည် များစွာသောအသီးကို သီးတတ်၏။",
    text_en:
      "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit.",
  },
  {
    ref_mm: "မာကု ၁၀:၉",
    ref_en: "Mark 10:9",
    text_mm: "ဘုရားသခင် ပူးတွဲစေသောအရာကို လူသည် မခွဲမဖြာစေနှင့်။",
    text_en: "What therefore God has joined together, let not man separate.",
  },
  {
    ref_mm: "ဧဇရ ၃:၁၁",
    ref_en: "Ezra 3:11",
    text_mm:
      "ထာဝရဘုရားသည် ကောင်းမြတ်တော်မူ၏။ ဣသရေလအမျိုး၌ ကရုဏာတော်သည် ထာဝရတည်၏ဟု ချီးမွမ်းသီချင်းဆိုကြ၏။",
    text_en:
      "For he is good, for his steadfast love endures forever toward Israel.",
  },
];
