import React, { useState } from 'react';
import { Menu, X, MessageCircle, ShieldCheck } from 'lucide-react';
import { SiteSettings } from '../types/index.ts';
import { buildWhatsappUrl } from '../utils/format.ts';

interface NavbarProps {
  settings: SiteSettings;
  isAdminAuthenticated: boolean;
  isPreviewMode: boolean;
  onOpenAdminLogin: () => void;
  onReturnToAdminDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isAdminAuthenticated,
  isPreviewMode,
  onOpenAdminLogin,
  onReturnToAdminDashboard,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Beranda', href: '#beranda' },
    { label: 'Katalog Motor', href: '#katalog' },
    { label: 'Simulasi Kredit', href: '#simulasi' },
    { label: 'Promo', href: '#promo' },
    { label: 'Tips & Panduan', href: '#tips' },
    { label: 'Testimoni', href: '#testimoni' },
    { label: 'Tentang Kami', href: '#tentang' },
    { label: 'Kontak', href: '#kontak' },
  ];

  const whatsappLink = buildWhatsappUrl(
    settings.whatsappNumber,
    settings.whatsappDefaultMessage
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      {/* Strict 3-Zone Top Bar Contract */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#beranda"
          className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-950 hover:text-red-600 transition-colors whitespace-nowrap truncate max-w-[230px] sm:max-w-none"
        >
          {settings.siteName}
        </a>

        {/* Zone 2: Clean text navigation links (max 5 visible on md, 6+ on xl) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.slice(0, 5).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-red-600 transition-colors whitespace-nowrap py-1 border-b-2 border-transparent hover:border-red-600"
            >
              {item.label}
            </a>
          ))}
          {navItems.slice(5).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hidden xl:inline-block hover:text-red-600 transition-colors whitespace-nowrap py-1 border-b-2 border-transparent hover:border-red-600"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAdminAuthenticated && isPreviewMode ? (
            <button
              type="button"
              onClick={onReturnToAdminDashboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Kembali ke Dashboard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={isAdminAuthenticated ? onReturnToAdminDashboard : onOpenAdminLogin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="Login Admin"
            >
              <span>Admin</span>
            </button>
          )}

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Buka menu navigasi"
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Hamburger Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-red-600 hover:bg-red-50/60 rounded-lg transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp: {settings.whatsappNumber}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (isAdminAuthenticated) {
                  onReturnToAdminDashboard();
                } else {
                  onOpenAdminLogin();
                }
              }}
              className="px-3 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg whitespace-nowrap cursor-pointer"
            >
              {isAdminAuthenticated ? 'Panel Admin' : 'Admin'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
