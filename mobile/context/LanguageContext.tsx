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
  manageProfile:    { en: 'Manage your profile & appearance', ar: 'إدارة ملفك الشخصي والمظهر' },
  sectionLanguage:  { en: 'LANGUAGE',        ar: 'اللغة' },
  english:          { en: 'English',         ar: 'English' },
  arabic:           { en: 'العربية',         ar: 'العربية' },
  englishDesc:      { en: 'Use the app in English',          ar: 'استخدم التطبيق بالإنجليزية' },
  arabicDesc:       { en: 'استخدم التطبيق بالعربية',         ar: 'استخدم التطبيق بالعربية' },
  sectionAppearance:{ en: 'APPEARANCE',      ar: 'المظهر' },
  sectionAccount:   { en: 'ACCOUNT',         ar: 'الحساب' },
  sectionAbout:     { en: 'ABOUT',           ar: 'حول التطبيق' },
  deviceDefault:    { en: 'System',          ar: 'افتراضي النظام' },
  followSystem:     { en: 'Follows device setting', ar: 'اتبع إعداد الجهاز' },
  lightMode:        { en: 'Light',           ar: 'فاتح' },
  alwaysLight:      { en: 'Always light appearance',  ar: 'استخدام المظهر الفاتح دائمًا' },
  darkMode:         { en: 'Dark',            ar: 'داكن' },
  alwaysDark:       { en: 'Always dark appearance',   ar: 'استخدام المظهر الداكن دائمًا' },
  personalInfo:     { en: 'PERSONAL INFORMATION', ar: 'المعلومات الشخصية' },
  firstName:        { en: 'First Name',      ar: 'الاسم الأول' },
  lastName:         { en: 'Last Name',       ar: 'اسم العائلة' },
  phoneNumber:      { en: 'Phone Number',    ar: 'رقم الهاتف' },
  nationalId:       { en: 'National ID',     ar: 'الرقم الوطني' },
  nationalIdLocked: { en: 'National ID cannot be changed after registration', ar: 'لا يمكن تغيير الرقم الوطني بعد التسجيل' },
  dateOfBirth:      { en: 'Date of Birth',   ar: 'تاريخ الميلاد' },
  weightOptional:   { en: 'Weight (kg) — Optional', ar: 'الوزن (كغ) — اختياري' },
  bloodHealth:      { en: 'BLOOD & HEALTH',  ar: 'الدم والصحة' },
  bloodType:        { en: 'Blood Type',      ar: 'فصيلة الدم' },
  gender:           { en: 'Gender',          ar: 'الجنس' },
  male:             { en: 'Male',            ar: 'ذكر' },
  female:           { en: 'Female',          ar: 'أنثى' },
  locationSection:  { en: 'LOCATION',        ar: 'الموقع' },
  city:             { en: 'City',            ar: 'المدينة' },
  saveChanges:      { en: 'Save Changes',    ar: 'حفظ التغييرات' },
  saving:           { en: 'Saving...',       ar: 'جارٍ الحفظ...' },
  profileUpdated:   { en: 'Profile updated successfully!', ar: 'تم تحديث الملف الشخصي بنجاح!' },
  missingInfo:      { en: 'Missing Info',    ar: 'معلومات ناقصة' },
  enterFullName:    { en: 'Please enter your full name.', ar: 'يرجى إدخال اسمك الكامل.' },
  cancel:           { en: 'Cancel',          ar: 'إلغاء' },
  confirm:          { en: 'Confirm',         ar: 'تأكيد' },
  day:              { en: 'DAY',             ar: 'اليوم' },
  month:            { en: 'MONTH',           ar: 'الشهر' },
  year:             { en: 'YEAR',            ar: 'السنة' },

  // Home screen
  greeting:         { en: 'Ahlan',           ar: 'أهلًا' },
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
  notifications:    { en: 'Notifications',   ar: 'الإشعارات' },
  signOut:          { en: 'Sign Out',        ar: 'تسجيل الخروج' },
  signOutConfirm:   { en: 'Are you sure you want to sign out?', ar: 'هل أنت متأكد من تسجيل الخروج؟' },

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
  onboardBloodTypeNote:{ en: 'You can update this anytime in your profile settings', ar: 'يمكنك تحديث هذا في أي وقت من إعدادات ملفك الشخصي' },
  onboardContinue:     { en: 'Continue',             ar: 'التالي' },
  onboardFinish:       { en: 'Start Saving Lives',   ar: 'ابدأ إنقاذ الأرواح' },

  // Urgent screen
  urgentTitle:          { en: 'Urgent Requests',     ar: 'الطلبات العاجلة' },
  activeCases:          { en: 'active cases',        ar: 'حالة نشطة' },
  currentLocation:      { en: 'Current Location',    ar: 'موقعك الحالي' },
  criticalNearYou:      { en: 'Critical Requests Near You', ar: 'طلبات حرجة قريبة منك' },
  livesAtStake:         { en: 'Lives are at stake. Your blood type may be urgently needed.', ar: 'الأرواح على المحك. قد تكون فصيلة دمك مطلوبة بإلحاح.' },
  filterAll:            { en: 'All',                 ar: 'الكل' },
  urgencyLabelCritical: { en: 'CRITICAL',            ar: 'حرج' },
  urgencyLabelUrgent:   { en: 'URGENT',              ar: 'عاجل' },
  urgencyLabelNormal:   { en: 'NORMAL',              ar: 'عادي' },
  urgencyLabelPending:  { en: 'PENDING',             ar: 'قيد الانتظار' },
  unitsNeeded:          { en: 'units needed',        ar: 'وحدات مطلوبة' },
  donateNow:            { en: 'Donate Now',          ar: 'تبرع الآن' },
  loadingRequests:      { en: 'Loading requests...', ar: 'جارٍ التحميل...' },
  noActiveRequests:     { en: 'No Active Requests',  ar: 'لا توجد طلبات نشطة' },
  noRequestsInCat:      { en: 'No urgent requests in this category.', ar: 'لا توجد طلبات عاجلة في هذه الفئة.' },

  // Maps screen
  bloodBanks:           { en: 'Blood Banks',         ar: 'بنوك الدم' },
  locationsInJordan:    { en: 'locations in Jordan', ar: 'موقع في الأردن' },
  searchHospitals:      { en: 'Search hospitals...', ar: 'ابحث عن مستشفيات...' },
  filterCriticalMap:    { en: 'Urgent',              ar: 'عاجل' },
  filterHospitals:      { en: 'Hospitals',           ar: 'مستشفيات' },
  filterBloodBanks:     { en: 'Blood Banks',         ar: 'بنوك الدم' },
  levelCritical:        { en: 'Critical',            ar: 'حرج' },
  levelLow:             { en: 'Low',                 ar: 'منخفض' },
  levelModerate:        { en: 'Moderate',            ar: 'متوسط' },
  levelAdequate:        { en: 'Adequate',            ar: 'كافٍ' },
  criticalNeedBadge:    { en: 'CRITICAL NEED',       ar: 'احتياج حرج' },
  directions:           { en: 'Directions',          ar: 'الاتجاهات' },
  donateHere:           { en: 'Donate Here',         ar: 'تبرع هنا' },
  noResults:            { en: 'No results',          ar: 'لا توجد نتائج' },
  adjustSearch:         { en: 'Try adjusting your search or filter', ar: 'جرّب تعديل البحث أو التصفية' },

  // Notifications
  notificationsTitle:   { en: 'Notifications',       ar: 'الإشعارات' },
  noNotifications:      { en: 'No notifications yet', ar: 'لا توجد إشعارات بعد' },
  noNotificationsDesc:  { en: "You'll be notified about urgent blood needs and campaigns", ar: 'ستتلقى إشعارات حول احتياجات الدم العاجلة والحملات' },
  markAllRead:          { en: 'Mark all read',       ar: 'تحديد الكل كمقروء' },

  // Auth - Login screen
  welcomeBack:              { en: 'Welcome back',          ar: 'مرحبًا بعودتك' },
  signInWith:               { en: 'Sign in with your email or phone number', ar: 'سجّل الدخول ببريدك الإلكتروني أو رقم هاتفك' },
  emailOrPhone:             { en: 'Email or Phone Number', ar: 'البريد الإلكتروني أو رقم الهاتف' },
  emailOrPhoneHint:         { en: 'Use your email address or phone number to sign in', ar: 'استخدم بريدك الإلكتروني أو رقم هاتفك لتسجيل الدخول' },
  forgotPassword:           { en: 'Forgot password?',      ar: 'نسيت كلمة المرور؟' },
  signIn:                   { en: 'Sign In',               ar: 'تسجيل الدخول' },
  newDonor:                 { en: 'New donor?',            ar: 'متبرع جديد؟' },
  joinThousands:            { en: 'Join thousands of donors helping save lives across Jordan', ar: 'انضم لآلاف المتبرعين الذين يساعدون في إنقاذ الأرواح في الأردن' },
  accountCreatedTitle:      { en: 'Account Created!',      ar: 'تم إنشاء الحساب!' },
  accountReady:             { en: 'Your account is ready. Sign in below to get started.', ar: 'حسابك جاهز. سجّل الدخول أدناه للبدء.' },
  pleaseEnterIdentifier:    { en: 'Please enter your email address or phone number.', ar: 'يرجى إدخال بريدك الإلكتروني أو رقم هاتفك.' },
  pleaseEnterPassword:      { en: 'Please enter your password.',  ar: 'يرجى إدخال كلمة المرور.' },
  loginFailed:              { en: 'Login failed.',         ar: 'فشل تسجيل الدخول.' },
  bloodDonationPlatformTagline: { en: 'Blood Donation Platform · Jordan', ar: 'منصة التبرع بالدم · الأردن' },
  createAccountLink:        { en: 'Create Account',        ar: 'إنشاء حساب' },

  // Auth - Sign up screen
  createAccountTitle:       { en: 'Create Account',        ar: 'إنشاء حساب' },
  step1SubTitle:            { en: 'Step 1: Personal Information', ar: 'الخطوة 1: المعلومات الشخصية' },
  step2SubTitle:            { en: 'Step 2: Blood Type',    ar: 'الخطوة 2: فصيلة الدم' },
  step3SubTitle:            { en: 'Step 3: Your City',     ar: 'الخطوة 3: مدينتك' },
  continueBtn:              { en: 'Continue',              ar: 'التالي' },
  emailAddressLabel:        { en: 'Email Address',         ar: 'البريد الإلكتروني' },
  nationalIdNumber:         { en: 'National ID Number',    ar: 'الرقم الوطني' },
  selectDateOfBirth:        { en: 'Select date of birth',  ar: 'اختر تاريخ الميلاد' },
  passwordLabel:            { en: 'Password',              ar: 'كلمة المرور' },
  minSixChars:              { en: 'Min. 6 characters',     ar: 'على الأقل 6 أحرف' },
  confirmPasswordLabel:     { en: 'Confirm Password',      ar: 'تأكيد كلمة المرور' },
  reEnterPassword:          { en: 'Re-enter password',     ar: 'أعد إدخال كلمة المرور' },
  passwordsNoMatch:         { en: 'Passwords do not match', ar: 'كلمتا المرور غير متطابقتين' },
  selectYourCity:           { en: 'Select Your City',      ar: 'اختر مدينتك' },
  alreadyHaveAccount:       { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟' },
  signUpFailed:             { en: 'Sign up failed.',       ar: 'فشل إنشاء الحساب.' },
  dateOfBirthPickerTitle:   { en: 'Date of Birth',         ar: 'تاريخ الميلاد' },

  // Appointment ticket screen
  appointmentTicket:        { en: 'Appointment Ticket',    ar: 'تذكرة الموعد' },
  appointmentConfirmedTitle:{ en: 'Appointment Confirmed!', ar: 'تم تأكيد الموعد!' },
  showTicketHint:           { en: 'Show this ticket at the hospital entrance', ar: 'أظهر هذه التذكرة عند مدخل المستشفى' },
  patientFileNumber:        { en: 'Patient File Number',   ar: 'رقم ملف المريض' },
  dateLabel:                { en: 'Date',                  ar: 'التاريخ' },
  timeLabel:                { en: 'Time',                  ar: 'الوقت' },
  locationLabel:            { en: 'Location',              ar: 'الموقع' },
  donorLabel:               { en: 'Donor',                 ar: 'المتبرع' },
  bloodTypeTicketLabel:     { en: 'Blood Type',            ar: 'فصيلة الدم' },
  scanAtEntrance:           { en: 'Scan at Entrance',      ar: 'امسح عند المدخل' },
  presentQR:                { en: 'Present this QR code at the hospital reception', ar: 'أظهر رمز QR هذا في استقبال المستشفى' },
  beforeYouArriveTitle:     { en: 'Before You Arrive',     ar: 'قبل وصولك' },
  arrivalInstructions:      { en: '• Arrive 15 minutes early with your national ID\n• Drink 2–3 glasses of water before donating\n• Have a light meal at least 2 hours before\n• Avoid alcohol and smoking for 24 hours', ar: '• احضر قبل 15 دقيقة مع هويتك الوطنية\n• اشرب 2-3 أكواب ماء قبل التبرع\n• تناول وجبة خفيفة قبل ساعتين على الأقل\n• تجنب الكحول والتدخين لمدة 24 ساعة' },
  cancelAppointmentBtn:     { en: 'Cancel Appointment',    ar: 'إلغاء الموعد' },
  cancellingLabel:          { en: 'Cancelling...',         ar: 'جارٍ الإلغاء...' },
  cancelApptTitle:          { en: 'Cancel Appointment',    ar: 'إلغاء الموعد' },
  cancelApptMsg:            { en: 'Are you sure you want to cancel this appointment?', ar: 'هل أنت متأكد من إلغاء هذا الموعد؟' },
  keepIt:                   { en: 'Keep it',               ar: 'احتفظ به' },
  bookAnother:              { en: 'Book Another Appointment', ar: 'احجز موعدًا آخر' },
  appointmentNotFound:      { en: 'Appointment not found', ar: 'الموعد غير موجود' },
  goHome:                   { en: 'Go Home',               ar: 'الصفحة الرئيسية' },

  // Edit email screen
  editEmailTitle:           { en: 'Edit Email',            ar: 'تغيير البريد الإلكتروني' },
  editEmailDesc:            { en: 'Update your account email address.',  ar: 'تحديث بريدك الإلكتروني.' },
  newEmailLabel:            { en: 'New Email Address',     ar: 'البريد الإلكتروني الجديد' },
  updateEmail:              { en: 'Update Email',          ar: 'تحديث البريد الإلكتروني' },
  updating:                 { en: 'Updating...',           ar: 'جارٍ التحديث...' },
  emailUpdated:             { en: 'Email updated! Check your inbox to confirm.', ar: 'تم تحديث البريد! تحقق من صندوق الوارد للتأكيد.' },
  emailAddressField:        { en: 'Email Address',         ar: 'البريد الإلكتروني' },
  editEmail:                { en: 'Edit',                  ar: 'تعديل' },

  // History
  historyTitle:         { en: 'Donation History',    ar: 'سجل التبرعات' },
  completedDonations:   { en: 'completed donations', ar: 'تبرع مكتمل' },
  statTotal:            { en: 'Total',               ar: 'الإجمالي' },
  statLivesHelped:      { en: 'Lives Helped',        ar: 'حياة ساعدتها' },
  statBloodGiven:       { en: 'Blood Given',         ar: 'دم قُدِّم' },
  noHistoryTitle:       { en: 'No donations yet',    ar: 'لا تبرعات بعد' },
  noHistoryDesc:        { en: 'Your history will appear here after your first donation', ar: 'سيظهر سجلك هنا بعد أول تبرع' },
  statusCompleted:      { en: 'completed',           ar: 'مكتمل' },
  statusScheduled:      { en: 'scheduled',           ar: 'مجدول' },
  statusCancelled:      { en: 'cancelled',           ar: 'ملغى' },
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
