"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Phone, Calendar, Star, ArrowLeft } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-32 pb-16">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-blue-50 -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -z-10" />

      {/* Decorative circle pattern */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] hidden lg:block -z-10">
        <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
        <div className="absolute inset-8 rounded-full border-2 border-primary/8" />
        <div className="absolute inset-16 rounded-full border-2 border-primary/6" />
        <div className="absolute inset-24 rounded-full bg-primary/5" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-6"
            >
              <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
              أفضل عيادة أسنان في القاهرة 2025 🏆
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold text-slate-900 leading-[1.1] mb-6">
              ابتسامتك
              <span className="block text-gradient mt-2">مهمتنا</span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
              رعاية أسنان متكاملة بأيدي أمهر الأطباء في قاهرة. تجميل وعلاج بأحدث التقنيات العالمية.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="group px-8 py-4 bg-primary hover:bg-primary-hover text-white text-lg font-bold rounded-full shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                احجز موعدك الآن
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:01008080358"
                className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 text-lg font-bold rounded-full border-2 border-slate-200 hover:border-primary/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5 text-primary" />
                01008080358
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-3">
                {["/doctors/khaled.jpg", "/doctors/ahmed-mahran.jpg", "/doctors/ahmed-magdi.jpg"].map((src, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                    <Image src={src} alt="doctor" width={40} height={40} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 font-medium">+6000 مريض سعيد</p>
              </div>
            </div>
          </motion.div>

          {/* Right side image/card */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* Main doctor image */}
            <div className="relative w-80 h-96 rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/50 border border-white">
              <Image
                src="/doctors/khaled.jpg"
                alt="د. خالد شرف"
                fill
                className="object-cover"
              />
              {/* Card overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-6">
                <p className="text-white font-bold text-lg">د. خالد شرف</p>
                <p className="text-sky-300 text-sm">طبيب تجميل الأسنان واللثة</p>
              </div>
            </div>

            {/* Award badge floating */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -left-8 top-12 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">🏆</div>
              <div>
                <p className="text-xs font-bold text-slate-900">جائزة 2025</p>
                <p className="text-xs text-slate-500">أفضل عيادة في القاهرة</p>
              </div>
            </motion.div>

            {/* Experience badge */}
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute -right-4 bottom-24 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 px-5 py-4 text-center"
            >
              <p className="text-3xl font-extrabold">25+</p>
              <p className="text-sm font-medium opacity-90">عام خبرة</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
