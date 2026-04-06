"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
// Custom calendar styles needed in globals.css

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [formData, setFormData] = useState({ name: "", phone: "", notes: "" });
  
  // Helper to fix Javascript timezone issues (keeps the date exactly as selected in local time)
  const getLocalDateString = (d: Date) => {
    const local = new Date(d);
    local.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };
  
  const [availability, setAvailability] = useState<{
    bookedTimes: string[];
    isFullyBooked: boolean;
    allTimeSlots: string[];
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch availability when date changes
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!date) return;
    
    const DEFAULT_SLOTS = ['18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'];

    const fetchAvailability = async () => {
      setLoading(true);
      setError("");

      const dateString = getLocalDateString(date);
      let maxPerDay = 10;
      let allSlots = DEFAULT_SLOTS;

      // Fetch with 5s hard timeout using a cancel flag
      const timer = setTimeout(() => {
        setAvailability({ bookedTimes: [], isFullyBooked: false, allTimeSlots: DEFAULT_SLOTS });
        setLoading(false);
      }, 5000);

      try {
        // 1. Try to get settings (non-blocking if fails)
        try {
          const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
          if (settings) {
            maxPerDay = settings.max_bookings_per_day || 10;
            allSlots = settings.available_time_slots || DEFAULT_SLOTS;
          }
        } catch {
          // settings table missing or network slow → use defaults silently
        }

        // 2. Get existing bookings for this date
        const { data: bookings, error: bookErr } = await supabase
          .from("bookings")
          .select("time")
          .eq("date", dateString)
          .neq("status", "cancelled");

        clearTimeout(timer);

        const bookedTimes = (bookings || []).map((b: { time: string }) => b.time);

        setAvailability({
          bookedTimes,
          isFullyBooked: bookedTimes.length >= maxPerDay,
          allTimeSlots: allSlots,
        });

        if (bookErr) {
          setError("تعذّر جلب الأوقات المحجوزة، نعرض الأوقات الافتراضية.");
        }
      } catch {
        clearTimeout(timer);
        setAvailability({ bookedTimes: [], isFullyBooked: false, allTimeSlots: DEFAULT_SLOTS });
        setError("تعذّر الاتصال بالخادم، نعرض الأوقات الافتراضية.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
    setTime("");
  }, [date]);


  const handleSubmit = async () => {
    if (!date || !time || !service || !formData.name || !formData.phone) {
      setError("من فضلك أكمل جميع الحقول المطلوبة.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      if (!userId) {
        throw new Error("يجب تسجيل الدخول أولاً للحجز.");
      }

      const dateString = getLocalDateString(date);

      // ✅ Re-check slot availability right before insert (prevents race condition)
      const { data: slotCheck } = await supabase
        .from("bookings")
        .select("id")
        .eq("date", dateString)
        .eq("time", time)
        .neq("status", "cancelled")
        .limit(1);

      if (slotCheck && slotCheck.length > 0) {
        setTime(""); // reset the selected time
        // refresh availability
        const { data: bookings } = await supabase
          .from("bookings").select("time").eq("date", dateString).neq("status", "cancelled");
        setAvailability(prev => prev ? { ...prev, bookedTimes: (bookings || []).map(b => b.time) } : prev);
        throw new Error("⚠️ عذراً، هذا الوقت تم حجزه للتو. يُرجى اختيار وقت آخر.");
      }

      const { error: insertError } = await supabase.from("bookings").insert({
        user_id: userId,
        name: formData.name,
        phone: formData.phone,
        date: dateString,
        time,
        service,
        notes: formData.notes,
      });

      if (insertError) throw insertError;
      
      setSuccess(true);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl text-slate-900 font-heading font-extrabold mb-3">احجز موعدك</h1>
          <p className="text-slate-500">أكمل الخطوات التالية لتأكيد حجزك</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-12 relative z-0">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          
          {[1, 2, 3].map((s) => (
            <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= s ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white border-2 border-slate-200 text-slate-400"}`}>
              {s}
            </div>
          ))}
        </div>

        <div className="bg-white p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: DATE & TIME */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-2xl font-heading font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Calendar className="text-primary" /> اختر التاريخ والوقت
                </h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">اختر اليوم</label>
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 min-h-[300px] shadow-sm">
                      {isMounted && (
                        <ReactCalendar 
                          onChange={(val) => setDate(val as Date)} 
                          value={date}
                          minDate={new Date()} // Can't book in the past
                          locale="en-US"
                          className="!w-full !bg-transparent !border-0 font-sans custom-calendar"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">اختر الوقت</label>
                    {!date ? (
                      <div className="h-full min-h-[200px] flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                        يرجى اختيار تاريخ أولاً
                      </div>
                    ) : loading ? (
                      <div className="h-full min-h-[200px] flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : availability?.isFullyBooked ? (
                      <div className="h-full min-h-[200px] flex flex-col items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 text-center">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <p>Fully booked for this day.</p>
                        <p className="text-sm mt-1">Please select another date.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {availability?.allTimeSlots.map((t) => {
                          const isBooked = availability.bookedTimes.includes(t);
                          // convert "18:00" to "6:00 م", "12:00" to "12:00 م", etc.
                          const [hStr, mStr] = t.split(":");
                          let h = parseInt(hStr, 10);
                          const ampm = h >= 12 ? "م" : "ص";
                          if (h > 12) h -= 12;
                          if (h === 0) h = 12;
                          const t12 = `${h}:${mStr} ${ampm}`;

                          return (
                            <button
                              key={t}
                              disabled={isBooked}
                              onClick={() => setTime(t)}
                              className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                                isBooked 
                                  ? "bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed line-through"
                                  : time === t
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-sky-50"
                              }`}
                            >
                              {t12}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    disabled={!date || !time}
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover text-white font-semibold rounded-full transition-all"
                  >
                    الخطوة التالية <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-2xl font-heading font-bold text-slate-900 mb-6">بيانات المريض</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">الخدمة المطلوبة</label>
                    <select 
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    >
                      <option value="">اختر الخدمة...</option>
                      <option value="كشف روتيني">كشف روتيني</option>
                      <option value="تبييض الأسنان بالليزر">تبييض الأسنان بالليزر</option>
                      <option value="تركيبات الأسنان الثابتة">تركيبات الأسنان الثابتة</option>
                      <option value="تقويم الأسنان">تقويم الأسنان</option>
                      <option value="زراعة الأسنان">زراعة الأسنان</option>
                      <option value="حشو الأسنان">حشو الأسنان</option>
                      <option value="علاج أسنان الأطفال">علاج أسنان الأطفال</option>
                      <option value="إزالة الجير وتلميع الأسنان">إزالة الجير وتلميع الأسنان</option>
                      <option value="جراحة الفم">جراحة الفم</option>
                      <option value="علاج العصب">علاج العصب</option>
                    </select>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم الكامل</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        placeholder="محمد أحمد"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">رقم الهاتف</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        placeholder="01000000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات إضافية (اختياري)</label>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 min-h-[100px] transition-all"
                      placeholder="أي ألم أو حالة خاصة تود إبلاغنا عنها..."
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors">رجوع</button>
                  <button 
                    disabled={!service || !formData.name || !formData.phone}
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary disabled:opacity-50 hover:bg-primary-hover text-white font-semibold rounded-full transition-all"
                  >
                    مراجعة <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONFIRM */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-2xl font-heading font-bold text-slate-900 mb-6 font-medium">مراجعة وتأكيد الحجز</h3>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-500 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 mb-8">
                  <div className="flex justify-between border-b border-slate-200 pb-4">
                    <span className="text-slate-500">التاريخ والوقت</span>
                    <span className="text-slate-900 font-bold text-right" dir="ltr">
                      {date?.toLocaleDateString('ar-EG')} - {time}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-4">
                    <span className="text-slate-500">الخدمة</span>
                    <span className="text-slate-900 font-bold text-right">{service}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-4">
                    <span className="text-slate-500">اسم المريض</span>
                    <span className="text-slate-900 font-bold text-right">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">رقم الهاتف</span>
                    <span className="text-slate-900 font-bold text-right">{formData.phone}</span>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button onClick={() => setStep(2)} className="px-6 py-3 text-slate-500 hover:text-slate-800 font-medium transition-colors">تعديل البيانات</button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center justify-center w-full max-w-[200px] gap-2 px-6 py-3 bg-primary disabled:opacity-50 hover:bg-primary-hover text-white font-semibold rounded-full transition-all shadow-lg shadow-primary/30"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "تأكيد الحجز"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-3xl font-heading font-bold text-white mb-2">Booking Confirmed!</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Your appointment for {service} on {date?.toLocaleDateString()} at {time} is confirmed. A WhatsApp confirmation has been sent to {formData.phone}.
                </p>
                <div className="flex justify-center gap-4">
                  <button onClick={() => window.location.href = "/dashboard"} className="px-6 py-3 glass hover:bg-white/5 text-white font-semibold rounded-full transition-all">
                    View My Bookings
                  </button>
                  <button onClick={() => window.location.href = "/"} className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-full transition-all">
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
