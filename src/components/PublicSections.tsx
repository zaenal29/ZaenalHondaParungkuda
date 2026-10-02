import React, { useState } from 'react';
import {
  MessageCircle,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  BookOpen,
  X,
  Lock,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { PublicBootstrapData, Article } from '../types/index.ts';
import { buildWhatsappUrl } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface PublicSectionsProps {
  data: PublicBootstrapData;
  isAdminAuthenticated: boolean;
  onOpenAdminLogin: () => void;
  onOpenAdminDashboard: () => void;
}

export const HeroSection: React.FC<{ data: PublicBootstrapData }> = ({ data }) => {
  const { siteSettings } = data;
  const waLink = buildWhatsappUrl(
    siteSettings.whatsappNumber,
    siteSettings.whatsappDefaultMessage
  );

  const secondaryHref =
    siteSettings.heroSecondaryBtnLink === 'whatsapp' ||
    !siteSettings.heroSecondaryBtnLink
      ? waLink
      : siteSettings.heroSecondaryBtnLink;

  return (
    <section
      id="beranda"
      className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Focal Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center flex-wrap gap-2 text-xs font-semibold tracking-wider text-red-400 uppercase">
              <span>{siteSettings.companyName}</span>
              <span aria-hidden="true">·</span>
              <span>{siteSettings.branchName}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-white leading-[1.12]">
              {siteSettings.heroTitle}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              {siteSettings.heroSubtitle}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <a
                href={siteSettings.heroPrimaryBtnLink || '#katalog'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
              >
                <span>{siteSettings.heroPrimaryBtnText || 'Lihat Katalog'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={secondaryHref}
                target={secondaryHref.startsWith('http') ? '_blank' : undefined}
                rel={secondaryHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{siteSettings.heroSecondaryBtnText || 'Chat WhatsApp'}</span>
              </a>
            </div>

            {/* Trust Highlights (Unboxed Clean Typography) */}
            <div className="pt-6 border-t border-slate-800/90 grid grid-cols-3 gap-4 text-xs sm:text-sm">
              <div>
                <div className="font-mono text-lg sm:text-xl font-bold text-white tabular-nums">
                  100% Resmi
                </div>
                <div className="text-slate-400 mt-0.5">Dealer & Garansi AHM</div>
              </div>
              <div>
                <div className="font-mono text-lg sm:text-xl font-bold text-white tabular-nums">
                  11 – 35 Bln
                </div>
                <div className="text-slate-400 mt-0.5">Pilihan Tenor Fleksibel</div>
              </div>
              <div>
                <div className="font-mono text-lg sm:text-xl font-bold text-white tabular-nums">
                  Gratis Ongkir
                </div>
                <div className="text-slate-400 mt-0.5">Pengiriman Sukabumi</div>
              </div>
            </div>
          </div>

          {/* Right Hero Image */}
          <div className="lg:col-span-6">
            <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
              <ResilientImage
                src={siteSettings.heroImage}
                alt={siteSettings.heroTitle}
                fallbackTitle={siteSettings.siteName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-5 sm:p-6">
                <div className="text-xs sm:text-sm text-slate-200">
                  <span className="font-semibold text-white">
                    {siteSettings.salesName} — Marketing Executive
                  </span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span>{siteSettings.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const RemainingPublicSections: React.FC<PublicSectionsProps> = ({
  data,
  isAdminAuthenticated,
  onOpenAdminLogin,
  onOpenAdminDashboard,
}) => {
  const { siteSettings, promos, articles, testimonials } = data;
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const activePromos = promos.filter((p) => p.isActive);
  const publishedArticles = articles.filter((a) => a.isPublished);
  const publishedTestimonials = testimonials.filter((t) => t.isPublished);

  const waDefaultUrl = buildWhatsappUrl(
    siteSettings.whatsappNumber,
    siteSettings.whatsappDefaultMessage
  );

  return (
    <>
      {/* ===================================================================
          SECTION 03: PROMO HONDA TERBARU (Requirement 14)
      =================================================================== */}
      <section id="promo" className="py-16 sm:py-24 bg-[#F9F9F8] border-b border-slate-200/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold tracking-wider text-red-600 uppercase mb-2">
              03. Promo Honda Terbaru
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
              Program Subsidi DP, Diskon Cash & Bonus Pembelian
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Manfaatkan penawaran resmi yang sedang berlangsung di PT Selamat Lestari Mandiri Cabang Parungkuda.
            </p>
          </div>

          {activePromos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              Belum ada promo aktif saat ini. Silakan hubungi WhatsApp Marketing untuk penawaran khusus.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {activePromos.map((promo) => {
                const promoWa = buildWhatsappUrl(
                  siteSettings.whatsappNumber,
                  promo.whatsappText ||
                    `Assalamualaikum Pak Zaenal, saya ingin menanyakan promo: ${promo.title}`
                );
                return (
                  <article
                    key={promo.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-4/3 bg-slate-100 overflow-hidden border-b border-slate-100">
                        <ResilientImage
                          src={promo.imageUrl}
                          alt={promo.title}
                          fallbackTitle={promo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 sm:p-6">
                        <div className="text-xs font-medium text-slate-500 mb-2">
                          <span className="text-red-600 font-semibold">
                            {promo.highlightText || 'Promo Spesial'}
                          </span>
                          <span className="mx-1.5">·</span>
                          <span>Periode: {promo.period}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-slate-950">
                          {promo.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          {promo.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 sm:px-6 pb-6 pt-3 border-t border-slate-100 flex items-center gap-2.5">
                      <a
                        href={promoWa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Ambil Promo via WA</span>
                      </a>
                      {promo.linkUrl && (
                        <a
                          href={promo.linkUrl}
                          className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Simulasi
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================
          SECTION 04: TESTIMONI PELANGGAN & SERAH TERIMA UNIT (Requirement 16)
      =================================================================== */}
      <section id="testimoni" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold tracking-wider text-red-600 uppercase mb-2">
              04. Bukti Serah Terima & Kepuasan Konsumen
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
              Testimoni Pelanggan Honda Parungkuda
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Dokumentasi serah terima unit sepeda motor Honda bersama konsumen di Parungkuda dan wilayah Kabupaten Sukabumi.
            </p>
          </div>

          {publishedTestimonials.length === 0 ? (
            <div className="bg-[#F9F9F8] border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              Belum ada testimoni yang ditampilkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {publishedTestimonials.map((item) => (
                <article
                  key={item.id}
                  className="bg-[#F9F9F8] border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-4/3 bg-slate-200 overflow-hidden">
                    <ResilientImage
                      src={item.handoverPhotoUrl || item.customerPhotoUrl}
                      alt={`Serah terima ${item.motorName} - ${item.customerName}`}
                      fallbackTitle={`Serah Terima ${item.motorName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500 font-medium mb-2">
                        <span className="font-semibold text-red-600">{item.motorName}</span>
                        <span className="mx-1.5">·</span>
                        <span className="tabular-nums">{item.handoverDate}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        "{item.caption}"
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-300 shrink-0">
                        <ResilientImage
                          src={item.customerPhotoUrl || item.handoverPhotoUrl}
                          alt={item.customerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-slate-950">{item.customerName}</div>
                        <div className="text-slate-500">
                          {item.customerLocation || 'Kabupaten Sukabumi'}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================
          SECTION 05: TIPS & PANDUAN PEMBELIAN (Requirement 15)
      =================================================================== */}
      <section id="tips" className="py-16 sm:py-24 bg-[#F9F9F8] border-b border-slate-200/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold tracking-wider text-red-600 uppercase mb-2">
              05. Pusat Informasi & Edukasi Konsumen
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
              Tips & Panduan Pembelian Motor Honda
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Pelajari syarat kredit & cash, alur pengajuan dari rumah, tips memilih DP dan tenor, hingga informasi STNK, BPKB, dan servis berkala AHASS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {publishedArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col sm:flex-row"
              >
                <div className="sm:w-48 md:w-52 aspect-4/3 sm:aspect-auto bg-slate-100 shrink-0 overflow-hidden">
                  <ResilientImage
                    src={article.imageUrl}
                    alt={article.title}
                    fallbackTitle={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1.5">
                      <span className="text-red-600 font-semibold">{article.category}</span>
                      <span className="mx-1.5">·</span>
                      <span className="tabular-nums">{article.publishedDate}</span>
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-950">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Baca Panduan Lengkap</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 06: TENTANG KAMI & VISI MISI (Requirements 17 & 18)
      =================================================================== */}
      <section id="tentang" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-4">
              <p className="text-xs font-semibold tracking-wider text-red-600 uppercase">
                06. Tentang Dealer Kami
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
                {siteSettings.companyName} — {siteSettings.branchName}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {siteSettings.aboutDescription}
              </p>

              <div className="pt-4 border-t border-slate-200 space-y-2 text-sm text-slate-700">
                <div>
                  <strong className="text-slate-950">Marketing Resmi:</strong>{' '}
                  {siteSettings.salesName} ({siteSettings.siteName})
                </div>
                <div>
                  <strong className="text-slate-950">Alamat Dealer:</strong>{' '}
                  {siteSettings.address}
                </div>
                <div>
                  <strong className="text-slate-950">WhatsApp Konsultasi:</strong>{' '}
                  <span className="font-mono">{siteSettings.whatsappNumber}</span>
                </div>
              </div>
            </div>

            {/* 3 Photos: Dealer, Showroom, Team */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 aspect-16/9 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                <ResilientImage
                  src={siteSettings.dealerPhotoUrl}
                  alt={`Gedung Dealer ${siteSettings.companyName}`}
                  fallbackTitle="Foto Perusahaan / Dealer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-slate-950/80 text-white text-xs font-medium px-3 py-1 rounded-md">
                  Dealer Resmi {siteSettings.companyName} {siteSettings.branchName}
                </div>
              </div>
              <div className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                <ResilientImage
                  src={siteSettings.showroomPhotoUrl}
                  alt="Showroom Motor Honda Parungkuda"
                  fallbackTitle="Foto Showroom"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                  Ruang Pamer Showroom
                </div>
              </div>
              <div className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                <ResilientImage
                  src={siteSettings.teamPhotoUrl}
                  alt="Tim Pelayanan Honda Parungkuda"
                  fallbackTitle="Foto Tim Marketing"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                  Pelayanan & Serah Terima
                </div>
              </div>
            </div>
          </div>

          {/* Visi & Misi Section (Requirement 18) */}
          <div className="bg-[#F9F9F8] border border-slate-200 rounded-2xl p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Visi Perusahaan
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-950">
                  Komitmen Pelayanan Terbaik di Sukabumi
                </h3>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {siteSettings.vision}
                </p>
              </div>

              <div className="lg:col-span-7 lg:border-l lg:border-slate-200 lg:pl-8 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Misi Pelayanan Kami
                </span>
                <ol className="space-y-3">
                  {siteSettings.missions.map((mission, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed"
                    >
                      <span className="font-mono text-xs font-bold text-red-600 pt-0.5 shrink-0 tabular-nums">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <span>{mission}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 07: KONTAK & LOKASI DEALER (Requirements 19 & 20)
      =================================================================== */}
      <section id="kontak" className="py-16 sm:py-24 bg-[#F9F9F8] border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-red-600 uppercase mb-2">
                  07. Hubungi Kami
                </p>
                <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
                  Kunjungi Showroom atau Konsultasi via WhatsApp
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600">
                  Kami siap membantu simulasi kredit, pengecekan stok warna, hingga penjemputan berkas persyaratan ke rumah Anda.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-sm">
                <div className="flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-950">
                      {siteSettings.companyName} — {siteSettings.branchName}
                    </div>
                    <div className="text-slate-600 mt-0.5">{siteSettings.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                  <Phone className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-950">
                      WhatsApp Marketing ({siteSettings.salesName})
                    </div>
                    <div className="font-mono text-base font-semibold text-red-600 mt-0.5 tabular-nums">
                      {siteSettings.whatsappNumber}
                    </div>
                  </div>
                </div>

                {siteSettings.operationalHours && (
                  <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                    <Clock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-950">Jam Operasional Layanan</div>
                      <div className="text-slate-600 mt-0.5">
                        {siteSettings.operationalHours}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={waDefaultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat WhatsApp: {siteSettings.whatsappNumber}</span>
                </a>
              </div>
            </div>

            {/* Right Card: Social Media Dynamic Links (Requirement 20) */}
            <div className="lg:col-span-5 bg-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Official Marketing Channel
                </span>
                <h3 className="font-display text-2xl font-bold mt-1">
                  {siteSettings.siteName}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Ikuti media sosial resmi kami untuk update stok unit terbaru, pengiriman motor konsumen, dan promo bulanan Honda Sukabumi.
                </p>
              </div>

              {/* Dynamic Social Media Icons — Automatically hidden if link is empty! */}
              <div className="space-y-2.5">
                {siteSettings.facebookUrl && siteSettings.facebookUrl.trim() !== '' && (
                  <a
                    href={siteSettings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-400 fill-current" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                      <span className="text-sm font-semibold">Facebook Resmi</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                )}

                {siteSettings.instagramUrl && siteSettings.instagramUrl.trim() !== '' && (
                  <a
                    href={siteSettings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-pink-400 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      <span className="text-sm font-semibold">Instagram Resmi</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                )}

                {siteSettings.tiktokUrl && siteSettings.tiktokUrl.trim() !== '' && (
                  <a
                    href={siteSettings.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                      <span className="text-sm font-semibold">TikTok Resmi</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          QUIET FOOTER WITH DISCREET ADMIN BUTTON (Requirement 2)
      =================================================================== */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div>
              <div className="font-display text-lg font-bold text-white">
                {siteSettings.siteName}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {siteSettings.companyName} · {siteSettings.branchName} — {siteSettings.address}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs font-medium">
              <a href="#beranda" className="hover:text-white transition-colors">
                Beranda
              </a>
              <a href="#katalog" className="hover:text-white transition-colors">
                Katalog Motor
              </a>
              <a href="#simulasi" className="hover:text-white transition-colors">
                Simulasi Kredit
              </a>
              <a href="#promo" className="hover:text-white transition-colors">
                Promo
              </a>
              <a href="#tips" className="hover:text-white transition-colors">
                Tips & Panduan
              </a>
              <a href="#testimoni" className="hover:text-white transition-colors">
                Testimoni
              </a>
              <a href="#tentang" className="hover:text-white transition-colors">
                Tentang Kami
              </a>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} {siteSettings.siteName} ({siteSettings.companyName}{' '}
              {siteSettings.branchName}). Hak Cipta Dilindungi.
            </p>

            {/* Discreet Admin Button (Requirement 2: Sediakan tombol/menu "Admin" yang tidak terlalu mencolok) */}
            <button
              type="button"
              onClick={isAdminAuthenticated ? onOpenAdminDashboard : onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>{isAdminAuthenticated ? 'Dashboard Admin' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* ===================================================================
          FLOATING WHATSAPP BUTTON (Requirement 38)
      =================================================================== */}
      <a
        href={waDefaultUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat WhatsApp Marketing"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Chat WhatsApp</span>
      </a>

      {/* ===================================================================
          ARTICLE READER MODAL (Requirement 15)
      =================================================================== */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-red-600">
                {selectedArticle.category} · {selectedArticle.publishedDate}
              </span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100">
                <ResilientImage
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-950">
                {selectedArticle.title}
              </h3>
              <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedArticle.content}
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <a
                  href={waDefaultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Konsultasi via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
