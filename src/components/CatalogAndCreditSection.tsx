import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Search,
  SlidersHorizontal,
  Calculator,
  MessageCircle,
  X,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  PublicBootstrapData,
  MotorVariant,
  MotorColor,
} from '../types/index.ts';
import {
  formatRupiah,
  buildWhatsappUrl,
  buildOrderWhatsappMessage,
} from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface CatalogAndCreditSectionProps {
  data: PublicBootstrapData;
}

export const CatalogAndCreditSection: React.FC<CatalogAndCreditSectionProps> = ({ data }) => {
  const {
    siteSettings,
    tenors,
    motorModels,
    motorVariants,
    motorColors,
    motorImages,
    motorSpecs,
    creditSimulations,
  } = data;

  // 1. CATALOG FILTER & COLOR SELECTION PER VARIANT
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Map of variantId -> selected colorId on catalog cards
  const [cardSelectedColorMap, setCardSelectedColorMap] = useState<Record<string, string>>({});

  // Detail & Specification Modal State
  const [detailVariantId, setDetailVariantId] = useState<string | null>(null);
  const [detailSelectedImg, setDetailSelectedImg] = useState<string>('');

  // Initialize default colors for each variant card
  useEffect(() => {
    const initialMap: Record<string, string> = {};
    for (const v of motorVariants) {
      const vColors = motorColors.filter((c) => c.variantId === v.id);
      const defaultCol = vColors.find((c) => c.isDefault) || vColors[0];
      if (defaultCol) {
        initialMap[v.id] = defaultCol.id;
      }
    }
    setCardSelectedColorMap((prev) => ({ ...initialMap, ...prev }));
  }, [motorVariants, motorColors]);

  const activeVariants = useMemo(() => {
    return motorVariants.filter((v) => {
      if (!v.isActive) return false;
      if (selectedModelFilter !== 'ALL' && v.modelId !== selectedModelFilter) return false;
      if (searchQuery.trim()) {
        const model = motorModels.find((m) => m.id === v.modelId);
        const fullText = `${model?.name || ''} ${v.name} ${v.code || ''}`.toLowerCase();
        if (!fullText.includes(searchQuery.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [motorVariants, motorModels, selectedModelFilter, searchQuery]);

  // 2. CREDIT SIMULATION STATE (Requirements 7, 8, 11, 12, 13, 37, 41, 42)
  const [simModelId, setSimModelId] = useState<string>('');
  const [simVariantId, setSimVariantId] = useState<string>('');
  const [simColorId, setSimColorId] = useState<string>('');
  const [simDp, setSimDp] = useState<number>(0);
  const [simTenor, setSimTenor] = useState<number>(35);

  // Order Form State (Requirement 12)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerJob, setCustomerJob] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderFormError, setOrderFormError] = useState<string>('');
  const [orderSuccessInfo, setOrderSuccessInfo] = useState<string>('');

  // Initialize Credit Simulation defaults (Honda Beat -> Beat CBS -> Biru -> DP 2.000.000 -> 35 Bulan)
  useEffect(() => {
    if (!simModelId && motorModels.length > 0) {
      const defaultModel = motorModels.find((m) => m.id === 'model-beat') || motorModels[0];
      setSimModelId(defaultModel.id);
    }
  }, [motorModels, simModelId]);

  const simVariantsForModel = useMemo(
    () => motorVariants.filter((v) => v.modelId === simModelId && v.isActive),
    [motorVariants, simModelId]
  );

  useEffect(() => {
    if (simVariantsForModel.length > 0) {
      const exists = simVariantsForModel.some((v) => v.id === simVariantId);
      if (!exists) {
        setSimVariantId(simVariantsForModel[0].id);
      }
    } else {
      setSimVariantId('');
    }
  }, [simVariantsForModel, simVariantId]);

  const simColorsForVariant = useMemo(
    () => motorColors.filter((c) => c.variantId === simVariantId),
    [motorColors, simVariantId]
  );

  useEffect(() => {
    if (simColorsForVariant.length > 0) {
      const exists = simColorsForVariant.some((c) => c.id === simColorId);
      if (!exists) {
        const def = simColorsForVariant.find((c) => c.isDefault) || simColorsForVariant[0];
        setSimColorId(def.id);
      }
    } else {
      setSimColorId('');
    }
  }, [simColorsForVariant, simColorId]);

  // Available DPs for the selected Model + Variant (all colors in one type have identical DP, OTR, and Tenor installments)
  const availableDpsForSelection = useMemo(() => {
    const matchingRows = creditSimulations.filter(
      (cs) => cs.variantId === simVariantId && (!simModelId || cs.modelId === simModelId)
    );
    const uniqueDps = Array.from(new Set(matchingRows.map((r) => r.dp))).sort((a, b) => a - b);
    return uniqueDps;
  }, [creditSimulations, simModelId, simVariantId]);

  useEffect(() => {
    if (availableDpsForSelection.length > 0) {
      if (!availableDpsForSelection.includes(simDp)) {
        const preferred = availableDpsForSelection.includes(2000000)
          ? 2000000
          : availableDpsForSelection[0];
        setSimDp(preferred);
      }
    } else {
      setSimDp(0);
    }
  }, [availableDpsForSelection, simDp]);

  const activeTenors = useMemo(
    () => tenors.filter((t) => t.isActive).sort((a, b) => a.months - b.months),
    [tenors]
  );

  useEffect(() => {
    if (activeTenors.length > 0 && !activeTenors.some((t) => t.months === simTenor)) {
      const preferredTenor = activeTenors.find((t) => t.months === 35) || activeTenors[activeTenors.length - 1];
      setSimTenor(preferredTenor.months);
    }
  }, [activeTenors, simTenor]);

  // Exact Database Lookup for Credit Simulation (1 data per Type — independent of color)
  const simulationResult = useMemo(() => {
    if (!simModelId || !simVariantId || !simDp || !simTenor) {
      return {
        found: false,
        installment: 0,
        otr: 0,
        message: 'Silakan pilih Model, Tipe Motor, DP, dan Tenor untuk melihat hasil simulasi.',
      };
    }

    const matchedRow =
      creditSimulations.find(
        (cs) => cs.variantId === simVariantId && cs.dp === simDp
      ) || creditSimulations.find((cs) => cs.variantId === simVariantId);

    const tenorKey = String(simTenor);
    if (!matchedRow || !matchedRow.installments[tenorKey] || matchedRow.installments[tenorKey] <= 0) {
      return {
        found: false,
        installment: 0,
        otr: matchedRow?.otr || 0,
        message:
          'Simulasi untuk tipe motor tersebut belum tersedia. Silakan hubungi kami melalui WhatsApp.',
      };
    }

    return {
      found: true,
      installment: matchedRow.installments[tenorKey],
      otr: matchedRow.otr,
      message: '',
    };
  }, [creditSimulations, simModelId, simVariantId, simDp, simTenor]);

  const selectedSimModel = motorModels.find((m) => m.id === simModelId);
  const selectedSimVariant = motorVariants.find((v) => v.id === simVariantId);
  const selectedSimColor = motorColors.find((c) => c.id === simColorId);

  const handleJumpToSimulation = (variant: MotorVariant, color?: MotorColor) => {
    setSimModelId(variant.modelId);
    setSimVariantId(variant.id);
    if (color) {
      setSimColorId(color.id);
    }
    setDetailVariantId(null);
    const el = document.getElementById('simulasi');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenDetailModal = (variant: MotorVariant, currentColor?: MotorColor) => {
    setDetailVariantId(variant.id);
    if (currentColor) {
      setCardSelectedColorMap((prev) => ({ ...prev, [variant.id]: currentColor.id }));
      setDetailSelectedImg(currentColor.imageUrl);
    } else {
      const defCol = motorColors.find((c) => c.variantId === variant.id);
      setDetailSelectedImg(defCol?.imageUrl || '');
    }
  };

  const handleSubmitWhatsappOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFormError('');
    setOrderSuccessInfo('');

    if (!customerName.trim()) {
      setOrderFormError('Mohon isi Nama Lengkap Anda terlebih dahulu.');
      return;
    }
    if (!customerAddress.trim()) {
      setOrderFormError('Mohon isi Alamat Lengkap Anda (contoh: Parungkuda, Sukabumi).');
      return;
    }
    if (!customerJob.trim()) {
      setOrderFormError('Mohon isi Pekerjaan Anda (contoh: Karyawan / Wiraswasta).');
      return;
    }
    if (!simulationResult.found || !selectedSimModel || !selectedSimVariant) {
      setOrderFormError('Silakan pilih tipe motor dan simulasi kredit yang tersedia terlebih dahulu.');
      return;
    }

    const message = buildOrderWhatsappMessage({
      customerName,
      customerAddress,
      customerJob,
      customerPhone,
      motorModelName: selectedSimModel.name,
      motorVariantName: selectedSimVariant.name.replace(
        new RegExp(`^${selectedSimModel.name.replace(/^Honda\s+/i, '')}\\s+`, 'i'),
        ''
      ),
      otr: simulationResult.otr || selectedSimVariant.otrPrice,
      dp: simDp,
      tenor: simTenor,
      installment: simulationResult.installment,
    });

    const waUrl = buildWhatsappUrl(siteSettings.whatsappNumber, message);
    setOrderSuccessInfo('Membuka WhatsApp Marketing Zaenal Abidin (083806109569)...');
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Detail Modal Computed Entities
  const detailVariant = motorVariants.find((v) => v.id === detailVariantId);
  const detailModel = detailVariant
    ? motorModels.find((m) => m.id === detailVariant.modelId)
    : undefined;
  const detailColors = detailVariant
    ? motorColors.filter((c) => c.variantId === detailVariant.id)
    : [];
  const detailActiveColorId = detailVariant ? cardSelectedColorMap[detailVariant.id] : '';
  const detailActiveColor =
    detailColors.find((c) => c.id === detailActiveColorId) || detailColors[0];
  const detailSpec = detailVariant
    ? motorSpecs.find((s) => s.variantId === detailVariant.id)
    : undefined;
  const detailGalleryImages = detailVariant
    ? motorImages.filter((img) => img.variantId === detailVariant.id)
    : [];

  return (
    <>
      {/* ===================================================================
          SECTION: KATALOG MOTOR RESMI HONDA
      =================================================================== */}
      <section id="katalog" className="py-16 sm:py-24 bg-[#F9F9F8] border-b border-slate-200/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-semibold tracking-wider text-red-600 uppercase mb-2">
                01. Katalog Resmi Dealer Sukabumi
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
                Pilihan Motor Honda & Warna Spesifik
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
                Pilih model dan klik tombol warna pada kartu untuk melihat foto motor sesuai warna pilihan Anda, lengkap dengan spesifikasi dan simulasi kredit.
              </p>
            </div>

            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Beat, Scoopy, Vario, PCX..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
          </div>

          {/* Interactive Model Filter Tabs (Functional Segmented Buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-8 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedModelFilter('ALL')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedModelFilter === 'ALL'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Semua Model ({motorVariants.filter((v) => v.isActive).length})
            </button>
            {motorModels.map((model) => {
              const count = motorVariants.filter(
                (v) => v.modelId === model.id && v.isActive
              ).length;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelFilter(model.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedModelFilter === model.id
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {model.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Grid (3 columns desktop, 2 tablet, 1 mobile) */}
          {activeVariants.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <p className="text-base font-semibold text-slate-800">
                Tidak ditemukan tipe motor yang sesuai pencarian Anda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedModelFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Tampilkan Semua Motor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {activeVariants.map((variant) => {
                const model = motorModels.find((m) => m.id === variant.modelId);
                const vColors = motorColors.filter((c) => c.variantId === variant.id);
                const selectedColorId = cardSelectedColorMap[variant.id];
                const activeColor =
                  vColors.find((c) => c.id === selectedColorId) ||
                  vColors.find((c) => c.isDefault) ||
                  vColors[0];

                return (
                  <article
                    key={variant.id}
                    className="bg-white border border-slate-200/90 rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                  >
                    {/* Image Showcase (Switches dynamically when user clicks color) */}
                    <div
                      onClick={() => handleOpenDetailModal(variant, activeColor)}
                      className="relative aspect-4/3 w-full bg-[#F4F5F7] overflow-hidden cursor-pointer group"
                    >
                      <ResilientImage
                        key={activeColor?.imageUrl || variant.id}
                        src={activeColor?.imageUrl}
                        alt={`${model?.name || 'Honda'} ${variant.name} - Warna ${activeColor?.name || ''}`}
                        fallbackTitle={`${model?.name || 'Honda'} ${variant.name} (${activeColor?.name || 'Standar'})`}
                        className="w-full h-full object-contain p-2 group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Zero-Pill Unboxed Metadata with Typographic Separators */}
                        <div className="flex items-center flex-wrap gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                          <span>{model?.name || 'Honda'}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              variant.status === 'READY'
                                ? 'text-emerald-700 font-semibold'
                                : 'text-amber-700 font-semibold'
                            }
                          >
                            Status: {variant.status}
                          </span>
                          {variant.promoBadge && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-red-600 font-medium">{variant.promoBadge}</span>
                            </>
                          )}
                        </div>

                        {/* Variant Title */}
                        <h3 className="font-display text-lg sm:text-xl font-bold text-slate-950">
                          {variant.name}
                        </h3>

                        {/* Price OTR (Tabular Numerals) */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-xs text-slate-500">Harga OTR Sukabumi</span>
                          <span className="font-mono text-base sm:text-lg font-semibold text-slate-950 tabular-nums">
                            {formatRupiah(variant.otrPrice)}
                          </span>
                        </div>

                        {/* Interactive Color Selector per Variant */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-500">Pilih Warna (Klik untuk ubah foto):</span>
                            <span className="font-semibold text-slate-900">
                              {activeColor?.name || 'Standar'}
                            </span>
                          </div>
                          <div className="flex items-center flex-wrap gap-2">
                            {vColors.map((col) => {
                              const isSelected = activeColor?.id === col.id;
                              return (
                                <button
                                  key={col.id}
                                  type="button"
                                  onClick={() =>
                                    setCardSelectedColorMap((prev) => ({
                                      ...prev,
                                      [variant.id]: col.id,
                                    }))
                                  }
                                  title={`Pilih warna ${col.name}`}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                                    isSelected
                                      ? 'border-red-600 bg-red-50/70 text-slate-950 font-semibold shadow-2xs'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                    style={{ backgroundColor: col.hexCode }}
                                  />
                                  <span>{col.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Primary Card Actions (Requirement 39) */}
                      <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(variant, activeColor)}
                          className="px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-center"
                        >
                          Lihat Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJumpToSimulation(variant, activeColor)}
                          className="px-3.5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer text-center"
                        >
                          Simulasi Kredit
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================
          SECTION: SIMULASI KREDIT & FORM PESANAN WHATSAPP OTOMATIS
          (Requirements 7, 8, 11, 12, 13, 37, 41, 42)
      =================================================================== */}
      <section id="simulasi" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold tracking-wider text-red-600 uppercase mb-2">
              02. Simulasi Kredit & Pemesanan Online
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
              Cek Angsuran Sesuai Tipe Motor & Ajukan via WhatsApp
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Pilih model motor, tipe (misal CBS atau ABS), uang muka (DP), dan tenor cicilan. Semua warna pada satu tipe motor memiliki harga OTR, DP, dan angsuran yang sama.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Configurator & Visual Preview */}
            <div className="lg:col-span-7 bg-[#F9F9F8] border border-slate-200 rounded-xl p-5 sm:p-8 space-y-6">
              {/* Visual Motor Preview for Selected Type */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-full sm:w-56 aspect-4/3 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                  <ResilientImage
                    key={selectedSimColor?.imageUrl || simVariantId}
                    src={selectedSimColor?.imageUrl}
                    alt={`${selectedSimModel?.name || ''} ${selectedSimVariant?.name || ''}`}
                    fallbackTitle={`${selectedSimVariant?.name || 'Honda'}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 w-full">
                  <div className="text-xs text-slate-500 font-medium">
                    <span>{selectedSimModel?.name || 'Honda'}</span>
                    <span className="mx-1.5">·</span>
                    <span
                      className={
                        selectedSimVariant?.status === 'READY'
                          ? 'text-emerald-700 font-semibold'
                          : 'text-amber-700 font-semibold'
                      }
                    >
                      Status: {selectedSimVariant?.status || 'READY'}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-950 mt-0.5">
                    {selectedSimVariant?.name || 'Pilih Tipe Motor'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Berlaku untuk seluruh pilihan warna pada tipe <strong>{selectedSimVariant?.name || '-'}</strong>
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Harga OTR Resmi</span>
                    <span className="font-mono text-base font-bold text-slate-950 tabular-nums">
                      {formatRupiah(selectedSimVariant?.otrPrice || simulationResult.otr)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 1 & Step 2: Model & Tipe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    1. Pilih Model Motor
                  </label>
                  <select
                    value={simModelId}
                    onChange={(e) => setSimModelId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600 font-medium text-slate-900"
                  >
                    {motorModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    2. Pilih Tipe Motor (CBS / ABS / Varian)
                  </label>
                  <select
                    value={simVariantId}
                    onChange={(e) => setSimVariantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600 font-medium text-slate-900"
                  >
                    {simVariantsForModel.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {formatRupiah(v.otrPrice)} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 3: Pilihan Uang Muka (DP) */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    3. Pilih Uang Muka (DP) untuk Tipe {selectedSimVariant?.name || 'Ini'} ({availableDpsForSelection.length} Pilihan DP)
                  </label>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Semakin besar DP, semakin ringan angsuran/bulan
                  </span>
                </div>
                {availableDpsForSelection.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Data simulasi DP untuk tipe motor ini belum tersedia di database.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {availableDpsForSelection.map((dpVal) => {
                      const isSelected = simDp === dpVal;
                      return (
                        <button
                          key={dpVal}
                          type="button"
                          onClick={() => setSimDp(dpVal)}
                          className={`px-3.5 py-2.5 rounded-lg font-mono text-xs sm:text-sm font-semibold tabular-nums border transition-all cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'border-red-600 bg-slate-900 text-white shadow-xs'
                              : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {formatRupiah(dpVal)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 4: Pilih Tenor (Bulan) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  4. Pilih Tenor Cicilan
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {activeTenors.map((t) => {
                    const isSelected = simTenor === t.months;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSimTenor(t.months)}
                        className={`px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold tabular-nums border transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'border-red-600 bg-red-600 text-white shadow-xs'
                            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                        }`}
                      >
                        {t.months} bulan
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SINGLE SIMULATION RESULT BOX (1 result per Type, no Color column) */}
              <div className="bg-slate-950 text-white rounded-xl p-5 sm:p-6 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Hasil Simulasi Kredit
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    Tenor Terpilih: {simTenor} bulan
                  </span>
                </div>

                {simulationResult.found ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 pb-3 border-b border-slate-800/80">
                      <div>
                        <span className="block text-slate-400">Tipe Motor</span>
                        <strong className="text-white">{selectedSimVariant?.name}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400">Harga OTR</span>
                        <strong className="font-mono text-white tabular-nums">
                          {formatRupiah(simulationResult.otr || selectedSimVariant?.otrPrice)}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-slate-400">Uang Muka (DP)</span>
                        <strong className="font-mono text-white tabular-nums">
                          {formatRupiah(simDp)}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-slate-400">Tenor</span>
                        <strong className="font-mono text-white tabular-nums">
                          {simTenor} bulan
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
                      <span className="text-sm text-slate-300 font-medium">
                        Estimasi Angsuran Bulanan:
                      </span>
                      <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
                        {formatRupiah(simulationResult.installment)}{' '}
                        <span className="text-sm font-normal text-slate-400">/ bulan</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-amber-300 py-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium leading-relaxed">
                        {simulationResult.message}
                      </p>
                      <a
                        href={buildWhatsappUrl(
                          siteSettings.whatsappNumber,
                          `Assalamualaikum Pak Zaenal, saya ingin menanyakan simulasi kredit untuk ${selectedSimModel?.name || 'Honda'} ${selectedSimVariant?.name || ''} dengan DP ${formatRupiah(simDp)} dan tenor ${simTenor} bulan.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Tanyakan Tipe Ini via WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Form Pesanan Otomatis ke WhatsApp (Requirements 12 & 13) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-8">
              <div className="mb-5 pb-4 border-b border-slate-100">
                <h3 className="font-display text-xl font-bold text-slate-950">
                  Form Pengajuan / Pesan via WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Data motor, warna, DP, tenor, dan angsuran terisi otomatis dari pilihan simulasi Anda.
                </p>
              </div>

              <form onSubmit={handleSubmitWhatsappOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Andi"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Contoh: Parungkuda, Sukabumi"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pekerjaan <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerJob}
                    onChange={(e) => setCustomerJob(e.target.value)}
                    placeholder="Contoh: Karyawan / Wiraswasta"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Aktif (Opsional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* Auto-filled Summary Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5">
                  <div className="font-semibold text-slate-800 pb-1 border-b border-slate-200">
                    Ringkasan Pesanan Otomatis:
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipe Motor:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedSimModel?.name} — {selectedSimVariant?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Harga OTR:</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(simulationResult.otr || selectedSimVariant?.otrPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uang Muka (DP):</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(simDp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tenor:</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {simTenor} bulan
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-600 font-medium">Angsuran:</span>
                    <span className="font-mono font-bold text-red-600 tabular-nums">
                      {simulationResult.found
                        ? `${formatRupiah(simulationResult.installment)}/bulan`
                        : 'Hubungi via WhatsApp'}
                    </span>
                  </div>
                </div>

                {orderFormError && (
                  <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {orderFormError}
                  </p>
                )}

                {orderSuccessInfo && (
                  <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                    {orderSuccessInfo}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!simulationResult.found}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ajukan / Pesan via WhatsApp</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          MODAL: DETAIL MOTOR & SPESIFIKASI LENGKAP (Requirements 6 & 40)
      =================================================================== */}
      {detailVariant && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal Top Bar */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs px-5 sm:px-7 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  {detailModel?.name} · Status: {detailVariant.status}
                </p>
                <h3 className="font-display text-lg sm:text-xl font-bold text-slate-950">
                  {detailVariant.name} — Spesifikasi & Detail Unit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailVariantId(null)}
                aria-label="Tutup detail motor"
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-7 space-y-8">
              {/* Top Contiguous Product Module */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Gallery & Color Image */}
                <div className="md:col-span-7 space-y-3">
                  <div className="aspect-4/3 bg-[#F4F5F7] rounded-xl overflow-hidden border border-slate-200">
                    <ResilientImage
                      src={detailSelectedImg || detailActiveColor?.imageUrl}
                      alt={`${detailVariant.name} - ${detailActiveColor?.name || ''}`}
                      fallbackTitle={`${detailVariant.name} (${detailActiveColor?.name || ''})`}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  {/* Thumbnail Selector (Colors + Extra Gallery Images) */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {detailColors.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          setCardSelectedColorMap((prev) => ({
                            ...prev,
                            [detailVariant.id]: col.id,
                          }));
                          setDetailSelectedImg(col.imageUrl);
                        }}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer bg-slate-50 ${
                          detailActiveColor?.id === col.id &&
                          detailSelectedImg === col.imageUrl
                            ? 'border-red-600'
                            : 'border-slate-200'
                        }`}
                        title={col.name}
                      >
                        <ResilientImage
                          src={col.imageUrl}
                          alt={col.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    {detailGalleryImages.map((gImg) => (
                      <button
                        key={gImg.id}
                        type="button"
                        onClick={() => setDetailSelectedImg(gImg.imageUrl)}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer bg-slate-50 ${
                          detailSelectedImg === gImg.imageUrl
                            ? 'border-red-600'
                            : 'border-slate-200'
                        }`}
                        title={gImg.caption}
                      >
                        <ResilientImage
                          src={gImg.imageUrl}
                          alt={gImg.caption}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variant Summary & CTA */}
                <div className="md:col-span-5 space-y-4 bg-[#F9F9F8] p-5 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      <span>{detailModel?.brand || 'Honda'}</span>
                      <span className="mx-1.5">·</span>
                      <span
                        className={
                          detailVariant.status === 'READY'
                            ? 'text-emerald-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {detailVariant.status}
                      </span>
                    </div>
                    <h4 className="font-display text-2xl font-bold text-slate-950 mt-1">
                      {detailVariant.name}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      {detailModel?.description}
                    </p>
                  </div>

                  <div className="py-3 border-y border-slate-200 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Harga OTR Sukabumi</span>
                    <span className="font-mono text-xl font-bold text-slate-950 tabular-nums">
                      {formatRupiah(detailVariant.otrPrice)}
                    </span>
                  </div>

                  {detailVariant.promoBadge && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 font-medium">
                      Promo Aktif: {detailVariant.promoBadge}
                    </div>
                  )}

                  {/* Color Swatches */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-2">
                      Pilihan Warna ({detailActiveColor?.name}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {detailColors.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            setCardSelectedColorMap((prev) => ({
                              ...prev,
                              [detailVariant.id]: col.id,
                            }));
                            setDetailSelectedImg(col.imageUrl);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                            detailActiveColor?.id === col.id
                              ? 'border-red-600 bg-red-600 text-white font-semibold'
                              : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/60"
                            style={{ backgroundColor: col.hexCode }}
                          />
                          <span>{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleJumpToSimulation(detailVariant, detailActiveColor)
                      }
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Hitung Simulasi Kredit Tipe Ini</span>
                    </button>

                    <a
                      href={buildWhatsappUrl(
                        siteSettings.whatsappNumber,
                        `Assalamualaikum Pak Zaenal, saya ingin menanyakan ketersediaan unit ${detailModel?.name || 'Honda'} ${detailVariant.name} warna ${detailActiveColor?.name || ''} (OTR ${formatRupiah(detailVariant.otrPrice)}).`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Tanya Unit Ini via WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Table (Requirement 6) */}
              <div>
                <h4 className="font-display text-base sm:text-lg font-bold text-slate-950 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>Spesifikasi Teknis — {detailVariant.name}</span>
                </h4>
                {detailSpec ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <dl className="divide-y divide-slate-200 text-xs sm:text-sm">
                      {[
                        { label: 'Tipe Mesin', value: detailSpec.engineType },
                        { label: 'Kapasitas Mesin', value: detailSpec.displacement },
                        { label: 'Sistem Transmisi', value: detailSpec.transmission },
                        { label: 'Daya Maksimum', value: detailSpec.maxPower },
                        { label: 'Torsi Maksimum', value: detailSpec.maxTorque },
                        { label: 'Dimensi (P x L x T)', value: detailSpec.dimension },
                        { label: 'Berat Kosong', value: detailSpec.weight },
                        { label: 'Kapasitas Tangki BBM', value: detailSpec.tankCapacity },
                        { label: 'Tipe Rangka', value: detailSpec.frameType },
                        { label: 'Sistem Pengereman', value: detailSpec.brakeSystem },
                        { label: 'Ukuran Ban Depan & Belakang', value: detailSpec.tireSize },
                        { label: 'Tipe Aki / Baterai', value: detailSpec.batteryType },
                        { label: 'Fitur Unggulan', value: detailSpec.features },
                        { label: 'Garansi & Keterangan', value: detailSpec.extraNotes },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="grid grid-cols-1 sm:grid-cols-3 px-4 py-3 bg-white odd:bg-slate-50/70"
                        >
                          <dt className="font-semibold text-slate-600">{row.label}</dt>
                          <dd className="sm:col-span-2 text-slate-900 mt-0.5 sm:mt-0">
                            {row.value || '-'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Spesifikasi belum diatur untuk tipe ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
