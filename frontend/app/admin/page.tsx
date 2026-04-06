"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Settings, Users, LogOut, CheckCircle2,
  MessageCircle, Phone, Search, RefreshCw, Plus, X,
  Download, ChevronUp, ChevronDown, Filter, BarChart2,
  Clock, Star, TrendingUp, AlertCircle, ChevronRight
} from "lucide-react";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────
type Booking = {
  id: string; name: string; phone: string; date: string;
  time: string; service: string; status: string; notes?: string; user_id?: string;
};
type Client = {
  id: string; name?: string; phone?: string; email?: string;
  role?: string; created_at?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700 border border-emerald-300",
  completed:  "bg-sky-100 text-sky-700 border border-sky-300",
  cancelled:  "bg-red-100 text-red-700 border border-red-300",
  pending:    "bg-amber-100 text-amber-700 border border-amber-300",
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: "✅ مؤكد", completed: "🏁 مكتمل",
  cancelled: "❌ ملغي",  pending:   "⏳ انتظار",
};
const WA_TEMPLATES = (name: string, date: string, time: string) => [
  { label: "✅ تأكيد الموعد",  msg: `مرحباً ${name} 😊\nتم تأكيد موعدك في عيادة د. خالد شرف.\n📅 التاريخ: ${date}\n⏰ الوقت: ${time}\nفي انتظارك!` },
  { label: "⏰ تذكير بالموعد", msg: `مرحباً ${name} 😊\nنذكّرك بموعدك غداً في عيادة د. خالد شرف.\n📅 التاريخ: ${date}\n⏰ الوقت: ${time}\nلأي استفسار تواصل معنا.` },
  { label: "❌ اعتذار / إلغاء", msg: `مرحباً ${name}\nنعتذر عن موعدك المحدد بتاريخ ${date} الساعة ${time}.\nيُرجى التواصل معنا لإعادة الجدولة. 🙏` },
];

const getLocalDateString = (d: Date) => {
  const local = new Date(d);
  local.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return local.toISOString().split("T")[0];
};

const to12h = (t: string) => {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "م" : "ص";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** WhatsApp direct action buttons — each opens WA web with pre-filled message */
function WaButtons({ phone, name, date, time }: { phone: string; name: string; date: string; time: string }) {
  const open = (msg: string) => {
    const cleaned = phone.replace(/\D/g, "");
    const num = cleaned.startsWith("2") ? cleaned : `2${cleaned}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  const templates = WA_TEMPLATES(name, date, time);
  const colors = [
    "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
    "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200",
    "bg-red-50 text-red-600 hover:bg-red-100 border-red-200",
  ];
  const icons = ["✅", "⏰", "❌"];
  return (
    <div className="flex items-center gap-1">
      {templates.map((t, i) => (
        <button key={t.label} onClick={() => open(t.msg)} title={t.label}
          className={`px-2 py-1.5 rounded-lg border text-xs font-bold transition-all ${colors[i]}`}>
          {icons[i]}
        </button>
      ))}
    </div>
  );
}

/** Client detail modal */
function ClientModal({ client, bookings, onClose }: { client: Client; bookings: Booking[]; onClose: () => void }) {
  const clientBookings = bookings.filter(b => b.phone === client.phone || b.user_id === client.id);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-extrabold text-primary">
            {client.name?.charAt(0) || "؟"}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{client.name || "—"}</h3>
            <p className="text-slate-500 text-sm">{client.phone || "—"} · {client.email}</p>
          </div>
        </div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">سجل الحجوزات ({clientBookings.length})</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {clientBookings.length === 0 && <p className="text-slate-400 text-sm text-center py-4">لا توجد حجوزات</p>}
          {clientBookings.map(b => (
            <div key={b.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm">
              <div>
                <div className="font-semibold text-slate-900">{b.service}</div>
                <div className="text-slate-500 text-xs">{b.date} — {to12h(b.time)}</div>
                {b.notes && <div className="text-slate-400 text-xs mt-1 italic">"{b.notes}"</div>}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[b.status] || ""}`}>
                {STATUS_LABELS[b.status] || b.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Admin new booking modal */
function AdminBookingModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [availability, setAvailability] = useState<{ bookedTimes: string[]; allTimeSlots: string[]; isFullyBooked: boolean } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", service: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const getLocalDateString2 = (d: Date) => {
    const local = new Date(d);
    local.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return local.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setTime("");
    const fetchSlots = async () => {
      const dateStr = getLocalDateString2(date);
      const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
      const maxPerDay = settings?.max_bookings_per_day || 10;
      const allSlots: string[] = settings?.available_time_slots || ["18:00","18:30","19:00","19:30","20:00","20:30","21:00"];
      const { data: bks } = await supabase.from("bookings").select("time").eq("date", dateStr).neq("status", "cancelled");
      const bookedTimes = (bks || []).map((b: any) => b.time);
      setAvailability({ bookedTimes, allTimeSlots: allSlots, isFullyBooked: bookedTimes.length >= maxPerDay });
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [date]);

  const handleSave = async () => {
    if (!date || !time || !form.name || !form.phone || !form.service) {
      setError("يرجى تعبئة جميع الحقول المطلوبة."); return;
    }
    setSaving(true); setError("");
    const { error: err } = await supabase.from("bookings").insert({
      name: form.name, phone: form.phone, service: form.service,
      notes: form.notes, date: getLocalDateString2(date), time,
      status: "confirmed",
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl p-7 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">➕ حجز جديد</h2>
        <p className="text-slate-500 text-sm mb-6">حجز مباشر من الأدمن — يؤثر على الأماكن المتاحة في الموقع</p>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Col 1: Calendar */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">📅 اختر التاريخ</label>
            {isMounted && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <ReactCalendar
                  onChange={(val) => setDate(val as Date)}
                  value={date}
                  minDate={new Date()}
                  locale="en-US"
                  className="!w-full !border-0 !bg-white font-sans"
                />
              </div>
            )}
            {date && (
              <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-700 font-semibold text-center">
                📅 {date.toLocaleDateString("en-GB")}
              </div>
            )}
          </div>

          {/* Col 2: Time slots */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">⏰ اختر الوقت</label>
            {!date ? (
              <div className="h-full min-h-[200px] flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm text-center p-4">
                اختر التاريخ أولاً لعرض الأوقات المتاحة
              </div>
            ) : loadingSlots ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : availability?.isFullyBooked ? (
              <div className="min-h-[200px] flex items-center justify-center p-4 bg-red-50 border border-red-200 text-red-500 rounded-2xl text-sm text-center">
                هذا اليوم ممتلئ بالكامل
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availability?.allTimeSlots.map(t => {
                  const isBooked = availability.bookedTimes.includes(t);
                  return (
                    <button key={t} disabled={isBooked} onClick={() => setTime(t)}
                      className={`p-3 rounded-xl border text-sm font-bold transition-all ${isBooked
                        ? "bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed line-through"
                        : time === t
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                          : "bg-white border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-sky-50"
                      }`}>
                      {to12h(t)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Col 3: Patient info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">👤 اسم المريض <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="محمد أحمد" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">📞 رقم الهاتف <span className="text-red-500">*</span></label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="0100..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">🦷 الخدمة <span className="text-red-500">*</span></label>
              <select value={form.service} onChange={e => setForm({...form, service: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                <option value="">اختر الخدمة...</option>
                <option>كشف روتيني</option>
                <option>تبييض الأسنان بالليزر</option>
                <option>تركيبات الأسنان الثابتة</option>
                <option>تقويم الأسنان</option>
                <option>زراعة الأسنان</option>
                <option>حشو الأسنان</option>
                <option>علاج أسنان الأطفال</option>
                <option>إزالة الجير وتلميع الأسنان</option>
                <option>جراحة الفم</option>
                <option>علاج العصب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">📝 ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary min-h-[80px]"
                placeholder="أي ملاحظات..." />
            </div>

            {/* Summary */}
            {date && time && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-sm">
                <p className="font-bold text-primary mb-1">ملخص الحجز</p>
                <p className="text-slate-700">📅 {date.toLocaleDateString("en-GB")} — ⏰ {to12h(time)}</p>
                {form.service && <p className="text-slate-600">🦷 {form.service}</p>}
              </div>
            )}

            <button onClick={handleSave} disabled={saving || !date || !time || !form.name || !form.phone || !form.service}
              className="w-full py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
              {saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الحفظ...</> : <><Plus className="w-5 h-5" />تأكيد الحجز</>}
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}

/** Analytics tab */
function AnalyticsTab({ bookings }: { bookings: Booking[] }) {
  // Last 7 days chart
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString("ar-EG", { weekday: "short" }), date: d.toISOString().split("T")[0] };
  });
  const maxDayCount = Math.max(1, ...days.map(d => bookings.filter(b => b.date === d.date).length));

  // Top services
  const serviceCounts: Record<string, number> = {};
  bookings.forEach(b => { if (b.service) serviceCounts[b.service] = (serviceCounts[b.service] || 0) + 1; });
  const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const confirmed = bookings.filter(b => b.status === "confirmed" || b.status === "completed").length;
  const cancelled = bookings.filter(b => b.status === "cancelled").length;
  const pending   = bookings.filter(b => b.status === "pending").length;
  const total = bookings.length || 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-extrabold text-slate-900">📊 الإحصائيات والتحليلات</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الحجوزات", value: bookings.length, icon: "📋", color: "text-primary", bg: "bg-sky-50 border-sky-200" },
          { label: "نسبة التأكيد", value: `${Math.round((confirmed / total) * 100)}٪`, icon: "✅", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "نسبة الإلغاء", value: `${Math.round((cancelled / total) * 100)}٪`, icon: "❌", color: "text-red-500", bg: "bg-red-50 border-red-200" },
          { label: "قيد الانتظار", value: pending, icon: "⏳", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
        ].map((k, i) => (
          <div key={i} className={`${k.bg} border rounded-2xl p-5`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className={`text-3xl font-extrabold ${k.color}`}>{k.value}</div>
            <div className="text-slate-600 text-sm font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />حجوزات آخر ٧ أيام</h3>
          <div className="flex items-end gap-2 h-40">
            {days.map(d => {
              const count = bookings.filter(b => b.date === d.date).length;
              const pct = Math.round((count / maxDayCount) * 100);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-slate-700">{count > 0 ? count : ""}</span>
                  <div className="w-full rounded-t-lg bg-primary/10 flex items-end" style={{ height: "120px" }}>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-sky-400" />
                  </div>
                  <span className="text-[10px] text-slate-500">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top services */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" />أكثر الخدمات طلباً</h3>
          <div className="space-y-3">
            {topServices.length === 0 && <p className="text-slate-400 text-sm">لا توجد بيانات</p>}
            {topServices.map(([service, count], i) => (
              <div key={service}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700 truncate">{i + 1}. {service}</span>
                  <span className="text-xs font-bold text-primary">{count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((count / (topServices[0][1] || 1)) * 100)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="h-1.5 rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setLocalSettings] = useState<any>(null);

  // Filters & sort
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortField, setSortField] = useState<"date" | "name">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login"; return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") { window.location.href = "/dashboard"; return; }
      setIsAdmin(true);
      fetchData();
    };
    checkAdmin();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: bookingData } = await supabase.from("bookings").select("*").order("date", { ascending: true });
    if (bookingData) setBookings(bookingData);
    const { data: clientsData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (clientsData) setClients(clientsData);
    const { data: settingsData } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (settingsData) setLocalSettings(settingsData);
    setLoading(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (!error) setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
  };

  const saveSettings = async () => {
    await supabase.from("settings").update({
      max_bookings_per_day: settings.max_bookings_per_day,
      clinic_phone: settings.clinic_phone,
    }).eq("id", 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  // Export Excel
  const exportExcel = () => {
    const header = ["الاسم", "الهاتف", "التاريخ", "الوقت", "الخدمة", "الحالة", "الملاحظات"];
    const rows = filteredBookings.map(b => [b.name, b.phone, b.date, to12h(b.time), b.service, STATUS_LABELS[b.status] || b.status, b.notes || ""]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الحجوزات");
    
    XLSX.writeFile(workbook, `حجوزات-عيادة-شرف-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const toggleSort = (field: "date" | "name") => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  // Filtered + sorted bookings
  const filteredBookings = bookings
    .filter(b => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || b.name?.toLowerCase().includes(q) || b.phone?.includes(q) || b.service?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchDate = !dateFilter || b.date === dateFilter;
      return matchSearch && matchStatus && matchDate;
    })
    .sort((a, b) => {
      const valA = sortField === "date" ? a.date + a.time : a.name || "";
      const valB = sortField === "date" ? b.date + b.time : b.name || "";
      return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const stats = [
    { label: "إجمالي الحجوزات", value: bookings.length, color: "text-primary", bg: "bg-sky-50 border border-sky-200" },
    { label: "مؤكدة", value: bookings.filter(b => b.status === "confirmed").length, color: "text-emerald-600", bg: "bg-emerald-50 border border-emerald-200" },
    { label: "قيد الانتظار", value: bookings.filter(b => b.status === "pending").length, color: "text-amber-600", bg: "bg-amber-50 border border-amber-200" },
    { label: "إجمالي العملاء", value: clients.length, color: "text-violet-600", bg: "bg-violet-50 border border-violet-200" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-16">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return null;

  const SortIcon = ({ field }: { field: "date" | "name" }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`w-3 h-3 ${sortField === field && sortDir === "asc" ? "text-primary" : "text-slate-300"}`} />
      <ChevronDown className={`w-3 h-3 -mt-1 ${sortField === field && sortDir === "desc" ? "text-primary" : "text-slate-300"}`} />
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex pt-16" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 fixed right-0 top-16 bottom-0 bg-white border-l border-slate-200 flex flex-col p-6 hidden md:flex shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-heading font-extrabold text-slate-900">لوحة الإدارة</h2>
          <p className="text-xs text-slate-500 mt-1">عيادة د. خالد شرف</p>
        </div>
        <nav className="flex-1 space-y-1.5">
          {[
            { id: "bookings",   label: "الحجوزات",    icon: Calendar },
            { id: "analytics",  label: "الإحصائيات",  icon: BarChart2 },
            { id: "clients",    label: "العملاء",     icon: Users },
            { id: "settings",   label: "الإعدادات",  icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setActiveTab(id); setSearchQuery(""); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
              <Icon className="w-5 h-5" /> {label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm">
          <LogOut className="w-5 h-5" /> تسجيل الخروج
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 md:mr-64 p-6 md:p-10 max-w-full overflow-x-hidden">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-5`}>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-slate-600 text-sm font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary" />
          </div>

          {/* Status filter */}
          {activeTab === "bookings" && (
            <>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                <option value="all">📋 كل الحالات</option>
                <option value="pending">⏳ انتظار</option>
                <option value="confirmed">✅ مؤكد</option>
                <option value="completed">🏁 مكتمل</option>
                <option value="cancelled">❌ ملغي</option>
              </select>
              {/* Date filter */}
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
              {dateFilter && <button onClick={() => setDateFilter("")} className="text-xs text-slate-400 hover:text-red-500 transition-colors">مسح</button>}
            </>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {activeTab === "bookings" && (
              <>
                <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:text-emerald-600 hover:border-emerald-600 transition-colors">
                  <Download className="w-4 h-4" /> تصدير Excel
                </button>
                <button onClick={() => setShowBookingModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 text-sm">
                  <Plus className="w-4 h-4" /> حجز جديد
                </button>
              </>
            )}
            <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-primary hover:border-primary transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-slate-900 mb-6">إدارة الحجوزات
              <span className="mr-2 text-sm font-normal text-slate-400">({filteredBookings.length} حجز)</span>
            </h1>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="p-4 font-semibold cursor-pointer hover:text-primary select-none" onClick={() => toggleSort("date")}>
                        <span className="flex items-center gap-1">التاريخ والوقت <SortIcon field="date" /></span>
                      </th>
                      <th className="p-4 font-semibold cursor-pointer hover:text-primary select-none" onClick={() => toggleSort("name")}>
                        <span className="flex items-center gap-1">المريض <SortIcon field="name" /></span>
                      </th>
                      <th className="p-4 font-semibold">الخدمة</th>
                      <th className="p-4 font-semibold">الحالة</th>
                      <th className="p-4 font-semibold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{new Date(b.date).toLocaleDateString("en-GB")}</div>
                          <div className="text-primary text-xs font-semibold">{to12h(b.time)}</div>
                        </td>
                        <td className="p-4">
                          <button onClick={() => { const c = clients.find(c => c.phone === b.phone); if (c) setSelectedClient(c); }}
                            className="font-semibold text-slate-900 hover:text-primary transition-colors text-right">
                            {b.name}
                          </button>
                          <div className="text-slate-500 text-xs">{b.phone}</div>
                          {b.notes && <div className="text-slate-400 text-xs italic mt-0.5 max-w-[140px] truncate">"{b.notes}"</div>}
                        </td>
                        <td className="p-4 text-slate-600 text-sm">{b.service}</td>
                        <td className="p-4">
                          <select value={b.status} onChange={e => updateBookingStatus(b.id, e.target.value)}
                            className={`border rounded-full px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer ${STATUS_COLORS[b.status] || ""}`}>
                            <option value="pending">⏳ انتظار</option>
                            <option value="confirmed">✅ مؤكد</option>
                            <option value="completed">🏁 مكتمل</option>
                            <option value="cancelled">❌ ملغي</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {b.phone && (
                              <>
                                <WaButtons phone={b.phone} name={b.name} date={new Date(b.date).toLocaleDateString("en-GB")} time={to12h(b.time)} />
                                <a href={`tel:${b.phone}`} className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors" title="اتصل">
                                  <Phone className="w-4 h-4" />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-400">لا توجد حجوزات</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && <AnalyticsTab bookings={bookings} />}

        {/* ── CLIENTS TAB ── */}
        {activeTab === "clients" && (
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-slate-900 mb-6">قاعدة العملاء</h1>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <th className="p-4 font-semibold">العميل</th>
                      <th className="p-4 font-semibold">رقم الهاتف</th>
                      <th className="p-4 font-semibold">الدور</th>
                      <th className="p-4 font-semibold">تاريخ التسجيل</th>
                      <th className="p-4 font-semibold text-center">تواصل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-primary font-bold text-sm">{client.name?.charAt(0) || "؟"}</span>
                            </div>
                            <div>
                              <button onClick={() => setSelectedClient(client)} className="font-semibold text-slate-900 hover:text-primary transition-colors">
                                {client.name || "—"}
                              </button>
                              <div className="text-slate-400 text-xs">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-700 font-medium">{client.phone || "—"}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${client.role === "admin" ? "bg-violet-50 text-violet-700 border border-violet-200" : "bg-slate-100 text-slate-600"}`}>
                            {client.role === "admin" ? "مدير" : "مريض"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{new Date(client.created_at || "").toLocaleDateString("en-GB")}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {client.phone && (
                              <>
                                <WaButtons phone={client.phone} name={client.name || ""} date="—" time="—" />
                                <a href={`tel:${client.phone}`} className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors">
                                  <Phone className="w-4 h-4" />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredClients.length === 0 && (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-400">لا يوجد عملاء</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-slate-900 mb-6">إعدادات العيادة</h1>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-xl space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الحد الأقصى للحجوزات في اليوم</label>
                <input type="number" value={settings?.max_bookings_per_day || 10}
                  onChange={e => setLocalSettings({ ...settings, max_bookings_per_day: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
                <p className="text-xs text-slate-500 mt-2">سيظهر «محجوز بالكامل» عند الوصول لهذا الحد.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">رقم هاتف العيادة</label>
                <input type="tel" value={settings?.clinic_phone || ""}
                  onChange={e => setLocalSettings({ ...settings, clinic_phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10" />
              </div>
              <button onClick={saveSettings} className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
                حفظ الإعدادات
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showBookingModal && (
          <AdminBookingModal onClose={() => setShowBookingModal(false)} onSaved={fetchData} />
        )}
        {selectedClient && (
          <ClientModal client={selectedClient} bookings={bookings} onClose={() => setSelectedClient(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
