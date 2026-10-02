export function formatRupiah(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function normalizeWhatsappNumber(phone: string): string {
  const digits = (phone || '083806109569').replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  return '62' + digits;
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsappNumber(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export interface OrderWhatsappPayload {
  customerName: string;
  customerAddress: string;
  customerJob: string;
  customerPhone?: string;
  motorModelName: string;
  motorVariantName: string;
  colorName?: string;
  otr?: number;
  dp: number;
  tenor: number;
  installment: number;
}

export function buildOrderWhatsappMessage(payload: OrderWhatsappPayload): string {
  const lines = [
    'Assalamualaikum, saya ingin mendapatkan informasi mengenai motor Honda.',
    '',
    'Nama:',
    payload.customerName.trim(),
    '',
    'Alamat:',
    payload.customerAddress.trim(),
    '',
    'Pekerjaan:',
    payload.customerJob.trim(),
  ];

  if (payload.customerPhone && payload.customerPhone.trim()) {
    lines.push('', 'No. HP / WhatsApp:', payload.customerPhone.trim());
  }

  lines.push(
    '',
    'Pesanan:',
    `Tipe Motor: ${payload.motorModelName} ${payload.motorVariantName}`.trim()
  );

  if (payload.otr && payload.otr > 0) {
    lines.push(`Harga OTR: ${formatRupiah(payload.otr)}`);
  }

  lines.push(
    `DP: ${formatRupiah(payload.dp)}`,
    `Tenor: ${payload.tenor} bulan`,
    `Angsuran: ${formatRupiah(payload.installment)}/bulan`,
    '',
    'Mohon informasi selanjutnya.',
    'Terima kasih.'
  );

  return lines.join('\n');
}

export function buildColorStudioSvgDataUri(
  modelName: string,
  variantName: string,
  colorName: string,
  primaryHex: string,
  secondaryHex: string = '#18181B',
  category: string = 'Matic'
): string {
  const safePrimary = primaryHex || '#DC2626';
  const safeSecondary = secondaryHex || '#18181B';
  const isLight =
    safePrimary.toLowerCase() === '#ffffff' ||
    safePrimary.toLowerCase() === '#f8fafc' ||
    safePrimary.toLowerCase() === '#f5f5dc' ||
    safePrimary.toLowerCase() === '#fef3c7';
  const strokeAccent = isLight ? '#CBD5E1' : safePrimary;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <radialGradient id="studioBg" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="65%" stop-color="#F1F5F9"/>
        <stop offset="100%" stop-color="#E2E8F0"/>
      </radialGradient>
      <linearGradient id="bodyPaint" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${safePrimary}"/>
        <stop offset="60%" stop-color="${safePrimary}"/>
        <stop offset="100%" stop-color="${safeSecondary}"/>
      </linearGradient>
      <linearGradient id="trimPaint" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1E293B"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
      <filter id="floorShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      </filter>
    </defs>

    <!-- Studio Backdrop -->
    <rect width="800" height="600" fill="url(#studioBg)"/>
    <line x1="0" y1="450" x2="800" y2="450" stroke="#CBD5E1" stroke-width="1"/>
    
    <!-- Subtle Studio Lighting Arc -->
    <path d="M 120 450 Q 400 415 680 450" fill="none" stroke="${strokeAccent}" stroke-width="2" opacity="0.35"/>

    <!-- Floor Shadow -->
    <ellipse cx="400" cy="452" rx="235" ry="20" fill="#0F172A" opacity="0.22" filter="url(#floorShadow)"/>

    <!-- Rear Wheel -->
    <g transform="translate(225, 375)">
      <circle cx="0" cy="0" r="74" fill="#0F172A"/>
      <circle cx="0" cy="0" r="54" fill="#334155"/>
      <circle cx="0" cy="0" r="46" fill="#E2E8F0"/>
      <circle cx="0" cy="0" r="18" fill="#1E293B"/>
      <line x1="-44" y1="0" x2="44" y2="0" stroke="#1E293B" stroke-width="6"/>
      <line x1="0" y1="-44" x2="0" y2="44" stroke="#1E293B" stroke-width="6"/>
      <line x1="-31" y1="-31" x2="31" y2="31" stroke="#1E293B" stroke-width="5"/>
    </g>

    <!-- Front Wheel -->
    <g transform="translate(575, 375)">
      <circle cx="0" cy="0" r="74" fill="#0F172A"/>
      <circle cx="0" cy="0" r="54" fill="#334155"/>
      <circle cx="0" cy="0" r="46" fill="#E2E8F0"/>
      <circle cx="0" cy="0" r="26" fill="none" stroke="#94A3B8" stroke-width="5" stroke-dasharray="12 6"/>
      <circle cx="0" cy="0" r="16" fill="#DC2626"/>
      <line x1="-44" y1="0" x2="44" y2="0" stroke="#1E293B" stroke-width="6"/>
      <line x1="0" y1="-44" x2="0" y2="44" stroke="#1E293B" stroke-width="6"/>
      <line x1="31" y1="-31" x2="-31" y2="31" stroke="#1E293B" stroke-width="5"/>
    </g>

    <!-- Exhaust & CVT Crankcase -->
    <path d="M 160 375 L 295 375 L 310 345 L 155 340 Z" fill="#1E293B"/>
    <path d="M 245 360 L 140 315 L 132 330 L 240 378 Z" fill="#334155" stroke="#475569" stroke-width="2"/>

    <!-- Underbody & Step Floor -->
    <path d="M 270 365 L 485 365 L 520 275 L 455 275 L 420 335 L 315 335 Z" fill="url(#trimPaint)"/>

    <!-- Rear Body Fairing (Painted in Selected Color) -->
    <path d="M 155 255 Q 245 225 365 260 L 340 335 L 185 315 Z" fill="url(#bodyPaint)" stroke="#0F172A" stroke-width="2"/>
    <!-- Accent Stripe on Rear Fairing -->
    <path d="M 185 272 L 330 285 L 320 302 L 195 286 Z" fill="${safeSecondary}" opacity="0.75"/>

    <!-- Ergonomic Dual Seat -->
    <path d="M 175 248 Q 250 212 315 236 Q 360 250 385 246 L 365 272 L 170 262 Z" fill="#0F172A"/>
    <!-- Rear Grab Bar -->
    <path d="M 175 248 L 130 235 L 140 250 L 175 260 Z" fill="#334155"/>

    <!-- Front Shield & Aerodynamic Cowl (Painted in Selected Color) -->
    <path d="M 435 338 L 485 175 L 555 190 L 585 272 L 505 358 Z" fill="url(#bodyPaint)" stroke="#0F172A" stroke-width="2"/>
    <!-- Front Fender (Painted in Selected Color) -->
    <path d="M 515 320 Q 575 290 630 335 L 605 352 Q 565 322 522 342 Z" fill="url(#bodyPaint)" stroke="#0F172A" stroke-width="1.5"/>

    <!-- Front Fork -->
    <line x1="518" y1="265" x2="575" y2="375" stroke="#475569" stroke-width="14" stroke-linecap="round"/>

    <!-- LED Headlight Cluster -->
    <polygon points="555,212 584,258 545,264" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5"/>

    <!-- Handlebar & Windshield Visor -->
    <path d="M 465 175 L 525 135 L 542 168 L 488 182 Z" fill="#0F172A" opacity="0.88"/>
    <line x1="445" y1="162" x2="488" y2="168" stroke="#0F172A" stroke-width="8" stroke-linecap="round"/>
    <circle cx="445" cy="136" r="12" fill="#1E293B"/>
    <line x1="452" y1="145" x2="468" y2="164" stroke="#334155" stroke-width="4"/>

    <!-- Studio Info Badge -->
    <g transform="translate(48, 48)">
      <text x="0" y="0" font-family="sans-serif" font-size="13" font-weight="700" fill="#DC2626" letter-spacing="1.5">HONDA STUDIO · ${category.toUpperCase()}</text>
      <text x="0" y="30" font-family="sans-serif" font-size="26" font-weight="800" fill="#0F172A">${modelName} — ${variantName}</text>
      <text x="0" y="54" font-family="sans-serif" font-size="15" font-weight="600" fill="#475569">Pilihan Warna: ${colorName}</text>
    </g>

    <!-- Color Swatch Indicator Bottom Right -->
    <g transform="translate(620, 515)">
      <rect x="0" y="0" width="132" height="42" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
      <circle cx="22" cy="21" r="11" fill="${safePrimary}" stroke="#0F172A" stroke-width="1.5"/>
      <text x="42" y="26" font-family="sans-serif" font-size="12" font-weight="700" fill="#0F172A">${colorName.slice(0, 12)}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
