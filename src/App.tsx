import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { PublicBootstrapData, User } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection, RemainingPublicSections } from './components/PublicSections.tsx';
import { CatalogAndCreditSection } from './components/CatalogAndCreditSection.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { testFirestoreConnection } from './firebase.ts';

export default function App() {
  const [data, setData] = useState<PublicBootstrapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Auth & Admin View State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('honda_admin_jwt');
    } catch {
      return null;
    }
  });
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');

  const fetchBootstrapData = useCallback(async () => {
    try {
      setError('');
      const res = await fetch('/api/bootstrap', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Gagal memuat data website.');
      }
      const json: PublicBootstrapData = await res.json();
      setData(json);

      // Update document title dynamically from siteSettings
      if (json.siteSettings?.seoTitle) {
        document.title = json.siteSettings.seoTitle;
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void testFirestoreConnection();
    fetchBootstrapData();
  }, [fetchBootstrapData]);

  // Verify existing session token if present
  useEffect(() => {
    if (!adminToken) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid session');
        return res.json();
      })
      .then((json) => {
        setAdminUser(json.user);
      })
      .catch(() => {
        setAdminToken(null);
        setAdminUser(null);
        setViewMode('public');
        try {
          sessionStorage.removeItem('honda_admin_jwt');
        } catch {
          // ignore
        }
      });
  }, [adminToken]);

  const handleLoginSuccess = (token: string, user: User) => {
    setAdminToken(token);
    setAdminUser(user);
    setLoginModalOpen(false);
    setViewMode('admin');
    try {
      sessionStorage.setItem('honda_admin_jwt', token);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    setViewMode('public');
    try {
      sessionStorage.removeItem('honda_admin_jwt');
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">
          Memuat katalog & simulasi kredit Zaenal Abidin Honda Parungkuda...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full space-y-4">
          <h1 className="font-display text-xl font-bold text-slate-950">
            Terjadi Kesalahan Koneksi
          </h1>
          <p className="text-sm text-slate-600">
            {error || 'Data website belum dapat dimuat saat ini.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchBootstrapData();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Halaman</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard when authenticated and in 'admin' viewMode
  if (adminToken && adminUser && viewMode === 'admin') {
    return (
      <AdminDashboard
        data={data}
        token={adminToken}
        user={adminUser}
        onRefresh={fetchBootstrapData}
        onPreviewWebsite={() => setViewMode('public')}
        onLogout={handleLogout}
        onUpdateToken={(newToken, newUser) => {
          setAdminToken(newToken);
          setAdminUser(newUser);
          try {
            sessionStorage.setItem('honda_admin_jwt', newToken);
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  // Render Public Consumer Website (with Preview banner if Admin is previewing)
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F8] text-slate-900">
      <Navbar
        settings={data.siteSettings}
        isAdminAuthenticated={Boolean(adminToken && adminUser)}
        isPreviewMode={Boolean(adminToken && adminUser && viewMode === 'public')}
        onOpenAdminLogin={() => setLoginModalOpen(true)}
        onReturnToAdminDashboard={() => setViewMode('admin')}
      />

      <main className="flex-1">
        <HeroSection data={data} />
        <CatalogAndCreditSection data={data} />
        <RemainingPublicSections
          data={data}
          isAdminAuthenticated={Boolean(adminToken && adminUser)}
          onOpenAdminLogin={() => setLoginModalOpen(true)}
          onOpenAdminDashboard={() => setViewMode('admin')}
        />
      </main>

      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
