import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Bike,
  Layers,
  Palette,
  Tag,
  Calculator,
  FileSpreadsheet,
  Percent,
  BookOpen,
  MessageSquareQuote,
  Building2,
  Target,
  PhoneCall,
  Share2,
  Settings,
  LogOut,
  Eye,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Save,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  PublicBootstrapData,
  SiteSettings,
  Promo,
  Article,
  Testimonial,
  User,
} from '../types/index.ts';
import { AdminCatalogTabs, CatalogAdminTab } from './AdminCatalogTabs.tsx';
import { ResilientImage } from './ResilientImage.tsx';

export type AdminMenuKey =
  | 'beranda'
  | CatalogAdminTab
  | 'promo'
  | 'tips-panduan'
  | 'testimoni'
  | 'tentang-kami'
  | 'visi-misi'
  | 'kontak'
  | 'social-media'
  | 'pengaturan-website';

interface AdminDashboardProps {
  data: PublicBootstrapData;
  token: string;
  user: User;
  onRefresh: () => Promise<void>;
  onPreviewWebsite: () => void;
  onLogout: () => void;
  onUpdateToken: (newToken: string, newUser: User) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  token,
  user,
  onRefresh,
  onPreviewWebsite,
  onLogout,
  onUpdateToken,
}) => {
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('beranda');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(data.siteSettings);

  // Promo form state
  const [promoForm, setPromoForm] = useState<Partial<Promo>>({
    title: '',
    description: '',
    period: '',
    highlightText: '',
    imageUrl: '',
    whatsappText: '',
    linkUrl: '#simulasi',
    isActive: true,
  });
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  // Article form state
  const [articleForm, setArticleForm] = useState<Partial<Article>>({
    title: '',
    category: 'Panduan Kredit',
    summary: '',
    content: '',
    imageUrl: '',
    publishedDate: new Date().toISOString().slice(0, 10),
    isPublished: true,
  });
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Testimonial form state
  const [testiForm, setTestiForm] = useState<Partial<Testimonial>>({
    customerName: '',
    customerLocation: 'Sukabumi',
    motorName: '',
    handoverDate: new Date().toISOString().slice(0, 10),
    caption: '',
    customerPhotoUrl: '',
    handoverPhotoUrl: '',
    isPublished: true,
  });
  const [editingTestiId, setEditingTestiId] = useState<string | null>(null);

  // Admin Credentials Change State
  const [newAdminUser, setNewAdminUser] = useState(user.username);
  const [newAdminPass, setNewAdminPass] = useState('');

  useEffect(() => {
    setSettingsForm(data.siteSettings);
  }, [data.siteSettings]);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const optimizeImageBeforeUpload = (
    file: File
  ): Promise<{ dataUrl: string; mimeType: string; filename: string }> => {
    return new Promise((resolve, reject) => {
      const readRawFallback = () => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            dataUrl: String(reader.result || ''),
            mimeType: file.type || 'image/jpeg',
            filename: file.name || 'image.jpg',
          });
        reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
        reader.readAsDataURL(file);
      };

      // Optimize via HTML5 Canvas so even 5MB-20MB transparent PNG/JPG photos become ~100KB-250KB WebP/JPEG
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const MAX_DIM = 1280;
          let width = img.naturalWidth || img.width || 800;
          let height = img.naturalHeight || img.height || 600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width >= height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            readRawFallback();
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first (supports alpha transparency for PNG motor cutouts + 30x smaller size)
          let outMime = 'image/webp';
          let dataUrl = canvas.toDataURL('image/webp', 0.86);
          if (!dataUrl.startsWith('data:image/webp')) {
            // Fallback if browser doesn't encode WebP
            const isPng = (file.type || '').toLowerCase().includes('png');
            outMime = isPng ? 'image/png' : 'image/jpeg';
            dataUrl = canvas.toDataURL(outMime, 0.86);
          }

          const baseName = (file.name || 'motor').replace(/\.[^/.]+$/, '');
          const ext = outMime === 'image/webp' ? 'webp' : outMime === 'image/png' ? 'png' : 'jpg';
          resolve({
            dataUrl,
            mimeType: outMime,
            filename: `${baseName}.${ext}`,
          });
        } catch {
          readRawFallback();
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        readRawFallback();
      };
      img.src = objectUrl;
    });
  };

  const handleUploadImageFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const optimized = await optimizeImageBeforeUpload(file);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          filename: optimized.filename,
          mimeType: optimized.mimeType,
          dataUrl: optimized.dataUrl,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json();
      if (!res.ok) {
        notify(json.error || 'Foto gagal diupload.', 'error');
        return null;
      }
      notify('Foto berhasil diupload.');
      return json.url as string;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        notify('Waktu unggah habis. Silakan coba lagi.', 'error');
      } else {
        notify('Foto gagal diupload. Silakan coba lagi.', 'error');
      }
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent, overrideSettings?: SiteSettings) => {
    if (e) e.preventDefault();
    const payload = overrideSettings || settingsForm;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan pengaturan');
      notify(json.message || 'Perubahan berhasil disimpan secara permanen.');
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Promo Handlers
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingPromoId
        ? `/api/admin/promos/${editingPromoId}`
        : '/api/admin/promos';
      const method = editingPromoId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(promoForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan promo');
      notify(json.message);
      setPromoForm({
        title: '',
        description: '',
        period: '',
        highlightText: '',
        imageUrl: '',
        whatsappText: '',
        linkUrl: '#simulasi',
        isActive: true,
      });
      setEditingPromoId(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePromoActive = async (promo: Promo) => {
    try {
      await fetch(`/api/admin/promos/${promo.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      notify(
        `Promo "${promo.title}" ${!promo.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      await onRefresh();
    } catch {
      notify('Gagal mengubah status promo.', 'error');
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      await fetch(`/api/admin/promos/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      notify('Promo berhasil dihapus.');
      await onRefresh();
    } catch {
      notify('Gagal menghapus promo.', 'error');
    }
  };

  // Article Handlers
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingArticleId
        ? `/api/admin/articles/${editingArticleId}`
        : '/api/admin/articles';
      const method = editingArticleId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(articleForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan artikel');
      notify(json.message);
      setArticleForm({
        title: '',
        category: 'Panduan Kredit',
        summary: '',
        content: '',
        imageUrl: '',
        publishedDate: new Date().toISOString().slice(0, 10),
        isPublished: true,
      });
      setEditingArticleId(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      notify('Artikel berhasil dihapus.');
      await onRefresh();
    } catch {
      notify('Gagal menghapus artikel.', 'error');
    }
  };

  // Testimonial Handlers
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingTestiId
        ? `/api/admin/testimonials/${editingTestiId}`
        : '/api/admin/testimonials';
      const method = editingTestiId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(testiForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan testimoni');
      notify(json.message);
      setTestiForm({
        customerName: '',
        customerLocation: 'Sukabumi',
        motorName: '',
        handoverDate: new Date().toISOString().slice(0, 10),
        caption: '',
        customerPhotoUrl: '',
        handoverPhotoUrl: '',
        isPublished: true,
      });
      setEditingTestiId(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      notify('Testimoni berhasil dihapus.');
      await onRefresh();
    } catch {
      notify('Gagal menghapus testimoni.', 'error');
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/credentials', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          newUsername: newAdminUser,
          newPassword: newAdminPass,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengubah kredensial');
      onUpdateToken(json.token, json.user);
      setNewAdminPass('');
      notify(json.message);
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reset-demo', {
        method: 'POST',
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mereset data demo');
      notify(json.message);
      await onRefresh();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // 15 Menu Items + Logout in Sidebar (Requirement 23)
  const menuItems: Array<{ key: AdminMenuKey; label: string; icon: any }> = [
    { key: 'beranda', label: 'Beranda & Hero', icon: LayoutDashboard },
    { key: 'katalog-motor', label: 'Katalog Motor', icon: Bike },
    { key: 'tipe-varian', label: 'Tipe & Varian', icon: Layers },
    { key: 'warna-foto', label: 'Warna & Foto', icon: Palette },
    { key: 'harga-otr', label: 'Harga OTR', icon: Tag },
    { key: 'data-kredit', label: 'Data Kredit', icon: Calculator },
    { key: 'import-excel', label: 'Import Excel', icon: FileSpreadsheet },
    { key: 'promo', label: 'Promo', icon: Percent },
    { key: 'tips-panduan', label: 'Tips & Panduan', icon: BookOpen },
    { key: 'testimoni', label: 'Testimoni', icon: MessageSquareQuote },
    { key: 'tentang-kami', label: 'Tentang Kami', icon: Building2 },
    { key: 'visi-misi', label: 'Visi & Misi', icon: Target },
    { key: 'kontak', label: 'Kontak', icon: PhoneCall },
    { key: 'social-media', label: 'Social Media', icon: Share2 },
    { key: 'pengaturan-website', label: 'Pengaturan Website', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-68 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-red-500">
              Admin Panel Resmi
            </div>
            <div className="font-display text-sm font-bold text-white truncate max-w-[190px]">
              {data.siteSettings.siteName}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveMenu(item.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1.5">
          <button
            type="button"
            onClick={onPreviewWebsite}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Preview Website Konsumen</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout ({user.username})</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-slate-500">
                Dashboard Admin /{' '}
                <strong className="text-slate-900">
                  {menuItems.find((m) => m.key === activeMenu)?.label}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {uploading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Mengupload gambar...</span>
              </span>
            )}
            <button
              type="button"
              onClick={onPreviewWebsite}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Website</span>
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-md">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold ${
                toast.type === 'success'
                  ? 'bg-slate-950 text-white border-slate-800'
                  : 'bg-red-600 text-white border-red-700'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Workspace Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {/* ===============================================================
              TAB 1: BERANDA & HERO BANNER EDITOR
          =============================================================== */}
          {activeMenu === 'beranda' && (
            <div className="space-y-8">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">Model Motor</div>
                  <div className="font-mono text-2xl font-bold text-slate-950 mt-1 tabular-nums">
                    {data.motorModels.length}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">Tipe & Varian</div>
                  <div className="font-mono text-2xl font-bold text-slate-950 mt-1 tabular-nums">
                    {data.motorVariants.length}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">Pilihan Warna</div>
                  <div className="font-mono text-2xl font-bold text-slate-950 mt-1 tabular-nums">
                    {data.motorColors.length}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">Baris Data Kredit</div>
                  <div className="font-mono text-2xl font-bold text-red-600 mt-1 tabular-nums">
                    {data.creditSimulations.length}
                  </div>
                </div>
              </div>

              {/* Hero Section Editor */}
              <form
                onSubmit={handleSaveSettings}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
              >
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-950">
                    Pengaturan Hero Banner Utama (Beranda)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ubah judul utama, subjudul, foto banner, serta teks dan link tombol pada halaman Beranda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Utama Banner (Hero Title)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroTitle}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          heroTitle: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subjudul Banner (Hero Subtitle)
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.heroSubtitle}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          heroSubtitle: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teks Tombol Utama
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroPrimaryBtnText}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          heroPrimaryBtnText: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link Tombol Utama
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroPrimaryBtnLink}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          heroPrimaryBtnLink: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teks Tombol Kedua
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroSecondaryBtnText}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          heroSecondaryBtnText: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Foto / Banner Hero (Upload JPG/PNG/WEBP)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settingsForm.heroImage}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            heroImage: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                      <label className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer whitespace-nowrap">
                        Upload Foto
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await handleUploadImageFile(file);
                            if (url) {
                              const nextSettings = {
                                ...settingsForm,
                                heroImage: url,
                              };
                              setSettingsForm(nextSettings);
                              await handleSaveSettings(undefined, nextSettings);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Banner Beranda</span>
                </button>
              </form>
            </div>
          )}

          {/* ===============================================================
              TABS 2–7: CATALOG, VARIANTS, COLORS, OTR, CREDIT, EXCEL
          =============================================================== */}
          {(activeMenu === 'katalog-motor' ||
            activeMenu === 'tipe-varian' ||
            activeMenu === 'warna-foto' ||
            activeMenu === 'harga-otr' ||
            activeMenu === 'data-kredit' ||
            activeMenu === 'import-excel') && (
            <AdminCatalogTabs
              activeTab={activeMenu}
              data={data}
              token={token}
              onRefresh={onRefresh}
              onUploadImageFile={handleUploadImageFile}
              notify={notify}
            />
          )}

          {/* ===============================================================
              TAB 8: PROMO HONDA TERBARU (Requirement 14)
          =============================================================== */}
          {activeMenu === 'promo' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Kelola Promo Honda Terbaru
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Tambah, edit, atau nonaktifkan promo yang sudah berakhir tanpa harus menghapusnya.
                </p>
              </div>

              <form
                onSubmit={handleSavePromo}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
              >
                <h3 className="font-display text-base font-bold text-slate-900">
                  {editingPromoId ? 'Edit Promo' : 'Tambah Promo Baru'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Promo *
                    </label>
                    <input
                      type="text"
                      required
                      value={promoForm.title || ''}
                      onChange={(e) =>
                        setPromoForm({ ...promoForm, title: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Periode Promo *
                    </label>
                    <input
                      type="text"
                      required
                      value={promoForm.period || ''}
                      onChange={(e) =>
                        setPromoForm({ ...promoForm, period: e.target.value })
                      }
                      placeholder="Contoh: 1 Oktober – 30 November 2026"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Highlight Singkat Promo
                    </label>
                    <input
                      type="text"
                      value={promoForm.highlightText || ''}
                      onChange={(e) =>
                        setPromoForm({
                          ...promoForm,
                          highlightText: e.target.value,
                        })
                      }
                      placeholder="Contoh: Subsidi DP Rp 1,5 Juta"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gambar Promo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={promoForm.imageUrl || ''}
                        onChange={(e) =>
                          setPromoForm({ ...promoForm, imageUrl: e.target.value })
                        }
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                      <label className="px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                        Upload
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await handleUploadImageFile(file);
                            if (url) {
                              setPromoForm((prev) => ({ ...prev, imageUrl: url }));
                              if (editingPromoId) {
                                try {
                                  const res = await fetch(`/api/admin/promos/${editingPromoId}`, {
                                    method: 'PUT',
                                    headers: authHeaders,
                                    body: JSON.stringify({ ...promoForm, imageUrl: url }),
                                  });
                                  if (res.ok) {
                                    notify('Foto promo berhasil diganti dan disimpan permanen.');
                                    await onRefresh();
                                  }
                                } catch {
                                  // ignore
                                }
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deskripsi Promo *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={promoForm.description || ''}
                      onChange={(e) =>
                        setPromoForm({
                          ...promoForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                  >
                    {editingPromoId ? 'Simpan Perubahan Promo' : 'Tambah Promo'}
                  </button>
                  {editingPromoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPromoId(null);
                        setPromoForm({
                          title: '',
                          description: '',
                          period: '',
                          highlightText: '',
                          imageUrl: '',
                          whatsappText: '',
                          linkUrl: '#simulasi',
                          isActive: true,
                        });
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.promos.map((promo) => (
                  <div
                    key={promo.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">{promo.period}</span>
                        <button
                          type="button"
                          onClick={() => handleTogglePromoActive(promo)}
                          className={`font-semibold cursor-pointer ${
                            promo.isActive
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                          }`}
                        >
                          Status: {promo.isActive ? 'AKTIF' : 'NONAKTIF'} (Klik Ubah)
                        </button>
                      </div>
                      <h4 className="font-display text-base font-bold text-slate-950">
                        {promo.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        {promo.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <label className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Ganti Foto</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await handleUploadImageFile(file);
                            if (url) {
                              const res = await fetch(`/api/admin/promos/${promo.id}`, {
                                method: 'PUT',
                                headers: authHeaders,
                                body: JSON.stringify({ ...promo, imageUrl: url }),
                              });
                              if (res.ok) {
                                notify(`Foto promo "${promo.title}" berhasil disimpan permanen.`);
                                await onRefresh();
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPromoId(promo.id);
                            setPromoForm(promo);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePromo(promo.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 9: TIPS & PANDUAN (ARTICLES) (Requirement 15)
          =============================================================== */}
          {activeMenu === 'tips-panduan' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Kelola Artikel Tips & Panduan
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Kelola panduan alur kredit, syarat pembelian cash/kredit, dokumen, tips DP & tenor, serta info STNK/BPKB.
                </p>
              </div>

              <form
                onSubmit={handleSaveArticle}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
              >
                <h3 className="font-display text-base font-bold text-slate-900">
                  {editingArticleId ? 'Edit Artikel' : 'Tambah Artikel Baru'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Artikel *
                    </label>
                    <input
                      type="text"
                      required
                      value={articleForm.title || ''}
                      onChange={(e) =>
                        setArticleForm({ ...articleForm, title: e.target.value })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori
                    </label>
                    <input
                      type="text"
                      value={articleForm.category || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gambar Artikel
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={articleForm.imageUrl || ''}
                        onChange={(e) =>
                          setArticleForm({
                            ...articleForm,
                            imageUrl: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                      <label className="px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                        Upload
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await handleUploadImageFile(file);
                            if (url) {
                              setArticleForm((prev) => ({
                                ...prev,
                                imageUrl: url,
                              }));
                              if (editingArticleId) {
                                try {
                                  const res = await fetch(`/api/admin/articles/${editingArticleId}`, {
                                    method: 'PUT',
                                    headers: authHeaders,
                                    body: JSON.stringify({ ...articleForm, imageUrl: url }),
                                  });
                                  if (res.ok) {
                                    notify('Foto artikel berhasil diganti dan disimpan permanen.');
                                    await onRefresh();
                                  }
                                } catch {
                                  // ignore
                                }
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Publikasi
                    </label>
                    <input
                      type="date"
                      value={articleForm.publishedDate || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          publishedDate: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ringkasan Singkat
                    </label>
                    <input
                      type="text"
                      value={articleForm.summary || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          summary: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Isi Artikel Lengkap *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={articleForm.content || ''}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          content: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                  >
                    {editingArticleId ? 'Simpan Artikel' : 'Terbitkan Artikel'}
                  </button>
                  {editingArticleId && (
                    <button
                      type="button"
                      onClick={() => setEditingArticleId(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                {data.articles.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs text-slate-500">
                        {art.category} · {art.publishedDate}
                      </div>
                      <h4 className="font-display text-sm font-bold text-slate-950">
                        {art.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArticleId(art.id);
                          setArticleForm(art);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(art.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 10: TESTIMONI PELANGGAN (Requirement 16)
          =============================================================== */}
          {activeMenu === 'testimoni' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Kelola Testimoni & Foto Serah Terima Motor
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Upload dokumentasi foto serah terima unit motor Honda bersama konsumen.
                </p>
              </div>

              <form
                onSubmit={handleSaveTestimonial}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
              >
                <h3 className="font-display text-base font-bold text-slate-900">
                  {editingTestiId ? 'Edit Testimoni' : 'Tambah Testimoni Serah Terima'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Konsumen *
                    </label>
                    <input
                      type="text"
                      required
                      value={testiForm.customerName || ''}
                      onChange={(e) =>
                        setTestiForm({
                          ...testiForm,
                          customerName: e.target.value,
                        })
                      }
                      placeholder="Contoh: Kak Andi"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unit Motor yang Dibeli *
                    </label>
                    <input
                      type="text"
                      required
                      value={testiForm.motorName || ''}
                      onChange={(e) =>
                        setTestiForm({ ...testiForm, motorName: e.target.value })
                      }
                      placeholder="Contoh: Honda Beat CBS Biru"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Serah Terima
                    </label>
                    <input
                      type="date"
                      value={testiForm.handoverDate || ''}
                      onChange={(e) =>
                        setTestiForm({
                          ...testiForm,
                          handoverDate: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Foto Serah Terima / Foto Konsumen
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={testiForm.handoverPhotoUrl || ''}
                        onChange={(e) =>
                          setTestiForm({
                            ...testiForm,
                            handoverPhotoUrl: e.target.value,
                            customerPhotoUrl: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                      <label className="px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                        Upload Foto
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await handleUploadImageFile(file);
                            if (url) {
                              setTestiForm((prev) => ({
                                ...prev,
                                handoverPhotoUrl: url,
                                customerPhotoUrl: url,
                              }));
                              if (editingTestiId) {
                                try {
                                  const res = await fetch(`/api/admin/testimonials/${editingTestiId}`, {
                                    method: 'PUT',
                                    headers: authHeaders,
                                    body: JSON.stringify({
                                      ...testiForm,
                                      handoverPhotoUrl: url,
                                      customerPhotoUrl: url,
                                    }),
                                  });
                                  if (res.ok) {
                                    notify('Foto testimoni berhasil diganti dan disimpan permanen.');
                                    await onRefresh();
                                  }
                                } catch {
                                  // ignore
                                }
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ucapan / Testimoni *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={testiForm.caption || ''}
                      onChange={(e) =>
                        setTestiForm({ ...testiForm, caption: e.target.value })
                      }
                      placeholder="Terima kasih Kak Andi sudah mempercayakan pembelian Honda Beat kepada kami."
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  {editingTestiId ? 'Simpan Perubahan' : 'Tambah Testimoni'}
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-4/3 bg-slate-100">
                        <ResilientImage
                          src={t.handoverPhotoUrl}
                          alt={t.customerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="text-xs font-semibold text-red-600">
                          {t.motorName}
                        </div>
                        <div className="font-bold text-sm text-slate-950">
                          {t.customerName}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                          "{t.caption}"
                        </p>
                      </div>
                    </div>
                    <div className="px-4 pb-4 flex flex-wrap items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Ganti Foto</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await handleUploadImageFile(file);
                            if (url) {
                              const res = await fetch(`/api/admin/testimonials/${t.id}`, {
                                method: 'PUT',
                                headers: authHeaders,
                                body: JSON.stringify({
                                  ...t,
                                  handoverPhotoUrl: url,
                                  customerPhotoUrl: url,
                                }),
                              });
                              if (res.ok) {
                                notify(`Foto testimoni ${t.customerName} berhasil disimpan permanen.`);
                                await onRefresh();
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTestiId(t.id);
                            setTestiForm(t);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTestimonial(t.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 11: TENTANG KAMI (Requirement 17)
          =============================================================== */}
          {activeMenu === 'tentang-kami' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Tentang Kami & Foto Perusahaan / Dealer
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Atur profil PT Selamat Lestari Mandiri Cabang Parungkuda, foto gedung dealer, foto showroom, dan foto tim.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Lengkap Perusahaan / Dealer
                </label>
                <textarea
                  rows={4}
                  value={settingsForm.aboutDescription}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      aboutDescription: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              {[
                { key: 'dealerPhotoUrl', label: 'Foto Perusahaan / Gedung Dealer' },
                { key: 'showroomPhotoUrl', label: 'Foto Showroom' },
                { key: 'teamPhotoUrl', label: 'Foto Tim Marketing / Serah Terima' },
              ].map((photoField) => (
                <div key={photoField.key}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {photoField.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={(settingsForm as any)[photoField.key] || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          [photoField.key]: e.target.value,
                        })
                      }
                      className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                    <label className="px-3.5 py-2 text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                      Upload Foto
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await handleUploadImageFile(file);
                          if (url) {
                            const nextSettings = {
                              ...settingsForm,
                              [photoField.key]: url,
                            };
                            setSettingsForm(nextSettings);
                            await handleSaveSettings(undefined, nextSettings);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Halaman Tentang Kami</span>
              </button>
            </form>
          )}

          {/* ===============================================================
              TAB 12: VISI & MISI (Requirement 18: Unlimited Mission Points)
          =============================================================== */}
          {activeMenu === 'visi-misi' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Kelola Visi & Misi Perusahaan
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Jumlah poin misi tidak dibatasi. Anda dapat menambah atau menghapus poin misi kapan saja.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visi
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.vision}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, vision: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Daftar Poin Misi ({settingsForm.missions.length} Poin)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSettingsForm({
                        ...settingsForm,
                        missions: [...settingsForm.missions, ''],
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Poin Misi</span>
                  </button>
                </div>

                {settingsForm.missions.map((mText, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 w-7">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={mText}
                      onChange={(e) => {
                        const updated = [...settingsForm.missions];
                        updated[idx] = e.target.value;
                        setSettingsForm({ ...settingsForm, missions: updated });
                      }}
                      className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = settingsForm.missions.filter(
                          (_, i) => i !== idx
                        );
                        setSettingsForm({ ...settingsForm, missions: updated });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Visi & Misi</span>
              </button>
            </form>
          )}

          {/* ===============================================================
              TAB 13: KONTAK & WHATSAPP (Requirements 19 & 38)
          =============================================================== */}
          {activeMenu === 'kontak' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Pengaturan Informasi Kontak & WhatsApp Otomatis
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Perusahaan Resmi
                  </label>
                  <input
                    type="text"
                    value={settingsForm.companyName}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cabang Dealer
                  </label>
                  <input
                    type="text"
                    value={settingsForm.branchName}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        branchName: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Marketing
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        whatsappNumber: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Operasional
                  </label>
                  <input
                    type="text"
                    value={settingsForm.operationalHours}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        operationalHours: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap Dealer
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.address}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pesan Default Tombol Floating WhatsApp
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.whatsappDefaultMessage}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        whatsappDefaultMessage: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Informasi Kontak</span>
              </button>
            </form>
          )}

          {/* ===============================================================
              TAB 14: SOCIAL MEDIA (Requirement 20)
          =============================================================== */}
          {activeMenu === 'social-media' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-slate-950">
                  Pengaturan Link Social Media
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Masukkan URL lengkap Facebook, Instagram, dan TikTok. Jika dikosongkan, ikon social media tersebut akan disembunyikan otomatis di halaman publik.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link Facebook (Kosongkan untuk menyembunyikan)
                  </label>
                  <input
                    type="url"
                    value={settingsForm.facebookUrl}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        facebookUrl: e.target.value,
                      })
                    }
                    placeholder="https://facebook.com/..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link Instagram (Kosongkan untuk menyembunyikan)
                  </label>
                  <input
                    type="url"
                    value={settingsForm.instagramUrl}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        instagramUrl: e.target.value,
                      })
                    }
                    placeholder="https://instagram.com/..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link TikTok (Kosongkan untuk menyembunyikan)
                  </label>
                  <input
                    type="url"
                    value={settingsForm.tiktokUrl}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        tiktokUrl: e.target.value,
                      })
                    }
                    placeholder="https://tiktok.com/@..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Link Social Media</span>
              </button>
            </form>
          )}

          {/* ===============================================================
              TAB 15: PENGATURAN WEBSITE & KEAMANAN ADMIN (Requirement 21)
          =============================================================== */}
          {activeMenu === 'pengaturan-website' && (
            <div className="space-y-8">
              <form
                onSubmit={handleSaveSettings}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-950">
                    Pengaturan Identitas Website & SEO
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Website (Brand Title)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.siteName}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          siteName: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Marketing Executive
                    </label>
                    <input
                      type="text"
                      value={settingsForm.salesName}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          salesName: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul SEO (Meta Title)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.seoTitle}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          seoTitle: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deskripsi SEO (Meta Description)
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.seoDescription}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          seoDescription: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Website</span>
                </button>
              </form>

              {/* Change Admin User ID & Password */}
              <form
                onSubmit={handleUpdateCredentials}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <h3 className="font-display text-base font-bold text-slate-950">
                  Ubah Kredensial Login Admin (User ID & Password)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      User ID Baru
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminUser}
                      onChange={(e) => setNewAdminUser(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password Baru (Minimal 6 Karakter)
                    </label>
                    <input
                      type="password"
                      required
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="Masukkan password baru"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Perbarui User ID & Password
                </button>
              </form>

              {/* Reset Demo Data */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-950">
                    Kembalikan Data Demo Awal
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mengembalikan seluruh katalog motor, warna, dan simulasi kredit ke data demo awal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data Demo</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
