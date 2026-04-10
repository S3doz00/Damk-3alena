import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Lang = 'en' | 'ar'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const translations: Record<string, Record<Lang, string>> = {
  // Login page
  hospitalDashboard:  { en: 'Hospital Dashboard',   ar: 'لوحة التحكم — المستشفى' },
  loginSubtitle:      { en: 'Log in to manage blood requests and view AI insights.', ar: 'سجّل دخولك لإدارة طلبات الدم وعرض تحليلات الذكاء الاصطناعي.' },
  workEmail:          { en: 'Work Email',            ar: 'البريد الإلكتروني للعمل' },
  password:           { en: 'Password',              ar: 'كلمة المرور' },
  signingIn:          { en: 'Signing in...',         ar: 'جارٍ تسجيل الدخول...' },
  logIn:              { en: 'Log In',                ar: 'تسجيل الدخول' },
  secureNetwork:      { en: 'Secure Healthcare Network - Damk 3alena', ar: 'شبكة الرعاية الصحية الآمنة - دمك علينا' },

  // Navigation
  dashboard:        { en: 'Dashboard',       ar: 'لوحة التحكم' },
  createRequest:    { en: 'Create Request',  ar: 'طلب دم' },
  appointments:     { en: 'Appointments',    ar: 'المواعيد' },
  requests:         { en: 'Requests',        ar: 'الطلبات' },
  aiInsights:       { en: 'AI Insights',     ar: 'تحليل الذكاء الاصطناعي' },
  userManagement:   { en: 'User Management', ar: 'إدارة المستخدمين' },
  systemSettings:   { en: 'System Settings', ar: 'إعدادات النظام' },
  appearance:       { en: 'Appearance',      ar: 'المظهر' },
  signOut:          { en: 'Sign Out',        ar: 'تسجيل الخروج' },
  language:         { en: 'Language',        ar: 'اللغة' },

  // Theme labels
  themeLight:       { en: 'Light',   ar: 'فاتح' },
  themeDark:        { en: 'Dark',    ar: 'داكن' },
  themeSystem:      { en: 'System',  ar: 'تلقائي' },

  // About/Landing page
  heroBadge:        { en: 'AI-Powered Blood Donation Platform', ar: 'منصة تبرع بالدم مدعومة بالذكاء الاصطناعي' },
  heroTitle1:       { en: 'Every Drop',      ar: 'كل قطرة' },
  heroTitle2:       { en: 'Saves a Life',    ar: 'تنقذ حياة' },
  heroDesc:         { en: "Jordan's first AI-driven blood donation platform. Predicting shortages, matching donors, and connecting hospitals — in real time.", ar: 'أول منصة ذكاء اصطناعي للتبرع بالدم في الأردن. تتنبأ بالنقص، وتطابق المتبرعين، وتربط المستشفيات — في الوقت الفعلي.' },
  openDashboard:    { en: 'Open Dashboard',  ar: 'فتح لوحة التحكم' },
  exploreFeatures:  { en: 'Explore Features', ar: 'استكشف المميزات' },
  dashboardLogin:   { en: 'Dashboard Login', ar: 'دخول لوحة التحكم' },
  builtForImpact:   { en: 'Built for', ar: 'مبني من أجل' },
  builtForImpact2:  { en: 'Impact',   ar: 'التأثير' },
  builtForDesc:     { en: 'Combining artificial intelligence with healthcare to build a smarter blood supply chain.', ar: 'دمج الذكاء الاصطناعي مع الرعاية الصحية لبناء سلسلة تبرع بالدم أذكى.' },
  poweredBy:        { en: 'Powered', ar: 'مدعوم' },
  poweredBy2:       { en: 'By',      ar: 'من' },
  readyTitle:       { en: 'Ready to Save Lives?', ar: 'مستعد لإنقاذ الأرواح؟' },
  readyDesc:        { en: 'Access the dashboard to manage blood requests, view AI insights, and coordinate with donors.', ar: 'ادخل لوحة التحكم لإدارة طلبات الدم، وعرض تحليلات الذكاء الاصطناعي، والتنسيق مع المتبرعين.' },
  goToDashboard:    { en: 'Go to Dashboard', ar: 'الذهاب للوحة التحكم' },
  footerText:       { en: 'Damk 3alena — Built in Jordan with AI', ar: 'دمك علينا — مبني في الأردن بالذكاء الاصطناعي' },
  adminLabel:       { en: 'Admin', ar: 'الإدارة' },

  // Stat labels (about page)
  statBloodTypes:   { en: 'Blood Types Tracked',  ar: 'فصائل الدم المتتبعة' },
  statWeeks:        { en: 'Weeks Forecast Ahead',  ar: 'أسابيع توقع مسبق' },
  statRealtime:     { en: 'Realtime Monitoring',   ar: 'مراقبة فورية' },
  statAI:           { en: 'Powered Matching',      ar: 'توفيق بالذكاء الاصطناعي' },

  // Feature cards (about page)
  feat1Title: { en: 'AI-Powered Forecasting',  ar: 'توقع مدعوم بالذكاء الاصطناعي' },
  feat1Desc:  { en: 'Machine learning predicts blood demand weeks ahead, preventing critical shortages before they happen.', ar: 'يتنبأ تعلم الآلة بالطلب على الدم قبل أسابيع، مما يمنع النقص الحرج قبل حدوثه.' },
  feat2Title: { en: 'Smart Donor Matching',    ar: 'مطابقة المتبرعين الذكية' },
  feat2Desc:  { en: 'Location-aware algorithms find the best donors by blood type compatibility, distance, and eligibility.', ar: 'تجد الخوارزميات الواعية بالموقع أفضل المتبرعين حسب توافق فصيلة الدم والمسافة والأهلية.' },
  feat3Title: { en: 'Hospital Dashboard',      ar: 'لوحة تحكم المستشفى' },
  feat3Desc:  { en: 'Real-time inventory tracking, appointment management, and shortage alerts for healthcare staff.', ar: 'تتبع المخزون في الوقت الفعلي وإدارة المواعيد وتنبيهات النقص للطاقم الصحي.' },
  feat4Title: { en: 'Mobile Donor App',        ar: 'تطبيق المتبرع المحمول' },
  feat4Desc:  { en: 'Donors book appointments, track donation history, and receive urgent notifications — all from their phone.', ar: 'يحجز المتبرعون المواعيد ويتتبعون سجل التبرع ويتلقون إشعارات عاجلة — كل ذلك من هواتفهم.' },
  feat5Title: { en: 'Shortage Detection',      ar: 'اكتشاف النقص' },
  feat5Desc:  { en: 'Automated alerts when blood inventory drops below critical thresholds, triggering targeted donor outreach.', ar: 'تنبيهات تلقائية عند انخفاض مخزون الدم تحت الحدود الحرجة، مما يفعّل التواصل المستهدف مع المتبرعين.' },
  feat6Title: { en: 'Live Analytics',          ar: 'تحليلات مباشرة' },
  feat6Desc:  { en: 'Real-time dashboards showing donation trends, facility performance, and blood type distribution.', ar: 'لوحات بيانات فورية تعرض اتجاهات التبرع وأداء المنشآت وتوزيع فصائل الدم.' },

  // AI Insights - now/predicted
  now:              { en: 'now',       ar: 'الآن' },
  predicted:        { en: 'predicted', ar: 'المتوقع' },
  bloodDemandDesc:  { en: 'Predicted units per blood type per week based on AI model. Lines represent demand trend — higher means more expected donations needed.', ar: 'الوحدات المتوقعة لكل فصيلة دم أسبوعيًا بناءً على نموذج الذكاء الاصطناعي. الخطوط تمثل اتجاه الطلب — كلما ارتفعت كلما زادت الحاجة للتبرع.' },

  // Dashboard stat cards
  openRequests:     { en: 'Open Requests',              ar: 'الطلبات المفتوحة' },
  totalRequests:    { en: 'Total Requests',             ar: 'إجمالي الطلبات' },
  todayAppts:       { en: "Today's Appts",              ar: 'مواعيد اليوم' },
  activeDonors:     { en: 'Active Donors',              ar: 'المتبرعون النشطون' },
  bloodTypeInventory: { en: 'Blood Type Inventory',     ar: 'مخزون فصائل الدم' },
  weeklyBookings:   { en: 'Weekly Donor Bookings',      ar: 'حجوزات المتبرعين الأسبوعية' },
  live:             { en: 'Live',                       ar: 'مباشر' },
  unitsAvailable:   { en: 'units available',            ar: 'وحدة متاحة' },
  low:              { en: 'Low',                        ar: 'منخفض' },
  activityTrend:    { en: 'Activity Trend',             ar: 'الاتجاه الأسبوعي' },
  activityTrendDesc:{ en: 'Donations · Requests · Fulfilled — last 4 weeks', ar: 'التبرعات · الطلبات · المنجزة — آخر 4 أسابيع' },
  donations:        { en: 'Donations',                  ar: 'التبرعات' },
  fulfilled:        { en: 'Fulfilled',                  ar: 'المنجزة' },
  bloodTypeDistribution: { en: 'Blood Type Distribution', ar: 'توزيع فصائل الدم' },

  // Appointments page
  donorAppointments:  { en: 'Donor Appointments', ar: 'مواعيد المتبرعين' },
  donorAppointmentsDesc: { en: 'View donors who have booked appointments at your facility.', ar: 'عرض المتبرعين الذين حجزوا مواعيد في منشأتك.' },
  mostRecent:       { en: 'Most Recent',   ar: 'الأحدث أولاً' },
  oldestFirst:      { en: 'Oldest First',  ar: 'الأقدم أولاً' },
  byStatus:         { en: 'By Status',     ar: 'حسب الحالة' },
  clearCancelledBtn:{ en: 'Clear Cancelled', ar: 'حذف الملغيات' },
  clearing:         { en: 'Clearing…',     ar: 'جارٍ الحذف…' },
  noAppointmentsYet:{ en: 'No appointments yet', ar: 'لا توجد مواعيد بعد' },
  noAppointmentsDesc: { en: 'Appointments will appear here when donors book them.', ar: 'ستظهر المواعيد هنا عندما يحجزها المتبرعون.' },
  walkIn:           { en: 'Walk-in',       ar: 'بدون حجز' },
  status_booked:    { en: 'booked',        ar: 'محجوز' },
  status_completed: { en: 'completed',     ar: 'مكتمل' },
  status_cancelled: { en: 'cancelled',     ar: 'ملغي' },
  status_no_show:   { en: 'no show',       ar: 'لم يحضر' },

  // Create Request page
  createRequestTitle: { en: 'Create Blood Request', ar: 'طلب دم جديد' },
  createRequestDesc:  { en: 'Submit an urgent blood request to notify eligible donors.', ar: 'أرسل طلب دم عاجل لإشعار المتبرعين المؤهلين.' },
  bloodTypeRequired:  { en: 'Blood Type Required *', ar: 'فصيلة الدم المطلوبة *' },
  unitsNeeded:        { en: 'Units Needed',     ar: 'الوحدات المطلوبة' },
  urgencyLevel:       { en: 'Urgency Level',    ar: 'مستوى الأولوية' },
  patientName:        { en: 'Patient Name',     ar: 'اسم المريض' },
  fileNumber:         { en: 'File Number',      ar: 'رقم الملف' },
  additionalNotes:    { en: 'Additional Notes', ar: 'ملاحظات إضافية' },
  enterPatientName:   { en: 'Enter patient name', ar: 'أدخل اسم المريض' },
  patientFileNoPlaceholder: { en: 'Patient file #', ar: 'رقم ملف المريض' },
  additionalInfo:     { en: 'Any additional information...', ar: 'أي معلومات إضافية...' },
  requestCreated:     { en: 'Blood request created successfully! Redirecting...', ar: 'تم إنشاء طلب الدم بنجاح! جارٍ التحويل...' },
  submitting:         { en: 'Submitting...',    ar: 'جارٍ الإرسال...' },
  submitRequest:      { en: 'Submit Blood Request', ar: 'إرسال طلب الدم' },

  // Requests page
  submittedRequests:  { en: 'Submitted Requests', ar: 'الطلبات المقدمة' },
  submittedRequestsDesc: { en: 'Manage the status of your blood requests.', ar: 'إدارة حالة طلبات الدم الخاصة بك.' },
  clearClosedBtn:     { en: 'Clear Closed',       ar: 'حذف المغلقة' },
  loading:            { en: 'Loading...',        ar: 'جارٍ التحميل...' },
  noRequestsYet:      { en: 'No requests yet',   ar: 'لا توجد طلبات بعد' },
  unitNeeded:         { en: 'unit needed',        ar: 'وحدة مطلوبة' },
  unitsNeededPlural:  { en: 'units needed',       ar: 'وحدة مطلوبة' },
  updateStatus:       { en: 'Update status:',     ar: 'تحديث الحالة:' },
  patient:            { en: 'Patient:',           ar: 'المريض:' },
  created:            { en: 'Created',            ar: 'تاريخ الإنشاء' },
  urgency_normal:     { en: 'normal',             ar: 'عادي' },
  urgency_urgent:     { en: 'urgent',             ar: 'عاجل' },
  urgency_critical:   { en: 'critical',           ar: 'حرج' },
  reqStatus_open:     { en: 'open',               ar: 'مفتوح' },
  reqStatus_in_progress: { en: 'in progress',     ar: 'قيد التنفيذ' },
  reqStatus_fulfilled:{ en: 'fulfilled',          ar: 'منجز' },
  reqStatus_closed:   { en: 'closed',             ar: 'مغلق' },

  // AI Insights page
  aiInsightsDesc:       { en: 'Demand forecasts, shortage alerts, and donor recommendations.', ar: 'توقعات الطلب، تنبيهات النقص، وتوصيات المتبرعين.' },
  criticalShortageDetected: { en: 'Critical Shortage Detected', ar: 'نقص حرج تم اكتشافه' },
  unitsLeft:            { en: 'units left',        ar: 'وحدة متبقية' },
  supplyWarnings:       { en: 'Supply Warnings',   ar: 'تحذيرات المخزون' },
  nowPredicted:         { en: 'now → predicted',   ar: 'الآن ← المتوقع' },
  bloodDemandForecast:  { en: 'Blood Demand Forecast', ar: 'توقعات الطلب على الدم' },
  oneWeekData:          { en: 'Only 1 week of data — run forecast again next week for trend lines', ar: 'أسبوع واحد فقط من البيانات — شغّل التوقع مجددًا الأسبوع القادم' },
  noForecastData:       { en: 'No forecast data yet', ar: 'لا توجد بيانات توقع بعد' },
  runAIForecastHint:    { en: 'Run the AI forecast from System Settings to generate predictions.', ar: 'شغّل توقع الذكاء الاصطناعي من إعدادات النظام لتوليد التوقعات.' },
  recommendedDonors:    { en: 'Recommended Donors', ar: 'المتبرعون الموصى بهم' },
  noRecommendations:    { en: 'No recommendations yet', ar: 'لا توجد توصيات بعد' },
  noRecommendationsDesc:{ en: 'Create a blood request then run the AI recommendation engine from System Settings.', ar: 'أنشئ طلب دم ثم شغّل محرك توصيات الذكاء الاصطناعي من إعدادات النظام.' },

  // User Management page
  userManagementDesc: { en: 'Manage user roles and approve staff accounts.', ar: 'إدارة أدوار المستخدمين والموافقة على حسابات الموظفين.' },
  joined:             { en: 'Joined',  ar: 'انضم في' },
  role_donor:         { en: 'donor',    ar: 'متبرع' },
  role_staff:         { en: 'staff',    ar: 'موظف' },
  role_admin:         { en: 'admin',    ar: 'مسؤول' },

  // System Settings page
  systemSettingsDesc: { en: 'Configure thresholds and notification rules for the system.', ar: 'ضبط الحدود وقواعد الإشعارات للنظام.' },
  aiPipeline:         { en: 'AI Pipeline', ar: 'خط أنابيب الذكاء الاصطناعي' },
  aiPipelineDesc:     { en: 'Manually trigger AI forecasts and recommendations', ar: 'تشغيل توقعات الذكاء الاصطناعي والتوصيات يدويًا' },
  runningForecast:    { en: 'Running Forecast...', ar: 'جارٍ تشغيل التوقع...' },
  runAIForecastBtn:   { en: 'Run AI Forecast', ar: 'تشغيل توقع الذكاء الاصطناعي' },
  save:               { en: 'Save',       ar: 'حفظ' },
  saving:             { en: 'Saving...', ar: 'جارٍ الحفظ...' },
  serviceOnline:      { en: 'Service online',  ar: 'الخدمة متاحة' },
  serviceOffline:     { en: 'Service offline', ar: 'الخدمة غير متاحة' },
  serviceChecking:    { en: 'Checking…',       ar: 'جارٍ التحقق…' },

  // Threshold & Parameters (System Settings) — all known keys
  shortage_threshold_critical:  { en: 'Critical Shortage Threshold (Units)', ar: 'حد النقص الحرج (الوحدات)' },
  shortage_threshold_warning:   { en: 'Warning Shortage Threshold (Units)', ar: 'حد تحذير النقص (الوحدات)' },
  shortage_threshold_units:     { en: 'Shortage Threshold Units', ar: 'وحدات حد النقص' },
  eligibility_days:             { en: 'Donor Eligibility Gap (Days)', ar: 'فترة تأهيل المتبرع (الأيام)' },
  eligibility_gap_days:         { en: 'Donor Eligibility Gap (Days)', ar: 'فترة تأهيل المتبرع (الأيام)' },
  donation_interval_days:       { en: 'Minimum Donation Interval (Days)', ar: 'الحد الأدنى لفترة التبرع (الأيام)' },
  notification_radius_km:       { en: 'Donor Notification Radius (km)', ar: 'نطاق إشعار المتبرع (كم)' },
  forecast_horizon_weeks:       { en: 'Forecast Horizon (Weeks)', ar: 'أفق التوقع (الأسابيع)' },
  max_appointments_per_day:     { en: 'Max Appointments Per Day', ar: 'الحد الأقصى للمواعيد يوميًا' },
  appointment_slot_minutes:     { en: 'Appointment Slot Duration (Minutes)', ar: 'مدة فتحة الموعد (الدقائق)' },
  min_inventory_units:          { en: 'Minimum Inventory Buffer (Units)', ar: 'الحد الأدنى للمخزن الاحتياطي (الوحدات)' },
  recommendation_top_n:         { en: 'Max Donor Recommendations', ar: 'الحد الأقصى لتوصيات المتبرعين' },
  ai_confidence_threshold:      { en: 'AI Confidence Threshold (%)', ar: 'حد ثقة الذكاء الاصطناعي (%)' },
  max_age_years:                { en: 'Maximum Donor Age (Years)', ar: 'الحد الأقصى لعمر المتبرع (سنة)' },
  min_age_years:                { en: 'Minimum Donor Age (Years)', ar: 'الحد الأدنى لعمر المتبرع (سنة)' },
  min_weight_kg:                { en: 'Minimum Donor Weight (kg)', ar: 'الحد الأدنى لوزن المتبرع (كغ)' },
  max_weight_kg:                { en: 'Maximum Donor Weight (kg)', ar: 'الحد الأقصى لوزن المتبرع (كغ)' },
  hemoglobin_threshold:         { en: 'Hemoglobin Threshold (g/dL)', ar: 'حد الهيموغلوبين (غ/ديسيلتر)' },
  blood_pressure_max:           { en: 'Max Blood Pressure (mmHg)', ar: 'الضغط الأقصى (مم زئبقي)' },
  donation_gap_days:            { en: 'Donation Gap (Days)', ar: 'فترة التباعد بين التبرعات (أيام)' },

  // Shortage Alert Severity (AIOutputs page)
  severity:           { en: 'Severity',   ar: 'درجة الحدة' },
  critical:           { en: 'Critical',   ar: 'حرج' },
  warning:            { en: 'Warning',    ar: 'تحذير' },
  requStatus_closed:  { en: 'closed',     ar: 'مغلق' },

  // AI Insights units
  pts:                { en: 'pts',       ar: 'نقطة' },
  km:                 { en: 'km',        ar: 'كم' },

  // Login
  backToHome:         { en: 'Back',      ar: 'رجوع' },

  // Sidebar
  collapseSidebar:    { en: 'Collapse sidebar', ar: 'طي الشريط الجانبي' },
  expandSidebar:      { en: 'Expand sidebar',   ar: 'توسيع الشريط الجانبي' },

  // Dashboard filtering
  filteredBy:         { en: 'Filtered by',    ar: 'تصفية حسب' },
  refresh:            { en: 'Refresh',        ar: 'تحديث' },
  clearFilter:        { en: 'Clear filter',   ar: 'مسح التصفية' },
  allBloodTypes:      { en: 'All blood types', ar: 'جميع فصائل الدم' },
  bookings:           { en: 'bookings',       ar: 'حجز' },
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'en'
  })

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

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
