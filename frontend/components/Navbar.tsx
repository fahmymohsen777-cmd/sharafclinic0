"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, UserCircle, LogOut, Globe, LayoutDashboard, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLang } from "./Providers";

const navLinks = [
  { name: "الرئيسية", nameEn: "Home", href: "/" },
  { name: "الأطباء", nameEn: "Doctors", href: "/doctors" },
  { name: "الخدمات", nameEn: "Services", href: "/#services" },
  { name: "لماذا نحن", nameEn: "Why Us", href: "/#why-us" },
  { name: "التقييمات", nameEn: "Reviews", href: "/reviews" },
  { name: "اتصل بنا", nameEn: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const { lang, setLang } = useLang();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    supabase.auth.getSession().then(async ({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", data.session.user.id).single();
        if (profile) {
          setRole(profile.role);
          setUserName(profile.name);
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", session.user.id).single();
        if (profile) {
          setRole(profile.role);
          setUserName(profile.name);
        }
      } else {
        setRole(null);
        setUserName(null);
      }
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // حتى لو فشل signOut، نمسح الـ session يدوياً
    }
    // مسح كل بيانات الـ session من المتصفح
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
      });
    }
    setUser(null);
    setRole(null);
    setUserName(null);
    window.location.href = "/auth/login";
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md shadow-slate-200/80 py-2"
          : "bg-white/80 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/doctors/Website-logo.webp"
            alt="عيادة د. خالد شرف"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div className="hidden sm:block">
            <span className="font-heading font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-primary transition-colors block leading-tight">
              د. خالد شرف
            </span>
            <span className="text-xs text-slate-500 leading-tight">طب وتجميل الأسنان</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* User Dropdown */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <UserCircle className="w-7 h-7 text-primary" />
                <span className="text-sm font-bold text-slate-700 hidden lg:block">
                  {userName ? userName.split(" ")[0] : user.email?.split("@")[0]}
                </span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-2"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-900 truncate">{userName || "المستخدم"}</p>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{user.email}</p>
                    </div>
                    
                    {role === "admin" ? (
                      <Link
                        onClick={() => setDropdownOpen(false)}
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> لوحة الإدارة
                      </Link>
                    ) : (
                      <>
                        <Link
                          onClick={() => setDropdownOpen(false)}
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" /> حجوزاتي واللوحة
                        </Link>
                        <Link
                          onClick={() => setDropdownOpen(false)}
                          href="/dashboard/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          تعديل البروفايل
                        </Link>
                      </>
                    )}
                    
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> تسجيل الخروج
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
            >
              تسجيل الدخول
            </Link>
          )}

          {/* Book CTA */}
          {role !== "admin" && (
            <Link
              href="/book"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-full shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
            >
              احجز الآن
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-600 hover:text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-lg px-6 md:hidden overflow-hidden"
          >
            <div className="flex flex-col py-4 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-700 hover:text-primary py-3 border-b border-slate-100"
                >
                  {link.name}
                </Link>
              ))}

              <div className="flex items-center justify-between py-3">
                <button
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <Globe className="w-4 h-4" /> {lang === "ar" ? "English" : "العربية"}
                </button>
                <a href="tel:01008080358" className="flex items-center gap-2 text-sm text-primary font-semibold">
                  <Phone className="w-4 h-4" /> 01008080358
                </a>
              </div>

              <div className="flex flex-col gap-3 pt-3">
                {user ? (
                  <>
                    <Link
                      href={role === "admin" ? "/admin" : "/dashboard"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 text-sm font-medium text-slate-700 bg-slate-50 rounded-xl"
                    >
                      {role === "admin" ? "لوحة الإدارة" : "حجوزاتي"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-red-500"
                    >
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 text-sm font-medium text-slate-700 bg-slate-50 rounded-xl"
                  >
                    تسجيل الدخول
                  </Link>
                )}
                {role !== "admin" && (
                  <Link
                    href="/book"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-3 bg-primary text-white text-sm font-bold rounded-full shadow-lg shadow-primary/20"
                  >
                    احجز الآن
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
