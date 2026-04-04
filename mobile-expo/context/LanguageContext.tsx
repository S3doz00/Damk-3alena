import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Lang = 'en' | 'ar'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => Promise<void>
  t: (key: string) => string
}

const translations: Record<string, Record<Lang, string>> = {
  // Settings screen
  settings:         { en: 'Settings',       ar: 'الإعدادات' },
  sectionLanguage:  { en: 'LANGUAGE',        ar: 'اللغة' },
  english:          { en: 'English',         ar: 'English' },
  arabic:           { en: 'العربية',         ar: 'العربية' },
  englishDesc:      { en: 'Use the app in English',          ar: 'استخدم التطبيق بالإنجليزية' },
  arabicDesc:       { en: 'استخدم التطبيق بالعربية',         ar: 'استخدم التطبيق بالعربية' },
  sectionAppearance:{ en: 'APPEARANCE',      ar: 'المظهر' },
  sectionAccount:   { en: 'ACCOUNT',         ar: 'الحساب' },
  sectionAbout:     { en: 'ABOUT',           ar: 'حول التطبيق' },
  deviceDefault:    { en: 'Device Default',  ar: 'افتراضي الجهاز' },
  followSystem:     { en: 'Follow system appearance', ar: 'اتبع مظهر النظام' },
  lightMode:        { en: 'Light',           ar: 'فاتح' },
  alwaysLight:      { en: 'Always use light mode',  ar: 'استخدام الوضع الفاتح دائمًا' },
  darkMode:         { en: 'Dark',            ar: 'داكن' },
  alwaysDark:       { en: 'Always use dark mode',   ar: 'استخدام الوضع الداكن دائمًا' },
  editProfile:      { en: 'Edit Profile',    ar: 'تعديل الملف الشخصي' },
  editEmail:        { en: 'Edit Email',      ar: 'تعديل البريد الإلكتروني' },
  notifications:    { en: 'Notifications',   ar: 'الإشعارات' },
  resetLocation:    { en: 'Reset Location Permission', ar: 'إعادة إذن الموقع' },
  appVersion:       { en: 'App Version',     ar: 'إصدار التطبيق' },
  builtFor:         { en: 'Built for',       ar: 'مُصمم لـ' },
  email:            { en: 'Email',           ar: 'البريد الإلكتروني' },
  enterEmail:       { en: 'Enter your email', ar: 'أدخل بريدك الإلكتروني' },
  updateEmail:      { en: 'Update Email',    ar: 'تحديث البريد' },
  updating:         { en: 'Updating...',     ar: 'جارٍ التحديث...' },
  emailUpdated:     { en: 'Email updated',   ar: 'تم تحديث البريد' },

  // Home screen
  greeting:         { en: 'Ahlan',           ar: 'أهلًا' },
  location:         { en: 'Amman, Jordan',   ar: 'عمّان، الأردن' },
  upcomingAppt:     { en: 'UPCOMING APPOINTMENT', ar: 'الموعد القادم' },
  noApptTitle:      { en: 'No Upcoming Appointment', ar: 'لا يوجد موعد قادم' },
  noApptSubtitle:   { en: 'Help someone in need — donate today', ar: 'ساعد من يحتاج — تبرع اليوم' },
  seeUrgent:        { en: 'See Urgent',      ar: 'طلبات عاجلة' },
  upcoming:         { en: 'Upcoming',        ar: 'قادم' },
  donationEligibility: { en: 'DONATION ELIGIBILITY', ar: 'الأهلية للتبرع' },
  youCanDonate:     { en: 'You Can Donate!', ar: 'يمكنك التبرع!' },
  eligibleToday:    { en: 'You are eligible to donate blood today.', ar: 'أنت مؤهل للتبرع بالدم اليوم.' },
  eligible:         { en: 'Eligible',        ar: 'مؤهل' },
  daysLeft:         { en: 'Days Left',       ar: 'أيام متبقية' },
  of90Days:         { en: 'of 90 days since your last donation', ar: 'من 90 يومًا منذ تبرعك الأخير' },
  lastDonation:     { en: 'Last donation:',  ar: 'آخر تبرع:' },
  yourBloodType:    { en: 'YOUR BLOOD TYPE', ar: 'فصيلة دمك' },
  bloodTypeTitle:   { en: 'Blood Type',      ar: 'فصيلة الدم' },
  universalDonor:   { en: 'Universal donor — your blood is the most needed', ar: 'متبرع عالمي — دمك الأكثر حاجة' },
  canHelpPatients:  { en: 'You can help patients who need your blood type', ar: 'يمكنك مساعدة المرضى الذين يحتاجون فصيلة دمك' },
  findHospital:     { en: 'Find a hospital', ar: 'ابحث عن مستشفى' },
  criticalNeeds:    { en: 'CRITICAL BLOOD NEEDS', ar: 'احتياجات الدم الحرجة' },
  seeAll:           { en: 'See all',         ar: 'عرض الكل' },
  critical:         { en: 'CRITICAL',        ar: 'حرج' },

  // Profile screen
  profile:          { en: 'Profile',         ar: 'الملف الشخصي' },
  donationStats:    { en: 'DONATION STATISTICS', ar: 'إحصائيات التبرع' },
  totalDonations:   { en: 'Total Donations', ar: 'إجمالي التبرعات' },
  lastDonationStat: { en: 'Last Donation',   ar: 'آخر تبرع' },
  nextEligible:     { en: 'Next Eligible',   ar: 'التالي المؤهل' },
  noneYet:          { en: 'None yet',        ar: 'لا يوجد بعد' },
  now:              { en: 'Now',             ar: 'الآن' },
  donationHistory:  { en: 'DONATION HISTORY', ar: 'سجل التبرعات' },
  donations:        { en: 'donations',       ar: 'تبرعات' },
  noDonationsTitle: { en: 'No Donations Yet', ar: 'لا تبرعات بعد' },
  noDonationsDesc:  { en: 'Start your journey and help save lives', ar: 'ابدأ رحلتك وساعد في إنقاذ الأرواح' },
  findHospitalBtn:  { en: 'Find a Hospital', ar: 'ابحث عن مستشفى' },
  quickActions:     { en: 'QUICK ACTIONS',   ar: 'إجراءات سريعة' },
  urgentRequests:   { en: 'Urgent Requests', ar: 'الطلبات العاجلة' },
  signOut:          { en: 'Sign Out',        ar: 'تسجيل الخروج' },
  signOutConfirm:   { en: 'Are you sure you want to sign out?', ar: 'هل أنت متأكد من تسجيل الخروج؟' },
  cancel:           { en: 'Cancel',          ar: 'إلغاء' },
  male:             { en: 'Male',            ar: 'ذكر' },
  female:           { en: 'Female',          ar: 'أنثى' },

  // Tab labels
  tabHome:          { en: 'Home',            ar: 'الرئيسية' },
  tabMap:           { en: 'Map',             ar: 'الخريطة' },
  tabUrgent:        { en: 'Urgent',          ar: 'عاجل' },
  tabProfile:       { en: 'Profile',         ar: 'الملف' },

  // Onboarding
  onboardStep1Title:   { en: 'Your Information',    ar: 'معلوماتك' },
  onboardStep1Desc:    { en: 'Help us match you with nearby blood needs', ar: 'ساعدنا في مطابقتك مع احتياجات الدم القريبة منك' },
  onboardStep2Title:   { en: 'Blood Type',          ar: 'فصيلة الدم' },
  onboardStep2Desc:    { en: 'This helps us alert you when your blood type is urgently needed', ar: 'يساعدنا هذا في تنبيهك عندما تكون فصيلة دمك مطلوبة بإلحاح' },
  onboardStep3Title:   { en: 'Your City',           ar: 'مدينتك' },
  onboardStep3Desc:    { en: "We'll show you the nearest hospitals and urgent requests", ar: 'سنعرض لك أقرب المستشفيات والطلبات العاجلة' },
  fullName:            { en: 'Full Name',            ar: 'الاسم الكامل' },
  fullNamePlaceholder: { en: 'Ahmad Al-Rashid',      ar: 'أحمد الراشد' },
  phoneNumber:         { en: 'Phone Number',         ar: 'رقم الهاتف' },
  dateOfBirth:         { en: 'Date of Birth (optional)', ar: 'تاريخ الميلاد (اختياري)' },
  weightOptional:      { en: 'Weight in kg (optional)', ar: 'الوزن بالكيلوغرام (اختياري)' },
  weightPlaceholder:   { en: 'e.g. 72',              ar: 'مثال: 72' },
  onboardBloodTypeNote:{ en: 'You can update this anytime in your profile settings', ar: 'يمكنك تحديث هذا في أي وقت من إعدادات ملفك الشخصي' },
  onboardContinue:     { en: 'Continue',             ar: 'التالي' },
  onboardFinish:       { en: 'Start Saving Lives',   ar: 'ابدأ إنقاذ الأرواح' },
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: async () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    AsyncStorage.getItem('lang').then(val => {
      if (val === 'ar' || val === 'en') setLangState(val)
    })
  }, [])

  async function setLang(l: Lang) {
    setLangState(l)
    await AsyncStorage.setItem('lang', l)
  }

  function t(key: string): string {
    return translations[key]?.[lang] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
