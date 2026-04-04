import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Lang = 'en' | 'ar'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const translations: Record<string, Record<Lang, string>> = {
  // Settings screen
  settings:       { en: 'Settings',      ar: 'الإعدادات' },
  language:       { en: 'Language',      ar: 'اللغة' },
  sectionLanguage:{ en: 'LANGUAGE',      ar: 'اللغة' },
  english:        { en: 'English',       ar: 'English' },
  arabic:         { en: 'العربية',       ar: 'العربية' },
  englishDesc:    { en: 'Use the app in English', ar: 'استخدم التطبيق بالإنجليزية' },
  arabicDesc:     { en: 'استخدم التطبيق بالعربية', ar: 'استخدم التطبيق بالعربية' },
  sectionAppearance: { en: 'APPEARANCE', ar: 'المظهر' },
  sectionAccount: { en: 'ACCOUNT',       ar: 'الحساب' },
  sectionAbout:   { en: 'ABOUT',         ar: 'حول التطبيق' },
  deviceDefault:  { en: 'Device Default', ar: 'افتراضي الجهاز' },
  followSystem:   { en: 'Follow system appearance', ar: 'اتبع مظهر النظام' },
  lightMode:      { en: 'Light',         ar: 'فاتح' },
  alwaysLight:    { en: 'Always use light mode', ar: 'استخدام الوضع الفاتح دائمًا' },
  darkMode:       { en: 'Dark',          ar: 'داكن' },
  alwaysDark:     { en: 'Always use dark mode', ar: 'استخدام الوضع الداكن دائمًا' },
  editProfile:    { en: 'Edit Profile',  ar: 'تعديل الملف الشخصي' },
  notifications:  { en: 'Notifications', ar: 'الإشعارات' },
  resetLocation:  { en: 'Reset Location Permission', ar: 'إعادة إذن الموقع' },
  appVersion:     { en: 'App Version',   ar: 'إصدار التطبيق' },
  builtFor:       { en: 'Built for',     ar: 'مُصمم لـ' },
  editEmail:      { en: 'Edit Email',    ar: 'تعديل البريد الإلكتروني' },
  email:          { en: 'Email',         ar: 'البريد الإلكتروني' },
  enterEmail:     { en: 'Enter your email', ar: 'أدخل بريدك الإلكتروني' },
  updateEmail:    { en: 'Update Email',  ar: 'تحديث البريد' },
  updating:       { en: 'Updating...',   ar: 'جارٍ التحديث...' },
  emailUpdated:   { en: 'Email updated', ar: 'تم تحديث البريد' },
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
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
