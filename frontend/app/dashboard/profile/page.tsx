"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Phone, Lock, Save, Camera, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Custom Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000); // hide after 4 seconds
  };

  useEffect(() => {
    const fetchProfile = async () => {
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
        const u = authData.user;
        setUser(u);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
          setName(profileData.name || "");
          setPhone(profileData.phone || "");
          setAvatarUrl(profileData.avatar_url || null);
        }
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error(err);
        window.location.href = "/auth/login";
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ name, phone })
        .eq("id", user.id)
        .select();
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        showToast("فشل التحديث: يبدو أن قاعدة البيانات لم تقبل التعديل (قد يكون هناك مشكلة في صلاحيات RLS).", "error");
      } else {
        showToast("تم تحديث البيانات بنجاح!");
      }
    } catch (err: any) {
      showToast("حدث خطأ أثناء التحديث: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast("كلمة المرور غير متطابقة!", "error");
      return;
    }
    setPassSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      showToast("تم تغيير كلمة المرور بنجاح!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast("حدث خطأ: " + err.message, "error");
    } finally {
      setPassSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("يرجى اختيار صورة.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        // Fallback: If bucket non-existent or error, just alert it.
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      const { data: updateData, error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id)
        .select();

      if (updateError) throw updateError;
      
      if (!updateData || updateData.length === 0) {
        throw new Error("لم تقبل قاعدة البيانات التعديل (البيانات لم تُحدَّث في الجدول).");
      }
      
      setAvatarUrl(data.publicUrl);
      showToast("تم رفع الصورة بنجاح!");
    } catch (error: any) {
      showToast("تعذر رفع الصورة. تأكد من أن قاعدة البيانات تدعم التخزين ('avatars' bucket) وأن عمود avatar_url موجود.", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-24 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-white font-medium shadow-xl flex items-center gap-2 ${toastMessage.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
        >
          {toastMessage.text}
        </motion.div>
      )}

      <div className="container mx-auto px-6 max-w-4xl">
        
        {/* Navigation back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-6 font-medium">
          <ArrowRight className="w-5 h-5" /> العودة للوحة التحكم
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 mb-2">إعدادات الحساب</h1>
          <p className="text-slate-600">تحديث بياناتك الشخصية، وصورة حسابك، وكلمة المرور.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Avatar Section */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
              <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-slate-50 bg-slate-100 shadow-md">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
                
                {/* Upload Overlay */}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-8 h-8" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={uploadAvatar} 
                    className="hidden" 
                    disabled={loading}
                  />
                </label>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
              <p className="text-sm text-slate-500 mb-4">{user?.email}</p>
              
              <label className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-medium transition-colors text-sm">
                <Camera className="w-4 h-4 ml-2" /> تغيير الصورة
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={uploadAvatar} 
                  className="hidden" 
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Personal Info Form */}
            <motion.form 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={handleUpdateProfile} 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> البيانات الشخصية
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم الكامل</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium text-left"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} حفظ التغييرات
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Password Update Form */}
            <motion.form 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onSubmit={handleUpdatePassword} 
              className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-500" /> تغيير كلمة المرور
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">كلمة المرور الجديدة</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-left"
                    dir="ltr"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">تأكيد كلمة المرور</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-left"
                    dir="ltr"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={passSaving || !password}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {passSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} تحديث كلمة المرور
                  </button>
                </div>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
}
