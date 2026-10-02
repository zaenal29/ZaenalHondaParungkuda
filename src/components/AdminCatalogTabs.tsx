import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import {
  PublicBootstrapData,
  MotorModel,
  MotorVariant,
  MotorColor,
  MotorSpec,
  CreditSimulation,
  ExcelImportResult,
} from '../types/index.ts';
import { formatRupiah } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

export type CatalogAdminTab =
  | 'katalog-motor'
  | 'tipe-varian'
  | 'warna-foto'
  | 'harga-otr'
  | 'data-kredit'
  | 'import-excel';

interface AdminCatalogTabsProps {
  activeTab: CatalogAdminTab;
  data: PublicBootstrapData;
  token: string;
  onRefresh: () => Promise<void>;
  onUploadImageFile: (file: File) => Promise<string | null>;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminCatalogTabs: React.FC<AdminCatalogTabsProps> = ({
  activeTab,
  data,
  token,
  onRefresh,
  onUploadImageFile,
  notify,
}) => {
  const {
    tenors,
    motorModels,
    motorVariants,
    motorColors,
    motorSpecs,
    creditSimulations,
  } = data;

  const [saving, setSaving] = useState(false);

  // -------------------------------------------------------------------
  // 1. STATE FOR KATALOG MOTOR (MODELS + JUMLAH TIPE & NAMA TIPE)
  // -------------------------------------------------------------------
  const [editingModel, setEditingModel] = useState<Partial<MotorModel>>({
    name: '',
    category: 'Matic',
    tagline: '',
    description: '',
    isFeatured: true,
  });
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelVariantsForm, setModelVariantsForm] = useState<
    Array<{ id?: string; name: string; otrPrice?: number }>
  >([{ name: '', otrPrice: 19000000 }]);

  // Inline editor state for "Jumlah Tipe" column on existing motor rows
  const [inlineEditingTypeModelId, setInlineEditingTypeModelId] = useState<string | null>(null);
  const [inlineVariantsForm, setInlineVariantsForm] = useState<
    Array<{ id?: string; name: string; otrPrice?: number }>
  >([]);

  const handleModelVariantCountChange = (newCountRaw: number) => {
    const count = Math.max(1, Math.min(20, Number(newCountRaw) || 1));
    setModelVariantsForm((prev) => {
      if (count === prev.length) return prev;
      if (count < prev.length) return prev.slice(0, count);
      const added = Array.from({ length: count - prev.length }, () => ({
        name: '',
        otrPrice: prev[prev.length - 1]?.otrPrice || 19000000,
      }));
      return [...prev, ...added];
    });
  };

  const handleInlineVariantCountChange = (newCountRaw: number) => {
    const count = Math.max(1, Math.min(20, Number(newCountRaw) || 1));
    setInlineVariantsForm((prev) => {
      if (count === prev.length) return prev;
      if (count < prev.length) return prev.slice(0, count);
      const added = Array.from({ length: count - prev.length }, () => ({
        name: '',
        otrPrice: prev[prev.length - 1]?.otrPrice || 19000000,
      }));
      return [...prev, ...added];
    });
  };

  // -------------------------------------------------------------------
  // 2. STATE FOR TIPE & VARIAN + SPESIFIKASI
  // -------------------------------------------------------------------
  const [selectedModelForVar, setSelectedModelForVar] = useState<string>(
    motorModels[0]?.id || ''
  );
  const [editingVariant, setEditingVariant] = useState<Partial<MotorVariant>>({
    modelId: motorModels[0]?.id || '',
    name: '',
    code: '',
    otrPrice: 19000000,
    status: 'READY',
    promoBadge: '',
  });
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [specVariantId, setSpecVariantId] = useState<string | null>(null);
  const [specForm, setSpecForm] = useState<Partial<MotorSpec>>({});

  // -------------------------------------------------------------------
  // 3. STATE FOR WARNA & FOTO
  // -------------------------------------------------------------------
  const [selectedVariantForColor, setSelectedVariantForColor] = useState<string>(
    motorVariants[0]?.id || ''
  );
  const [colorViewMode, setColorViewMode] = useState<'selected' | 'all'>('selected');
  const [uploadingColorId, setUploadingColorId] = useState<string | null>(null);
  const [uploadingFormPhoto, setUploadingFormPhoto] = useState<boolean>(false);
  const [colorForm, setColorForm] = useState<Partial<MotorColor>>({
    name: '',
    hexCode: '#DC2626',
    secondaryHexCode: '#18181B',
    imageUrl: '',
    isDefault: false,
  });
  const [editingColorId, setEditingColorId] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // 4. STATE FOR DATA KREDIT & TENOR (MULTIPLE DP OPTIONS UP TO 10+ ROWS PER TIPE MOTOR)
  // -------------------------------------------------------------------
  const [creditFilterVariantId, setCreditFilterVariantId] = useState<string>('');
  const [selectedCreditVariantId, setSelectedCreditVariantId] = useState<string>(
    motorVariants[0]?.id || ''
  );
  const [creditVariantOtr, setCreditVariantOtr] = useState<number>(
    motorVariants[0]?.otrPrice || 19000000
  );
  const [creditDpRows, setCreditDpRows] = useState<
    Array<{
      id?: string;
      dp: number;
      installments: Record<string, number>;
    }>
  >([]);

  // Inline single-row editing state in the bottom Credit Table
  const [inlineEditingCreditId, setInlineEditingCreditId] = useState<string | null>(null);
  const [inlineCreditRow, setInlineCreditRow] = useState<{
    id: string;
    variantId: string;
    dp: number;
    otr: number;
    installments: Record<string, number>;
  } | null>(null);

  // Tenor management & inline edit state
  const [newTenorMonths, setNewTenorMonths] = useState<string>('');
  const [editingTenorId, setEditingTenorId] = useState<string | null>(null);
  const [editingTenorMonths, setEditingTenorMonths] = useState<string>('');

  const computeAutoInstallmentsForDp = (otrVal: number, dpVal: number): Record<string, number> => {
    const safeOtr = Number(otrVal) > 0 ? Number(otrVal) : 19000000;
    const safeDp = Number(dpVal) > 0 ? Number(dpVal) : 2000000;
    const principal = Math.max(safeOtr - safeDp, 3500000);
    const result: Record<string, number> = {};
    const sortedTenors = [...tenors].sort((a, b) => a.months - b.months);
    const tenorMonthsList =
      sortedTenors.length > 0 ? sortedTenors.map((t) => t.months) : [11, 17, 23, 29, 35];

    for (const m of tenorMonthsList) {
      // Rate factor scales smoothly with tenor months; larger DP -> smaller principal -> smaller installment
      const factor = 1 + m * 0.016;
      const monthly = Math.round((principal * factor) / m / 1000) * 1000;
      result[String(m)] = Math.max(monthly, 250000);
    }
    return result;
  };

  const loadVariantIntoCreditEditor = (variantId: string, appendNewRow = false) => {
    const v = motorVariants.find((item) => item.id === variantId);
    const matchingSims = creditSimulations
      .filter((cs) => cs.variantId === variantId)
      .sort((a, b) => a.dp - b.dp);

    const resolvedOtr = matchingSims[0]?.otr || v?.otrPrice || 19000000;
    setSelectedCreditVariantId(variantId);
    setCreditVariantOtr(resolvedOtr);

    let rows: Array<{ id?: string; dp: number; installments: Record<string, number> }> = [];
    if (matchingSims.length > 0) {
      rows = matchingSims.map((sim) => ({
        id: sim.id,
        dp: sim.dp,
        installments: { ...sim.installments },
      }));
    } else {
      const baseDp =
        resolvedOtr <= 21000000 ? 2000000 : resolvedOtr <= 26000000 ? 2500000 : 3000000;
      rows = [
        {
          dp: baseDp,
          installments: computeAutoInstallmentsForDp(resolvedOtr, baseDp),
        },
      ];
    }

    if (appendNewRow && rows.length < 10) {
      const lastDp = rows[rows.length - 1]?.dp || 2000000;
      const nextDp = lastDp + 500000;
      rows = [
        ...rows,
        {
          dp: nextDp,
          installments: computeAutoInstallmentsForDp(resolvedOtr, nextDp),
        },
      ];
    }

    setCreditDpRows(rows);
  };

  useEffect(() => {
    const targetVarId =
      selectedCreditVariantId && motorVariants.some((v) => v.id === selectedCreditVariantId)
        ? selectedCreditVariantId
        : motorVariants[0]?.id || '';
    if (targetVarId) {
      loadVariantIntoCreditEditor(targetVarId, false);
    }
  }, [selectedCreditVariantId, creditSimulations, motorVariants]);

  const handleSetCreditDpRowCount = (countInput: number) => {
    const count = Math.max(1, Math.min(10, Math.round(countInput || 1)));
    setCreditDpRows((prev) => {
      if (count === prev.length) return prev;
      if (count < prev.length) {
        return prev.slice(0, count);
      }
      const next = [...prev];
      while (next.length < count) {
        const lastDp = next[next.length - 1]?.dp || 1500000;
        const newDp = lastDp + 500000;
        next.push({
          dp: newDp,
          installments: computeAutoInstallmentsForDp(creditVariantOtr, newDp),
        });
      }
      return next;
    });
  };

  const handleAddCreditDpRow = () => {
    if (creditDpRows.length >= 10) {
      notify('Maksimal 10 baris pilihan DP per tipe motor.', 'error');
      return;
    }
    handleSetCreditDpRowCount(creditDpRows.length + 1);
  };

  const handleRemoveCreditDpRow = (rowIndex: number) => {
    if (creditDpRows.length <= 1) return;
    setCreditDpRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  // -------------------------------------------------------------------
  // 5. STATE FOR IMPORT EXCEL
  // -------------------------------------------------------------------
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelResult, setExcelResult] = useState<ExcelImportResult | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // ===================================================================
  // HANDLERS: MODELS (WITH JUMLAH TIPE & NAMA TIPE)
  // ===================================================================
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedVariants = modelVariantsForm.map((v, idx) => ({
      id: v.id,
      name: String(v.name || '').trim() || `${editingModel.name || 'Honda'} Tipe ${idx + 1}`,
      otrPrice: Number(v.otrPrice) > 0 ? Number(v.otrPrice) : 19000000,
    }));

    setSaving(true);
    try {
      const url = editingModelId
        ? `/api/admin/models/${editingModelId}`
        : '/api/admin/models';
      const method = editingModelId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify({
          ...editingModel,
          variants: cleanedVariants,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan model');
      notify(json.message || 'Model beserta tipe berhasil disimpan.');
      setEditingModel({
        name: '',
        category: 'Matic',
        tagline: '',
        description: '',
        isFeatured: true,
      });
      setEditingModelId(null);
      setModelVariantsForm([{ name: '', otrPrice: 19000000 }]);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInlineModelVariants = async (model: MotorModel) => {
    const cleanedVariants = inlineVariantsForm.map((v, idx) => ({
      id: v.id,
      name: String(v.name || '').trim() || `${model.name} Tipe ${idx + 1}`,
      otrPrice: Number(v.otrPrice) > 0 ? Number(v.otrPrice) : 19000000,
    }));

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/models/${model.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          ...model,
          variants: cleanedVariants,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui jumlah tipe');
      notify(`Jumlah & nama tipe untuk ${model.name} berhasil disimpan permanen.`);
      setInlineEditingTypeModelId(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/models/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus model');
      notify(json.message);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===================================================================
  // HANDLERS: VARIANTS & SPECS
  // ===================================================================
  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...editingVariant,
        modelId: editingVariant.modelId || selectedModelForVar || motorModels[0]?.id,
      };
      const url = editingVariantId
        ? `/api/admin/variants/${editingVariantId}`
        : '/api/admin/variants';
      const method = editingVariantId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan tipe');
      notify(json.message);
      setEditingVariant({
        modelId: payload.modelId,
        name: '',
        code: '',
        otrPrice: 19000000,
        status: 'READY',
        promoBadge: '',
      });
      setEditingVariantId(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/variants/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus tipe');
      notify(json.message);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSpecEditor = (variantId: string) => {
    setSpecVariantId(variantId);
    const existing = motorSpecs.find((s) => s.variantId === variantId);
    setSpecForm(
      existing || {
        variantId,
        engineType: '',
        displacement: '',
        transmission: '',
        maxPower: '',
        maxTorque: '',
        dimension: '',
        weight: '',
        tankCapacity: '',
        frameType: '',
        brakeSystem: '',
        tireSize: '',
        batteryType: '',
        features: '',
        extraNotes: '',
      }
    );
  };

  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specVariantId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/specs/${specVariantId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(specForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan spesifikasi');
      notify(json.message);
      setSpecVariantId(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===================================================================
  // HANDLERS: COLORS & PHOTOS
  // ===================================================================
  const handleSaveColor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...colorForm,
        variantId: selectedVariantForColor || motorVariants[0]?.id,
      };
      const url = editingColorId
        ? `/api/admin/colors/${editingColorId}`
        : '/api/admin/colors';
      const method = editingColorId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan warna');
      notify(json.message);
      setColorForm({
        name: '',
        hexCode: '#DC2626',
        secondaryHexCode: '#18181B',
        imageUrl: '',
        isDefault: false,
      });
      setEditingColorId(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColor = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/colors/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus warna');
      notify(json.message);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDirectUpdateColorPhoto = async (col: MotorColor, file: File) => {
    setUploadingColorId(col.id);
    setSaving(true);
    try {
      const uploadedUrl = await onUploadImageFile(file);
      if (!uploadedUrl) return;
      const res = await fetch(`/api/admin/colors/${col.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          ...col,
          imageUrl: uploadedUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan foto warna');
      if (editingColorId === col.id) {
        setColorForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      }
      notify(`Foto warna ${col.name} berhasil diganti dan disimpan permanen.`);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setUploadingColorId(null);
      setSaving(false);
    }
  };

  // ===================================================================
  // HANDLERS: QUICK OTR & STATUS UPDATE
  // ===================================================================
  const handleQuickUpdateVariant = async (
    variant: MotorVariant,
    newOtr: number,
    newStatus: 'READY' | 'INDENT',
    newPromo: string
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/variants/${variant.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          otrPrice: newOtr,
          status: newStatus,
          promoBadge: newPromo,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui harga OTR');
      notify(`Harga OTR & status ${variant.name} berhasil diperbarui.`);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===================================================================
  // HANDLERS: CREDITS & TENORS (MULTIPLE DP OPTIONS UP TO 10 ROWS PER TIPE MOTOR)
  // ===================================================================
  const handleSaveVariantCreditsBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditVariantId) {
      notify('Pilih Tipe Motor terlebih dahulu.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/credits/variant/${selectedCreditVariantId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          otr: Number(creditVariantOtr),
          dpRows: creditDpRows,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan pilihan DP');
      notify(json.message || 'Semua pilihan DP & angsuran berhasil disimpan permanen.');
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInlineCreditRow = async () => {
    if (!inlineCreditRow) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/credits/${inlineCreditRow.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          variantId: inlineCreditRow.variantId,
          dp: Number(inlineCreditRow.dp),
          otr: Number(inlineCreditRow.otr),
          installments: inlineCreditRow.installments,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui baris pilihan DP');
      notify(json.message || 'Baris pilihan DP & angsuran berhasil diperbarui permanen.');
      setInlineEditingCreditId(null);
      setInlineCreditRow(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCredit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/credits/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus data kredit');
      notify(json.message);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTenor = async (e: React.FormEvent) => {
    e.preventDefault();
    const months = Number(newTenorMonths);
    if (!months || months <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tenors', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ months, label: `${months} Bulan` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menambah tenor');
      notify(json.message);
      setNewTenorMonths('');
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTenor = async (tenorId: string) => {
    const months = Number(editingTenorMonths);
    if (!months || months <= 0 || months > 120) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenors/${tenorId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ months, label: `${months} Bulan` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui tenor');
      notify(json.message || `Lama tenor berhasil diubah menjadi ${months} bulan.`);
      setEditingTenorId(null);
      setEditingTenorMonths('');
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTenor = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenors/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus tenor');
      notify(json.message);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===================================================================
  // HANDLERS: EXCEL IMPORT & BACKUP
  // ===================================================================
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelImporting(true);
    setExcelResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = String(reader.result || '');
        const res = await fetch('/api/admin/credits/import-excel', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ base64Data }),
        });
        const result: ExcelImportResult = await res.json();
        setExcelResult(result);
        if (result.success) {
          notify(result.message);
          await onRefresh();
        } else {
          notify(result.message || 'Format Excel tidak sesuai template.', 'error');
        }
      } catch {
        notify('Terjadi kesalahan saat mengimpor file Excel.', 'error');
      } finally {
        setExcelImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadBackupExcel = async () => {
    try {
      const res = await fetch('/api/admin/credits/export-excel', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal mengunduh backup Excel');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Backup_Katalog_Kredit_Honda_Parungkuda.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      notify('File Backup Excel berhasil diunduh.');
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  // ===================================================================
  // RENDER BY ACTIVE TAB
  // ===================================================================
  if (activeTab === 'katalog-motor') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-950">
            Kelola Model Motor Honda & Jumlah Tipe
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Tambah atau edit model motor Honda beserta jumlah tipe dan nama masing-masing tipe (contoh: CBS, CBS ISS, Smartkey, ABS).
          </p>
        </div>

        <form
          onSubmit={handleSaveModel}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
        >
          <h3 className="font-display text-base font-bold text-slate-900">
            {editingModelId ? 'Edit Model Motor & Jumlah Tipe' : 'Tambah Model Motor Baru'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Model Motor *
              </label>
              <input
                type="text"
                required
                value={editingModel.name || ''}
                onChange={(e) =>
                  setEditingModel({ ...editingModel, name: e.target.value })
                }
                placeholder="Contoh: Honda Beat / Honda Stylo"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={editingModel.category || 'Matic'}
                onChange={(e) =>
                  setEditingModel({
                    ...editingModel,
                    category: e.target.value as any,
                  })
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Matic">Matic</option>
                <option value="Sport">Sport</option>
                <option value="Cub / Bebek">Cub / Bebek</option>
                <option value="BigBike">BigBike</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Tipe Model Motor *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleModelVariantCountChange(modelVariantsForm.length - 1)}
                  className="px-3 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={modelVariantsForm.length}
                  onChange={(e) => handleModelVariantCountChange(Number(e.target.value))}
                  className="w-20 text-center px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleModelVariantCountChange(modelVariantsForm.length + 1)}
                  className="px-3 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                >
                  +
                </button>
                <span className="text-xs font-medium text-slate-500">Tipe</span>
              </div>
            </div>

            {/* Dynamic Inputs for Each Type Name & OTR */}
            <div className="sm:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Daftar Nama Tipe Motor ({modelVariantsForm.length} Tipe) *
                </label>
                <button
                  type="button"
                  onClick={() => handleModelVariantCountChange(modelVariantsForm.length + 1)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  + Tambah Kolom Tipe
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modelVariantsForm.map((vItem, idx) => (
                  <div
                    key={vItem.id || `new-var-${idx}`}
                    className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                  >
                    <div className="flex-1">
                      <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Nama Tipe ke-{idx + 1} *
                      </span>
                      <input
                        type="text"
                        required
                        value={vItem.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModelVariantsForm((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                          );
                        }}
                        placeholder={`Contoh: ${editingModel.name || 'Beat'} ${idx === 0 ? 'CBS' : idx === 1 ? 'ABS / Street' : `Tipe ${idx + 1}`}`}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Harga OTR (Rp)
                      </span>
                      <input
                        type="number"
                        value={vItem.otrPrice || 19000000}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setModelVariantsForm((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, otrPrice: val } : item))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                      />
                    </div>
                    {modelVariantsForm.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setModelVariantsForm((prev) => prev.filter((_, i) => i !== idx))
                        }
                        title="Hapus tipe ini"
                        className="self-end sm:self-center mt-1 sm:mt-4 p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline Singkat
              </label>
              <input
                type="text"
                value={editingModel.tagline || ''}
                onChange={(e) =>
                  setEditingModel({ ...editingModel, tagline: e.target.value })
                }
                placeholder="Contoh: Skutik Irit & Lincah Favorit Keluarga"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Model
              </label>
              <textarea
                rows={2}
                value={editingModel.description || ''}
                onChange={(e) =>
                  setEditingModel({
                    ...editingModel,
                    description: e.target.value,
                  })
                }
                placeholder="Deskripsi keunggulan model motor..."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingModelId ? 'Simpan Perubahan Model & Tipe' : 'Tambah Model & Tipe'}</span>
            </button>
            {editingModelId && (
              <button
                type="button"
                onClick={() => {
                  setEditingModelId(null);
                  setEditingModel({
                    name: '',
                    category: 'Matic',
                    tagline: '',
                    description: '',
                    isFeatured: true,
                  });
                  setModelVariantsForm([{ name: '', otrPrice: 19000000 }]);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Nama Model</th>
                <th className="py-3 px-4 font-semibold">Kategori</th>
                <th className="py-3 px-4 font-semibold">Jumlah Tipe & Daftar Tipe (Bisa Diedit)</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {motorModels.map((model) => {
                const modelVars = motorVariants.filter(
                  (v) => v.modelId === model.id
                );
                const varCount = modelVars.length;
                const isInlineEditing = inlineEditingTypeModelId === model.id;

                return (
                  <React.Fragment key={model.id}>
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-950">{model.name}</div>
                        <div className="text-xs text-slate-500">{model.tagline}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 align-top">{model.category}</td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {varCount} Tipe
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isInlineEditing) {
                                setInlineEditingTypeModelId(null);
                              } else {
                                setInlineEditingTypeModelId(model.id);
                                setInlineVariantsForm(
                                  modelVars.length > 0
                                    ? modelVars.map((v) => ({
                                        id: v.id,
                                        name: v.name,
                                        otrPrice: v.otrPrice,
                                      }))
                                    : [{ name: `${model.name} Standar`, otrPrice: 19000000 }]
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isInlineEditing ? 'Tutup Edit Tipe' : 'Edit Jumlah Tipe'}</span>
                          </button>
                        </div>
                        {modelVars.length > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            {modelVars.map((v) => v.name).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap align-top">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingModelId(model.id);
                            setEditingModel(model);
                            setModelVariantsForm(
                              modelVars.length > 0
                                ? modelVars.map((v) => ({
                                    id: v.id,
                                    name: v.name,
                                    otrPrice: v.otrPrice,
                                  }))
                                : [{ name: '', otrPrice: 19000000 }]
                            );
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModel(model.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                    {isInlineEditing && (
                      <tr className="bg-slate-50/90">
                        <td colSpan={4} className="p-4 border-t border-slate-200">
                          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                              <div>
                                <h4 className="font-display text-sm font-bold text-slate-950">
                                  Edit Jumlah Tipe & Nama Tipe — {model.name}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Ubah jumlah tipe atau ganti nama tipe motor di bawah ini lalu klik Simpan.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700">
                                  Jumlah Tipe:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInlineVariantCountChange(inlineVariantsForm.length - 1)
                                  }
                                  className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={inlineVariantsForm.length}
                                  onChange={(e) =>
                                    handleInlineVariantCountChange(Number(e.target.value))
                                  }
                                  className="w-16 text-center px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleInlineVariantCountChange(inlineVariantsForm.length + 1)
                                  }
                                  className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {inlineVariantsForm.map((vItem, idx) => (
                                <div
                                  key={vItem.id || `inline-var-${idx}`}
                                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-slate-600">
                                      Nama Tipe ke-{idx + 1}
                                    </span>
                                    {inlineVariantsForm.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setInlineVariantsForm((prev) =>
                                            prev.filter((_, i) => i !== idx)
                                          )
                                        }
                                        className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                                      >
                                        Hapus
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    value={vItem.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setInlineVariantsForm((prev) =>
                                        prev.map((item, i) =>
                                          i === idx ? { ...item, name: val } : item
                                        )
                                      );
                                    }}
                                    placeholder={`Contoh: ${model.name} Tipe ${idx + 1}`}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                                  />
                                  <div>
                                    <span className="block text-[10px] text-slate-500 mb-0.5">
                                      Harga OTR (Rp)
                                    </span>
                                    <input
                                      type="number"
                                      value={vItem.otrPrice || 19000000}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setInlineVariantsForm((prev) =>
                                          prev.map((item, i) =>
                                            i === idx ? { ...item, otrPrice: val } : item
                                          )
                                        );
                                      }}
                                      className="w-full px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setInlineEditingTypeModelId(null)}
                                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleSaveInlineModelVariants(model)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan Jumlah & Nama Tipe</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'tipe-varian') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-950">
            Kelola Tipe / Varian & Spesifikasi Teknis
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Atur tipe motor (contoh: Beat CBS, Beat CBS ISS, Beat Smartkey, Beat Street), status READY/INDENT, harga OTR, serta spesifikasi lengkapnya.
          </p>
        </div>

        <form
          onSubmit={handleSaveVariant}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
        >
          <h3 className="font-display text-base font-bold text-slate-900">
            {editingVariantId ? 'Edit Tipe / Varian' : 'Tambah Tipe / Varian Baru'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Induk *
              </label>
              <select
                value={editingVariant.modelId || selectedModelForVar}
                onChange={(e) => {
                  setSelectedModelForVar(e.target.value);
                  setEditingVariant({ ...editingVariant, modelId: e.target.value });
                }}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {motorModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Tipe / Varian *
              </label>
              <input
                type="text"
                required
                value={editingVariant.name || ''}
                onChange={(e) =>
                  setEditingVariant({ ...editingVariant, name: e.target.value })
                }
                placeholder="Contoh: Beat CBS"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga OTR (Angka) *
              </label>
              <input
                type="number"
                required
                value={editingVariant.otrPrice || ''}
                onChange={(e) =>
                  setEditingVariant({
                    ...editingVariant,
                    otrPrice: Number(e.target.value),
                  })
                }
                placeholder="19000000"
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Ketersediaan
              </label>
              <select
                value={editingVariant.status || 'READY'}
                onChange={(e) =>
                  setEditingVariant({
                    ...editingVariant,
                    status: e.target.value as 'READY' | 'INDENT',
                  })
                }
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="READY">READY</option>
                <option value="INDENT">INDENT</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Info Promo Singkat pada Kartu
              </label>
              <input
                type="text"
                value={editingVariant.promoBadge || ''}
                onChange={(e) =>
                  setEditingVariant({
                    ...editingVariant,
                    promoBadge: e.target.value,
                  })
                }
                placeholder="Contoh: DP Mulai Rp 1,5 Juta · Potongan Tenor"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingVariantId ? 'Simpan Perubahan Tipe' : 'Tambah Tipe Motor'}</span>
            </button>
            {editingVariantId && (
              <button
                type="button"
                onClick={() => {
                  setEditingVariantId(null);
                  setEditingVariant({
                    modelId: selectedModelForVar,
                    name: '',
                    code: '',
                    otrPrice: 19000000,
                    status: 'READY',
                    promoBadge: '',
                  });
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Modal / Inline Editor for Specifications */}
        {specVariantId && (
          <form
            onSubmit={handleSaveSpec}
            className="bg-slate-900 text-white border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-base font-bold">
                Edit Spesifikasi Teknis:{' '}
                {motorVariants.find((v) => v.id === specVariantId)?.name}
              </h3>
              <button
                type="button"
                onClick={() => setSpecVariantId(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {[
                { key: 'engineType', label: 'Tipe Mesin' },
                { key: 'displacement', label: 'Kapasitas Mesin' },
                { key: 'transmission', label: 'Transmisi' },
                { key: 'maxPower', label: 'Daya Maksimum' },
                { key: 'maxTorque', label: 'Torsi Maksimum' },
                { key: 'dimension', label: 'Dimensi' },
                { key: 'weight', label: 'Berat' },
                { key: 'tankCapacity', label: 'Kapasitas Tangki' },
                { key: 'frameType', label: 'Tipe Rangka' },
                { key: 'brakeSystem', label: 'Sistem Pengereman' },
                { key: 'tireSize', label: 'Ukuran Ban' },
                { key: 'batteryType', label: 'Aki / Baterai' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(specForm as any)[field.key] || ''}
                    onChange={(e) =>
                      setSpecForm({ ...specForm, [field.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              ))}
              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">
                  Fitur Utama
                </label>
                <input
                  type="text"
                  value={specForm.features || ''}
                  onChange={(e) =>
                    setSpecForm({ ...specForm, features: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">
                  Garansi & Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={specForm.extraNotes || ''}
                  onChange={(e) =>
                    setSpecForm({ ...specForm, extraNotes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSpecVariantId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Simpan Spesifikasi
              </button>
            </div>
          </form>
        )}

        {/* Variants Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Model</th>
                <th className="py-3 px-4 font-semibold">Nama Tipe</th>
                <th className="py-3 px-4 font-semibold">Harga OTR</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {motorVariants.map((variant) => {
                const model = motorModels.find((m) => m.id === variant.modelId);
                return (
                  <tr key={variant.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-600">{model?.name}</td>
                    <td className="py-3 px-4 font-bold text-slate-950">
                      {variant.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold tabular-nums">
                      {formatRupiah(variant.otrPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold text-xs ${
                          variant.status === 'READY'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {variant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenSpecEditor(variant.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                      >
                        Spesifikasi
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVariantId(variant.id);
                          setEditingVariant(variant);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'warna-foto') {
    const colorsForSelected =
      colorViewMode === 'all'
        ? motorColors
        : motorColors.filter((c) => c.variantId === selectedVariantForColor);

    const totalCustomPhotos = motorColors.filter((c) =>
      String(c.imageUrl || '').startsWith('/api/uploads/')
    ).length;

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950">
              Kelola Warna & Foto Spesifik per Warna (Requirement 5)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Setiap warna memiliki foto motor sendiri. Foto otomatis dikompresi dengan kualitas HD tajam agar unggahan instan dan tidak membebani kapasitas penyimpanan.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2 text-xs font-semibold text-emerald-800 whitespace-nowrap">
            Foto Kustom Terpasang: {totalCustomPhotos} / {motorColors.length} Warna
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Tipe / Varian Motor yang Akan Diatur Warnanya:
              </label>
              <select
                value={selectedVariantForColor}
                onChange={(e) => {
                  setSelectedVariantForColor(e.target.value);
                  setColorViewMode('selected');
                }}
                className="w-full sm:w-96 px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-lg bg-white"
              >
                {motorVariants.map((v) => {
                  const m = motorModels.find((mod) => mod.id === v.modelId);
                  const varColors = motorColors.filter((c) => c.variantId === v.id);
                  const customCount = varColors.filter((c) =>
                    String(c.imageUrl || '').startsWith('/api/uploads/')
                  ).length;
                  return (
                    <option key={v.id} value={v.id}>
                      {m?.name} — {v.name} ({customCount}/{varColors.length} foto diupload)
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setColorViewMode('selected')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                  colorViewMode === 'selected'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Tipe Terpilih Saja
              </button>
              <button
                type="button"
                onClick={() => setColorViewMode('all')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                  colorViewMode === 'all'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Tampilkan Semua Tipe ({motorColors.length} Warna)
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSaveColor}
            className="pt-4 border-t border-slate-200 space-y-4"
          >
            <h3 className="font-display text-base font-bold text-slate-900">
              {editingColorId
                ? 'Edit Warna & Foto Motor'
                : 'Tambah Pilihan Warna Baru untuk Tipe Ini'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Warna *
                </label>
                <input
                  type="text"
                  required
                  value={colorForm.name || ''}
                  onChange={(e) =>
                    setColorForm({ ...colorForm, name: e.target.value })
                  }
                  placeholder="Contoh: Biru / Merah / Hitam / Putih"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Warna Swatch (Hex)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorForm.hexCode || '#DC2626'}
                    onChange={(e) =>
                      setColorForm({ ...colorForm, hexCode: e.target.value })
                    }
                    className="w-10 h-9 border border-slate-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorForm.hexCode || '#DC2626'}
                    onChange={(e) =>
                      setColorForm({ ...colorForm, hexCode: e.target.value })
                    }
                    className="flex-1 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(colorForm.isDefault)}
                    onChange={(e) =>
                      setColorForm({ ...colorForm, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 accent-red-600"
                  />
                  <span>Jadikan Warna Default</span>
                </label>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto Khusus Warna Ini (Upload File JPG/PNG/WEBP atau Kosongkan untuk Auto Studio Render)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={colorForm.imageUrl || ''}
                    onChange={(e) =>
                      setColorForm({ ...colorForm, imageUrl: e.target.value })
                    }
                    placeholder="Kosongkan untuk render warna studio otomatis atau upload foto..."
                    className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer whitespace-nowrap">
                    {uploadingFormPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Foto Warna</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      disabled={uploadingFormPhoto}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingFormPhoto(true);
                        try {
                          const uploadedUrl = await onUploadImageFile(file);
                          if (uploadedUrl) {
                            setColorForm((prev) => ({
                              ...prev,
                              imageUrl: uploadedUrl,
                            }));
                            if (editingColorId) {
                              try {
                                const res = await fetch(`/api/admin/colors/${editingColorId}`, {
                                  method: 'PUT',
                                  headers: authHeaders,
                                  body: JSON.stringify({
                                    ...colorForm,
                                    variantId:
                                      colorForm.variantId ||
                                      selectedVariantForColor ||
                                      motorVariants[0]?.id,
                                    imageUrl: uploadedUrl,
                                  }),
                                });
                                if (res.ok) {
                                  notify('Foto warna berhasil diupload dan langsung disimpan permanen.');
                                  await onRefresh();
                                }
                              } catch {
                                // ignore, user can still click Simpan
                              }
                            }
                          }
                        } finally {
                          setUploadingFormPhoto(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingColorId ? 'Simpan Perubahan Warna' : 'Tambah Warna'}</span>
              </button>
              {editingColorId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingColorId(null);
                    setColorForm({
                      name: '',
                      hexCode: '#DC2626',
                      secondaryHexCode: '#18181B',
                      imageUrl: '',
                      isDefault: false,
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Grid of Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {colorsForSelected.map((col) => {
            const variantObj = motorVariants.find((v) => v.id === col.variantId);
            const modelObj = motorModels.find((m) => m.id === variantObj?.modelId);
            const isCustomPhoto = String(col.imageUrl || '').startsWith('/api/uploads/');
            const isUploadingThis = uploadingColorId === col.id;

            return (
              <div
                key={col.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-4/3 bg-slate-100 border-b border-slate-100">
                    <ResilientImage
                      src={col.imageUrl}
                      alt={col.name}
                      className="w-full h-full object-contain p-2"
                    />
                    {isUploadingThis && (
                      <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-semibold">Mengunggah Foto...</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          isCustomPhoto
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800/80 text-slate-100'
                        }`}
                      >
                        {isCustomPhoto ? 'Foto Diupload' : 'Studio Default'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-500 truncate">
                      {modelObj?.name} — {variantObj?.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: col.hexCode }}
                        />
                        <span className="font-bold text-sm text-slate-950">
                          {col.name}
                        </span>
                      </div>
                      {col.isDefault && (
                        <span className="text-xs font-semibold text-emerald-700">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <label
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white rounded cursor-pointer ${
                      isUploadingThis
                        ? 'bg-slate-400 cursor-wait'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isUploadingThis ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        <span>Ganti Foto</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      disabled={isUploadingThis}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await handleDirectUpdateColorPhoto(col, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVariantForColor(col.variantId);
                        setEditingColorId(col.id);
                        setColorForm(col);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteColor(col.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'harga-otr') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-950">
            Update Cepat Harga OTR & Status Stok (READY / INDENT)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Ubah harga OTR atau status ketersediaan unit langsung dari tabel di bawah ini, lalu klik Simpan pada baris terkait.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 font-semibold">Model & Tipe</th>
                <th className="py-3 px-4 font-semibold">Harga OTR (Rp)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Label Promo Singkat</th>
                <th className="py-3 px-4 font-semibold text-right">Simpan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {motorVariants.map((v) => (
                <QuickOtrRow
                  key={v.id}
                  variant={v}
                  modelName={
                    motorModels.find((m) => m.id === v.modelId)?.name || 'Honda'
                  }
                  onSave={handleQuickUpdateVariant}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'data-kredit') {
    const activeTenorList = [...tenors].sort((a, b) => a.months - b.months);
    const filteredCredits = creditSimulations
      .filter((cs) => !creditFilterVariantId || cs.variantId === creditFilterVariantId)
      .sort((a, b) => {
        if (a.variantId !== b.variantId) return a.variantId.localeCompare(b.variantId);
        return a.dp - b.dp;
      });
    const selectedVariantObj = motorVariants.find((v) => v.id === selectedCreditVariantId);

    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-950">
            Kelola Pilihan DP, Lama Tenor & Jumlah Angsuran per Tipe Motor
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Setiap Tipe Motor dapat memiliki <strong>beberapa pilihan DP (hingga 10 baris pilihan DP)</strong>. Semakin besar DP yang dipilih konsumen, semakin kecil angsuran bulanannya. Semua warna dalam 1 tipe motor memiliki harga OTR, pilihan DP, dan angsuran yang sama.
          </p>
        </div>

        {/* Tenor Management Box (Tambah, Edit & Hapus Lama Tenor) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                1. Kelola Lama Tenor Cicilan (Bulan)
              </h3>
              <p className="text-xs text-slate-500">
                Klik angka bulan untuk mengedit lama tenor, atau tambah pilihan bulan tenor baru.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTenorList.map((t) => (
              <div
                key={t.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                {editingTenorId === t.id ? (
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={editingTenorMonths}
                      onChange={(e) => setEditingTenorMonths(e.target.value)}
                      className="w-16 px-2 py-0.5 text-xs font-mono bg-white border border-slate-300 rounded"
                    />
                    <span className="text-[11px] text-slate-600">Bln</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateTenor(t.id)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTenorId(null);
                        setEditingTenorMonths('');
                      }}
                      className="px-1.5 py-0.5 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-mono">{t.months} Bulan</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTenorId(t.id);
                        setEditingTenorMonths(String(t.months));
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
                      title="Edit lama tenor"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTenor(t.id)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer font-bold"
                      title="Hapus tenor"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}

            <form onSubmit={handleAddTenor} className="inline-flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={newTenorMonths}
                onChange={(e) => setNewTenorMonths(e.target.value)}
                placeholder="Tambah tenor (bln)"
                className="w-36 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                + Tambah Tenor
              </button>
            </form>
          </div>
        </div>

        {/* Multi-Row DP & Installment Editor per Tipe Motor (Up to 10 Rows) */}
        <form
          onSubmit={handleSaveVariantCreditsBatch}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                2. Tambah & Edit Pilihan DP, Lama Tenor, dan Jumlah Angsuran per Tipe Motor (1 – 10 Baris)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur beberapa pilihan DP untuk tipe motor yang dipilih. Semakin besar DP, semakin kecil jumlah angsuran per bulannya.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md whitespace-nowrap">
              {creditDpRows.length} / 10 Baris Pilihan DP Aktif
            </span>
          </div>

          {/* Top Controls: Pilih Tipe Motor, Harga OTR, Jumlah Pilihan DP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Tipe Motor *
              </label>
              <select
                value={selectedCreditVariantId}
                onChange={(e) => loadVariantIntoCreditEditor(e.target.value, false)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg bg-white"
              >
                {motorVariants.map((v) => {
                  const m = motorModels.find((mod) => mod.id === v.modelId);
                  const dpCount = creditSimulations.filter((cs) => cs.variantId === v.id).length;
                  return (
                    <option key={v.id} value={v.id}>
                      {m?.name ? `${m.name} — ` : ''}{v.name} ({dpCount} Pilihan DP)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga OTR Tipe {selectedVariantObj?.name || 'Ini'} (Rp) *
              </label>
              <input
                type="number"
                required
                value={creditVariantOtr}
                onChange={(e) => setCreditVariantOtr(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg bg-white"
              />
              <span className="block text-[11px] text-slate-500 mt-1 font-mono">
                {formatRupiah(creditVariantOtr)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Baris Pilihan DP (Maks 10 Baris)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetCreditDpRowCount(creditDpRows.length - 1)}
                  disabled={creditDpRows.length <= 1}
                  className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded-lg cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={creditDpRows.length}
                  onChange={(e) => handleSetCreditDpRowCount(Number(e.target.value))}
                  className="w-20 px-3 py-2 text-xs sm:text-sm font-mono font-bold text-center border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleSetCreditDpRowCount(creditDpRows.length + 1)}
                  disabled={creditDpRows.length >= 10}
                  className="px-3 py-2 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 rounded-lg cursor-pointer"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={handleAddCreditDpRow}
                  disabled={creditDpRows.length >= 10}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pilihan DP</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Row DP & Tenor Installments Table (1 to 10 Rows) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-slate-800">
                Daftar Pilihan DP & Jumlah Angsuran per Lama Tenor untuk Tipe{' '}
                <span className="text-red-600">{selectedVariantObj?.name || ''}</span>:
              </label>
              <button
                type="button"
                onClick={() =>
                  setCreditDpRows((prev) => [...prev].sort((a, b) => a.dp - b.dp))
                }
                className="text-xs font-semibold text-slate-600 hover:text-slate-950 underline cursor-pointer self-start sm:self-auto"
              >
                Urutkan DP dari Kecil ke Besar
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="py-2.5 px-3 font-semibold w-24">Baris</th>
                    <th className="py-2.5 px-3 font-semibold min-w-[175px]">
                      Pilihan Uang Muka (DP) *
                    </th>
                    {activeTenorList.map((t) => (
                      <th
                        key={t.id}
                        className="py-2.5 px-3 font-semibold font-mono min-w-[135px]"
                      >
                        Angsuran {t.months} Bln
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-semibold text-right min-w-[140px]">
                      Aksi Baris
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {creditDpRows.map((row, rIdx) => (
                    <tr key={row.id || `dp-row-${rIdx}`} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        DP #{rIdx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          required
                          min={100000}
                          step={50000}
                          value={row.dp || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCreditDpRows((prev) =>
                              prev.map((item, idx) =>
                                idx === rIdx ? { ...item, dp: val } : item
                              )
                            );
                          }}
                          placeholder="Contoh: 2000000"
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:border-red-600 focus:outline-none"
                        />
                        <span className="block text-[11px] font-mono text-emerald-700 font-semibold mt-1">
                          {formatRupiah(row.dp || 0)}
                        </span>
                      </td>
                      {activeTenorList.map((t) => {
                        const tKey = String(t.months);
                        return (
                          <td key={t.id} className="py-3 px-3">
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={row.installments[tKey] || ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCreditDpRows((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rIdx
                                      ? {
                                          ...item,
                                          installments: {
                                            ...item.installments,
                                            [tKey]: val,
                                          },
                                        }
                                      : item
                                  )
                                );
                              }}
                              placeholder="Contoh: 785000"
                              className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:border-red-600 focus:outline-none"
                            />
                            <span className="block text-[10px] font-mono text-slate-500 mt-1">
                              {row.installments[tKey]
                                ? `${formatRupiah(row.installments[tKey])}/bln`
                                : '-'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const autoInst = computeAutoInstallmentsForDp(
                              creditVariantOtr,
                              row.dp
                            );
                            setCreditDpRows((prev) =>
                              prev.map((item, idx) =>
                                idx === rIdx ? { ...item, installments: autoInst } : item
                              )
                            );
                          }}
                          className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                          title="Hitung estimasi angsuran otomatis berdasarkan OTR & DP baris ini"
                        >
                          Auto Hitung
                        </button>
                        {creditDpRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCreditDpRow(rIdx)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                            title="Hapus baris pilihan DP ini"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddCreditDpRow}
              disabled={creditDpRows.length >= 10}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 border border-slate-300 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                + Tambah Pilihan DP Lainnya ({creditDpRows.length}/10 Baris)
              </span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>
                Simpan Semua Pilihan DP & Angsuran ({creditDpRows.length} Baris)
              </span>
            </button>
          </div>
        </form>

        {/* Filter & Credit Table (All DP Rows per Tipe Motor, with Inline Row Edit) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                3. Tabel Daftar Pilihan DP & Angsuran Seluruh Tipe Motor ({filteredCredits.length} Baris Pilihan DP)
              </h3>
              <p className="text-xs text-slate-500">
                Anda dapat mengedit langsung per baris di tabel ini (klik <strong>Edit Baris</strong>) atau mengelola hingga 10 pilihan DP sekaligus pada form di atas.
              </p>
            </div>
            <select
              value={creditFilterVariantId}
              onChange={(e) => setCreditFilterVariantId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Tampilkan Semua Tipe Motor ({creditSimulations.length} Baris DP)</option>
              {motorVariants.map((v) => {
                const count = creditSimulations.filter((cs) => cs.variantId === v.id).length;
                return (
                  <option key={v.id} value={v.id}>
                    {v.name} ({count} Pilihan DP)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold">Model Motor</th>
                  <th className="py-2.5 px-3 font-semibold">Tipe Motor</th>
                  <th className="py-2.5 px-3 font-semibold">Pilihan DP</th>
                  <th className="py-2.5 px-3 font-semibold">Harga OTR</th>
                  {activeTenorList.map((t) => (
                    <th key={t.id} className="py-2.5 px-3 font-semibold font-mono">
                      {t.months} Bln
                    </th>
                  ))}
                  <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCredits.map((cs) => {
                  const v = motorVariants.find((item) => item.id === cs.variantId);
                  const m = motorModels.find(
                    (mod) => mod.id === (v?.modelId || cs.modelId)
                  );
                  const isInlineEditing =
                    inlineEditingCreditId === cs.id && inlineCreditRow !== null;

                  return (
                    <tr
                      key={cs.id}
                      className={
                        isInlineEditing ? 'bg-amber-50/70' : 'hover:bg-slate-50/80'
                      }
                    >
                      <td className="py-2.5 px-3 text-slate-600">
                        {m?.name || 'Honda'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-950">
                        {v?.name || cs.variantId}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-950 tabular-nums">
                        {isInlineEditing && inlineCreditRow ? (
                          <input
                            type="number"
                            value={inlineCreditRow.dp}
                            onChange={(e) =>
                              setInlineCreditRow({
                                ...inlineCreditRow,
                                dp: Number(e.target.value),
                              })
                            }
                            className="w-28 px-2 py-1 text-xs font-mono border border-slate-300 rounded bg-white"
                          />
                        ) : (
                          formatRupiah(cs.dp)
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 tabular-nums">
                        {isInlineEditing && inlineCreditRow ? (
                          <input
                            type="number"
                            value={inlineCreditRow.otr}
                            onChange={(e) =>
                              setInlineCreditRow({
                                ...inlineCreditRow,
                                otr: Number(e.target.value),
                              })
                            }
                            className="w-32 px-2 py-1 text-xs font-mono border border-slate-300 rounded bg-white"
                          />
                        ) : (
                          formatRupiah(cs.otr)
                        )}
                      </td>
                      {activeTenorList.map((t) => {
                        const tKey = String(t.months);
                        return (
                          <td
                            key={t.id}
                            className="py-2.5 px-3 font-mono text-slate-800 tabular-nums"
                          >
                            {isInlineEditing && inlineCreditRow ? (
                              <input
                                type="number"
                                value={inlineCreditRow.installments[tKey] || ''}
                                onChange={(e) =>
                                  setInlineCreditRow({
                                    ...inlineCreditRow,
                                    installments: {
                                      ...inlineCreditRow.installments,
                                      [tKey]: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-24 px-2 py-1 text-xs font-mono border border-slate-300 rounded bg-white"
                              />
                            ) : cs.installments[tKey] ? (
                              formatRupiah(cs.installments[tKey])
                            ) : (
                              '-'
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        {isInlineEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleSaveInlineCreditRow}
                              disabled={saving}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInlineEditingCreditId(null);
                                setInlineCreditRow(null);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded cursor-pointer"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setInlineEditingCreditId(cs.id);
                                setInlineCreditRow({
                                  id: cs.id,
                                  variantId: cs.variantId,
                                  dp: cs.dp,
                                  otr: cs.otr,
                                  installments: { ...cs.installments },
                                });
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              Edit Baris
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                loadVariantIntoCreditEditor(cs.variantId, true);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer"
                              title="Tambah pilihan DP baru untuk tipe motor ini"
                            >
                              + Pilihan DP
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCredit(cs.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded cursor-pointer"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // activeTab === 'import-excel'
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-950">
          Import Data Kredit dari Excel & Backup Data (Requirement 9, 36, 44)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Upload file Excel (.xlsx) untuk memperbarui ratusan kombinasi DP, OTR, dan angsuran sekaligus.
        </p>
      </div>

      {/* Template Format Guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-base font-bold text-slate-950">
              1. Unduh Template Resmi atau Backup Data Saat Ini
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Pastikan kolom DP, OTR, dan tenor (11, 17, 23, 29, 35) menggunakan angka murni tanpa huruf "Rp".
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/api/template-excel"
              download="Template_Kredit_Honda_Parungkuda.xlsx"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Template Excel</span>
            </a>
            <button
              type="button"
              onClick={handleDownloadBackupExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export / Backup Data ke Excel</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Contoh Format Tabel Excel yang Benar (1 Baris per Tipe Motor, Tanpa Kolom Warna):
          </p>
          <table className="w-full text-left border-collapse text-xs font-mono border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                <th className="p-2 border-r border-slate-200">MODEL</th>
                <th className="p-2 border-r border-slate-200">TIPE</th>
                <th className="p-2 border-r border-slate-200">DP</th>
                <th className="p-2 border-r border-slate-200">OTR</th>
                <th className="p-2 border-r border-slate-200">11</th>
                <th className="p-2 border-r border-slate-200">17</th>
                <th className="p-2 border-r border-slate-200">23</th>
                <th className="p-2 border-r border-slate-200">29</th>
                <th className="p-2">35</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-2 border-r border-slate-200">Vario 160</td>
                <td className="p-2 border-r border-slate-200">Vario 160 CBS</td>
                <td className="p-2 border-r border-slate-200">3000000</td>
                <td className="p-2 border-r border-slate-200">27600000</td>
                <td className="p-2 border-r border-slate-200">2660000</td>
                <td className="p-2 border-r border-slate-200">1850000</td>
                <td className="p-2 border-r border-slate-200">1475000</td>
                <td className="p-2 border-r border-slate-200">1255000</td>
                <td className="p-2">1095000</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-slate-200">Vario 160</td>
                <td className="p-2 border-r border-slate-200">Vario 160 ABS</td>
                <td className="p-2 border-r border-slate-200">3500000</td>
                <td className="p-2 border-r border-slate-200">30450000</td>
                <td className="p-2 border-r border-slate-200">2915000</td>
                <td className="p-2 border-r border-slate-200">2030000</td>
                <td className="p-2 border-r border-slate-200">1615000</td>
                <td className="p-2 border-r border-slate-200">1375000</td>
                <td className="p-2">1200000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Upload Dropzone */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="font-display text-base font-bold text-slate-950 mb-3">
            2. Upload File Excel (.xlsx / .xls)
          </h3>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-red-600 rounded-xl p-8 bg-slate-50/70 cursor-pointer transition-colors">
            {excelImporting ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                <span>Memvalidasi & Mengimpor Data Excel...</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-red-600 mb-2" />
                <span className="text-sm font-semibold text-slate-900">
                  Klik untuk memilih file Excel (.xlsx)
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Sistem otomatis memvalidasi setiap baris sebelum menyimpan ke database
                </span>
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.xls"
              disabled={excelImporting}
              onChange={handleExcelFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Import Result / Error Feedback */}
        {excelResult && (
          <div
            className={`p-5 rounded-xl border ${
              excelResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {excelResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2 flex-1">
                <div className="font-bold text-sm">{excelResult.message}</div>
                {excelResult.errors && excelResult.errors.length > 0 && (
                  <div className="space-y-1 text-xs bg-white/80 p-3 rounded-lg border border-red-200 max-h-60 overflow-y-auto">
                    <div className="font-semibold text-red-800 mb-1">
                      Daftar Baris yang Bermasalah (Data Rusak Tidak Dimasukkan):
                    </div>
                    {excelResult.errors.map((err, idx) => (
                      <div key={idx} className="font-mono text-red-700">
                        • Baris {err.row}
                        {err.column ? ` [Kolom ${err.column}]` : ''}: {err.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuickOtrRow: React.FC<{
  variant: MotorVariant;
  modelName: string;
  onSave: (
    v: MotorVariant,
    otr: number,
    status: 'READY' | 'INDENT',
    promo: string
  ) => Promise<void>;
}> = ({ variant, modelName, onSave }) => {
  const [otr, setOtr] = useState<number>(variant.otrPrice);
  const [status, setStatus] = useState<'READY' | 'INDENT'>(variant.status);
  const [promo, setPromo] = useState<string>(variant.promoBadge || '');

  useEffect(() => {
    setOtr(variant.otrPrice);
    setStatus(variant.status);
    setPromo(variant.promoBadge || '');
  }, [variant.otrPrice, variant.status, variant.promoBadge]);

  return (
    <tr className="hover:bg-slate-50/80">
      <td className="py-3 px-4">
        <div className="text-xs text-slate-500">{modelName}</div>
        <div className="font-bold text-slate-950">{variant.name}</div>
      </td>
      <td className="py-3 px-4">
        <input
          type="number"
          value={otr}
          onChange={(e) => setOtr(Number(e.target.value))}
          className="w-36 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
        />
      </td>
      <td className="py-3 px-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'READY' | 'INDENT')}
          className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
        >
          <option value="READY">READY</option>
          <option value="INDENT">INDENT</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <input
          type="text"
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          className="w-full min-w-[180px] px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
        />
      </td>
      <td className="py-3 px-4 text-right">
        <button
          type="button"
          onClick={() => onSave(variant, otr, status, promo)}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
        >
          Simpan
        </button>
      </td>
    </tr>
  );
};
