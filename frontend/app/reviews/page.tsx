"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Star, Quote, ArrowLeft, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

// All 31 review images
const reviewImages = [
  "480666852_1071511244988338_1450967653191985203_n.jpg",
  "480872535_1073287911477338_4042171945218958140_n.jpg",
  "480914119_1073290371477092_1433949463689759423_n.jpg",
  "480948056_1072555374883925_8850344558788991774_n.jpg",
  "482354742_1085907936882002_829991279135831535_n.jpg",
  "483571168_1085914566881339_4728106427653936686_n.jpg",
  "485350412_1093194839486645_3517826296312013359_n.jpg",
  "485353330_1093802802759182_9106165937809648934_n.jpg",
  "486020818_1092743652865097_7412896907118629804_n.jpg",
  "486230806_1096911165781679_2254501741013798394_n.jpg",
  "486557407_1100923842047078_1230159213422925616_n.jpg",
  "486830419_1098577045615091_1644908188232251680_n.jpg",
  "487240464_1101837325289063_3423992164759638844_n.jpg",
  "487455744_1103001178506011_8965248437544489257_n.jpg",
  "487462402_1102137595259036_5401652795516143751_n.jpg",
  "487462933_1102155718590557_2061596184475140204_n.jpg",
  "487500937_1099458168860312_5251041547538037939_n.jpg",
  "487516889_1102130591926403_1413172860667413622_n.jpg",
  "487561171_1103112325161563_1136667665967224879_n.jpg",
  "487786317_1102130605259735_1080124966524834210_n.jpg",
  "488516753_1106643448141784_437810073724384448_n.jpg",
  "489214046_18356096221196445_2989284025486551382_n.jpg",
  "492004643_1117157463757049_1071249706054656338_n.jpg",
  "496700286_1133351105471018_1686549764565690987_n.jpg",
  "503748187_1153725680100227_3905023922143915852_n.jpg",
  "504877048_1155152383290890_1323477647918813055_n.jpg",
  "524639663_1192841569521971_2987043989545004919_n.jpg",
  "540003764_1222805803192214_3773896211660044510_n.jpg",
  "601358172_1319240973548696_7218452876400218850_n.jpg",
  "623658082_1352414103564716_1054522101215702412_n.jpg",
  "659894237_10164865933732638_3924919058089650694_n.jpg",
];

// Masonry layout: assign images to 3 columns
const column1 = reviewImages.filter((_, i) => i % 3 === 0);
const column2 = reviewImages.filter((_, i) => i % 3 === 1);
const column3 = reviewImages.filter((_, i) => i % 3 === 2);

// Lightbox Component
function Lightbox({ src, onClose, onPrev, onNext }: { src: string; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNext();
      if (e.key === "ArrowRight") onPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative max-w-2xl w-full max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src={`/reviews/${src}`}
            alt="تقييم"
            width={700}
            height={900}
            className="w-full h-auto object-contain max-h-[85vh] bg-white"
          />
        </div>

        {/* Controls */}
        <button
          onClick={onClose}
          className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold shadow-lg hover:scale-110 transition-transform text-lg"
        >
          ×
        </button>
        <button
          onClick={onPrev}
          className="absolute left-1/2 -translate-x-1/2 -bottom-14 translate-y-0 flex items-center gap-6"
        >
          <span
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
}

// Single Review Card
function ReviewCard({ src, index, onClick }: { src: string; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.015 }}
      onClick={onClick}
      className="relative cursor-zoom-in group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
    >
      <Image
        src={`/reviews/${src}`}
        alt={`تقييم ${index + 1}`}
        width={500}
        height={600}
        className="w-full h-auto object-cover"
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Quote className="w-5 h-5 text-primary" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Masonry Column
function MasonryColumn({ images, colIndex, globalOffset, onOpen }: {
  images: string[];
  colIndex: number;
  globalOffset: number;
  onOpen: (idx: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {images.map((src, i) => {
        const globalIndex = globalOffset + i;
        return (
          <ReviewCard
            key={src}
            src={src}
            index={globalIndex}
            onClick={() => onOpen(globalIndex)}
          />
        );
      })}
    </div>
  );
}

const stats = [
  { number: "٥٠٠+", label: "مريض سعيد" },
  { number: "٥ ⭐", label: "متوسط التقييم" },
  { number: "٣١+", label: "تقييم على Google" },
  { number: "١٠٠٪", label: "يوصون بالعيادة" },
];

export default function ReviewsPage() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prevImage = () => setLightboxIdx((i) => (i === null ? 0 : (i - 1 + reviewImages.length) % reviewImages.length));
  const nextImage = () => setLightboxIdx((i) => (i === null ? 0 : (i + 1) % reviewImages.length));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50" dir="rtl">
      
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-6 max-w-5xl text-center relative"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white border border-primary/20 text-primary px-5 py-2 rounded-full text-sm font-bold shadow-sm mb-6"
          >
            <MessageCircle className="w-4 h-4" />
            آراء مرضانا الحقيقية
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-6xl font-heading font-extrabold text-slate-900 mb-6 leading-tight"
          >
            ماذا يقول{" "}
            <span className="bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">
              مرضانا
            </span>
            {" "}عنّا؟
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            أكثر من ٥٠٠ مريض وثقوا بنا. هذه تقييماتهم الحقيقية على Google — بدون تعديل أو انتقاء.
          </motion.p>

          {/* Stars display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-1 mb-10"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, rotate: -30 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.4 + i * 0.07 }}
              >
                <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
              </motion.div>
            ))}
            <span className="mr-3 text-2xl font-extrabold text-slate-900">5.0</span>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="text-2xl font-extrabold text-primary mb-1">{s.number}</div>
                <div className="text-sm text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* SEPARATOR */}
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-slate-200" />
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium px-4">
            <Quote className="w-4 h-4 text-primary" />
            جميع التقييمات من Google Reviews
          </div>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      </div>

      {/* MASONRY GRID */}
      <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          <MasonryColumn
            images={column1}
            colIndex={0}
            globalOffset={0}
            onOpen={openLightbox}
          />
          <MasonryColumn
            images={column2}
            colIndex={1}
            globalOffset={column1.length}
            onOpen={openLightbox}
          />
          <MasonryColumn
            images={column3}
            colIndex={2}
            globalOffset={column1.length + column2.length}
            onOpen={openLightbox}
          />
        </div>

        {/* CTA at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-20 p-10 md:p-14 bg-gradient-to-br from-primary to-sky-500 rounded-3xl shadow-2xl shadow-primary/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-8 text-white text-8xl font-serif">&ldquo;</div>
            <div className="absolute bottom-4 left-8 text-white text-8xl font-serif rotate-180">&ldquo;</div>
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-4">
              هل أنت مستعد لتجربة الفرق؟
            </h2>
            <p className="text-sky-100 mb-8 text-lg max-w-lg mx-auto">
              انضم لآلاف المرضى الراضين واحجز موعدك اليوم
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-extrabold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg"
            >
              <Star className="w-5 h-5 fill-primary" />
              احجز موعدك الآن
            </Link>
          </div>
        </motion.div>
      </section>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            src={reviewImages[lightboxIdx]}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
