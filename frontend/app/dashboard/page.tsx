"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Calendar, Clock, Activity, FileText, CheckCircle2, XCircle, LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function UserDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Hard timeout — if anything hangs for 8 seconds, redirect to login
      const timeoutId = setTimeout(() => {
        window.location.href = "/auth/login";
      }, 8000);

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
          clearTimeout(timeoutId);
          window.location.href = "/auth/login";
          return;
        }
        const user = authData.user;

        // Fetch User Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          if (profileData.role === 'admin') {
            clearTimeout(timeoutId);
            window.location.href = "/admin";
            return;
          }
          setProfile(profileData);
        }

        // Fetch User Bookings
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .order("time", { ascending: true });
        
        if (bookingData) setBookings(bookingData);
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(error);
        window.location.href = "/auth/login";
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed': return <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
      case 'cancelled': return <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'completed': return <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      default: return <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: "user" })
      .eq("id", id);
      
    if (error) {
      alert("عذراً، حدث خطأ أثناء إلغاء الموعد. يرجى المحاولة مرة أخرى.");
      console.error("Cancel error:", error);
    } else {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
    }
    setCancellingId(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-dark flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Header section */}
        <div className="bg-white p-6 md:p-8 rounded-3xl mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-50 shadow-sm shrink-0 relative">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 mb-1">أهلاً بك، {profile?.name}</h1>
              <p className="text-slate-600 text-sm md:text-base">يمكنك مشاهدة وإدارة جميع مواعيد الأسنان الخاصة بك.</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="flex w-full md:w-auto items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors font-semibold border border-slate-200">
            <Settings className="w-5 h-5" /> إعدادات الحساب
          </Link>
        </div>

        {/* Bookings List */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="text-primary w-6 h-6" /> مواعيدك القادمة والسابقة
          </h2>

          {bookings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">لا توجد مواعيد</h3>
              <p className="text-slate-500 mb-6">لم تقم بحجز أي مواعيد في العيادة بعد.</p>
              <button 
                onClick={() => window.location.href = "/book"}
                className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-semibold transition-colors shadow-lg shadow-primary/20"
              >
                احجز الآن
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={booking.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6 md:items-center relative overflow-hidden"
                >
                  {/* subtle glow for active bookings */}
                  {booking.status === 'confirmed' && (
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-primary" />
                  )}

                  <div className="flex-1 grid md:grid-cols-3 gap-4 md:gap-8">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> التاريخ والوقت</p>
                      <p className="font-bold text-slate-900">{new Date(booking.date).toLocaleDateString()}</p>
                      <p className="text-sm text-primary font-bold">{booking.time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> الخدمة</p>
                      <p className="font-bold text-slate-900">{booking.service}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> الحالة</p>
                      <div className="mt-1">{getStatusBadge(booking.status)}</div>
                    </div>
                  </div>

                  {['confirmed', 'pending'].includes(booking.status) && (
                    <div className="flex items-center gap-2">
                      {cancellingId === booking.id ? (
                        <>
                          <button 
                            onClick={() => handleCancel(booking.id)}
                            className="text-sm text-white font-medium px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm shadow-red-500/20"
                          >
                            تأكيد الإلغاء
                          </button>
                          <button 
                            onClick={() => setCancellingId(null)}
                            className="text-sm text-slate-500 font-medium px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                          >
                            تراجع
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setCancellingId(booking.id)}
                          className="text-sm text-red-500 font-medium hover:text-white px-5 py-2 bg-red-50 hover:bg-red-500 rounded-xl transition-colors border border-red-100 hover:border-red-500"
                        >
                          إلغاء الموعد
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
