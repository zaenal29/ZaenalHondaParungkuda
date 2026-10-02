import { DatabaseState, MotorModel, MotorVariant, MotorColor, MotorSpec, CreditSimulation } from '../src/types/index.ts';
import { hashPassword } from '../src/lib/auth.ts';

function studioUrl(model: string, variant: string, color: string, hex: string, secHex = '#18181B', cat = 'Matic'): string {
  const params = new URLSearchParams({
    model,
    variant,
    color,
    hex,
    sec: secHex,
    cat,
  });
  return `/api/motor-studio?${params.toString()}`;
}

export function createInitialDatabaseState(): DatabaseState {
  const defaultUsername = process.env.ADMIN_USER || 'admin';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'hondaparungkuda2026';
  const { hash, salt } = hashPassword(defaultPassword);

  const motorModels: MotorModel[] = [
    {
      id: 'model-beat',
      brand: 'Honda',
      name: 'Honda Beat',
      slug: 'honda-beat',
      category: 'Matic',
      tagline: 'Skutik Irit, Lincah & Favorit Keluarga Indonesia',
      description: 'All New Honda BeAT hadir dengan desain sporty kompak, mesin 110cc eSP generasi terbaru yang sangat irit bahan bakar, serta rangka eSAF yang lincah untuk mobilitas harian di Sukabumi.',
      isFeatured: true,
      sortOrder: 1,
    },
    {
      id: 'model-scoopy',
      brand: 'Honda',
      name: 'Honda Scoopy',
      slug: 'honda-scoopy',
      category: 'Matic',
      tagline: 'Totally Unique, Gaya Retro Modern Berkelas',
      description: 'Honda Scoopy memadukan desain ikonik retro modern dengan fitur Smart Key System, USB Power Charger, serta velg 12 inci dengan ban tubeless lebar yang nyaman.',
      isFeatured: true,
      sortOrder: 2,
    },
    {
      id: 'model-vario-125',
      brand: 'Honda',
      name: 'Honda Vario 125',
      slug: 'honda-vario-125',
      category: 'Matic',
      tagline: 'Make It Happen, Performa 125cc eSP Liquid Cooled',
      description: 'New Honda Vario 125 tampil agresif dengan V-Shape LED Headlight, bagasi luas 18 liter, ban lebih lebar, dan sistem Honda Smart Key untuk kenyamanan berkendara setiap hari.',
      isFeatured: true,
      sortOrder: 3,
    },
    {
      id: 'model-vario-160',
      brand: 'Honda',
      name: 'Honda Vario 160',
      slug: 'honda-vario-160',
      category: 'Matic',
      tagline: 'Bigger, Greater, Prouder dengan Mesin 160cc 4-Katup eSP+',
      description: 'Skutik premium sporti bermesin 160cc 4-valves eSP+ berpendingin cairan yang bertenaga, dilengkapi Full Digital Panel Meter, USB Charger, serta pilihan pengereman ABS & CBS.',
      isFeatured: true,
      sortOrder: 4,
    },
    {
      id: 'model-pcx',
      brand: 'Honda',
      name: 'Honda PCX',
      slug: 'honda-pcx',
      category: 'Matic',
      tagline: 'The Next Level of Pride & Comfort',
      description: 'Big scooter elegan dengan posisi berkendara rileks, bagasi ekstra luas 30 liter, fitur Honda Selectable Torque Control (HSTC), dan kemewahan kelas wahid.',
      isFeatured: true,
      sortOrder: 5,
    },
    {
      id: 'model-adv',
      brand: 'Honda',
      name: 'Honda ADV',
      slug: 'honda-adv',
      category: 'Matic',
      tagline: 'The SUV Pride, Penjelajah Segala Medan',
      description: 'Skutik penjelajah tangguh dengan Adjustable Windscreen, Twin Subtank Rear Suspension, Ground Clearance tinggi, serta mesin 160cc eSP+ yang responsif di tanjakan maupun perjalanan jauh.',
      isFeatured: true,
      sortOrder: 6,
    },
    {
      id: 'model-stylo',
      brand: 'Honda',
      name: 'Honda Stylo',
      slug: 'honda-stylo',
      category: 'Matic',
      tagline: 'Fashion Meets Power 160cc eSP+',
      description: 'Skutik fashionable klasik modern pertama di kelas 160cc yang memadukan tampilan bergaya Eropa dengan performa mesin 160cc eSP+ bertenaga tinggi.',
      isFeatured: true,
      sortOrder: 7,
    },
  ];

  const motorVariants: MotorVariant[] = [
    // Beat
    {
      id: 'var-beat-cbs',
      modelId: 'model-beat',
      name: 'Beat CBS',
      code: 'BEAT-CBS',
      otrPrice: 19000000,
      status: 'READY',
      promoBadge: 'DP Mulai Rp 1,5 Juta · Potongan Tenor',
      isActive: true,
    },
    {
      id: 'var-beat-cbs-iss',
      modelId: 'model-beat',
      name: 'Beat CBS ISS',
      code: 'BEAT-CBS-ISS',
      otrPrice: 19750000,
      status: 'READY',
      promoBadge: 'Gratis Jaket Eksklusif & Servis 4x',
      isActive: true,
    },
    {
      id: 'var-beat-smartkey',
      modelId: 'model-beat',
      name: 'Beat Smartkey',
      code: 'BEAT-SMARTKEY',
      otrPrice: 20300000,
      status: 'READY',
      promoBadge: 'Fitur Smart Key Anti Maling',
      isActive: true,
    },
    {
      id: 'var-beat-street',
      modelId: 'model-beat',
      name: 'Beat Street',
      code: 'BEAT-STREET',
      otrPrice: 19850000,
      status: 'READY',
      promoBadge: 'Velg 12 Inci · Naked Handlebar',
      isActive: true,
    },
    // Scoopy
    {
      id: 'var-scoopy-fashion',
      modelId: 'model-scoopy',
      name: 'Scoopy Fashion',
      code: 'SCOOPY-FSH',
      otrPrice: 22950000,
      status: 'READY',
      promoBadge: 'Voucher Apparel Resmi Honda',
      isActive: true,
    },
    {
      id: 'var-scoopy-prestige',
      modelId: 'model-scoopy',
      name: 'Scoopy Prestige',
      code: 'SCOOPY-PRS',
      otrPrice: 23750000,
      status: 'READY',
      promoBadge: 'Smart Key System · Velg Bronze',
      isActive: true,
    },
    // Vario 125
    {
      id: 'var-vario125-cbs',
      modelId: 'model-vario-125',
      name: 'Vario 125 CBS',
      code: 'V125-CBS',
      otrPrice: 23650000,
      status: 'READY',
      promoBadge: 'Subsidi DP Spesial Sukabumi',
      isActive: true,
    },
    {
      id: 'var-vario125-cbs-iss',
      modelId: 'model-vario-125',
      name: 'Vario 125 CBS-ISS',
      code: 'V125-ISS',
      otrPrice: 25300000,
      status: 'READY',
      promoBadge: 'Smart Key · Idling Stop System',
      isActive: true,
    },
    // Vario 160
    {
      id: 'var-vario160-cbs',
      modelId: 'model-vario-160',
      name: 'Vario 160 CBS',
      code: 'V160-CBS',
      otrPrice: 27600000,
      status: 'READY',
      promoBadge: 'Potongan Angsuran s/d Rp 75 Ribu/bln',
      isActive: true,
    },
    {
      id: 'var-vario160-abs',
      modelId: 'model-vario-160',
      name: 'Vario 160 ABS',
      code: 'V160-ABS',
      otrPrice: 30450000,
      status: 'READY',
      promoBadge: 'Double Disc Brake + Anti-Lock Braking System',
      isActive: true,
    },
    // PCX
    {
      id: 'var-pcx-cbs',
      modelId: 'model-pcx',
      name: 'PCX 160 CBS',
      code: 'PCX160-CBS',
      otrPrice: 33400000,
      status: 'READY',
      promoBadge: 'Ready Stock · Proses Cepat 1 Hari',
      isActive: true,
    },
    {
      id: 'var-pcx-abs',
      modelId: 'model-pcx',
      name: 'PCX 160 ABS',
      code: 'PCX160-ABS',
      otrPrice: 36900000,
      status: 'INDENT',
      promoBadge: 'Fitur HSTC + ABS Kelas Premium',
      isActive: true,
    },
    // ADV
    {
      id: 'var-adv-cbs',
      modelId: 'model-adv',
      name: 'ADV 160 CBS',
      code: 'ADV160-CBS',
      otrPrice: 36550000,
      status: 'READY',
      promoBadge: 'Bonus Helm Full-Face & Jaket Touring',
      isActive: true,
    },
    {
      id: 'var-adv-abs',
      modelId: 'model-adv',
      name: 'ADV 160 ABS',
      code: 'ADV160-ABS',
      otrPrice: 39850000,
      status: 'INDENT',
      promoBadge: 'HSTC + Twin Subtank Showa',
      isActive: true,
    },
    // Stylo
    {
      id: 'var-stylo-cbs',
      modelId: 'model-stylo',
      name: 'Stylo 160 CBS',
      code: 'STYLO-CBS',
      otrPrice: 28250000,
      status: 'READY',
      promoBadge: 'Desain Retro Modern 160cc Terpopuler',
      isActive: true,
    },
    {
      id: 'var-stylo-abs',
      modelId: 'model-stylo',
      name: 'Stylo 160 ABS',
      code: 'STYLO-ABS',
      otrPrice: 31250000,
      status: 'READY',
      promoBadge: 'Rem Cakram Depan & Belakang + ABS',
      isActive: true,
    },
  ];

  // Each variant gets multiple colors, each with its own distinct photo URL
  const motorColors: MotorColor[] = [
    // Beat CBS: Hitam, Merah, Putih, Biru (Matches prompt example!)
    {
      id: 'col-beat-cbs-biru',
      variantId: 'var-beat-cbs',
      name: 'Biru',
      hexCode: '#1D4ED8',
      secondaryHexCode: '#0F172A',
      imageUrl: studioUrl('Honda Beat', 'Beat CBS', 'Biru', '#1D4ED8', '#0F172A'),
      isDefault: true,
    },
    {
      id: 'col-beat-cbs-merah',
      variantId: 'var-beat-cbs',
      name: 'Merah',
      hexCode: '#DC2626',
      secondaryHexCode: '#18181B',
      imageUrl: '/src/assets/images/motor_matic_sporty_red_1790867362954.jpg',
      isDefault: false,
    },
    {
      id: 'col-beat-cbs-hitam',
      variantId: 'var-beat-cbs',
      name: 'Hitam',
      hexCode: '#18181B',
      secondaryHexCode: '#3F3F46',
      imageUrl: studioUrl('Honda Beat', 'Beat CBS', 'Hitam', '#18181B', '#DC2626'),
      isDefault: false,
    },
    {
      id: 'col-beat-cbs-putih',
      variantId: 'var-beat-cbs',
      name: 'Putih',
      hexCode: '#F8FAFC',
      secondaryHexCode: '#1E293B',
      imageUrl: studioUrl('Honda Beat', 'Beat CBS', 'Putih', '#F8FAFC', '#1E293B'),
      isDefault: false,
    },

    // Beat CBS ISS
    {
      id: 'col-beat-iss-hitam',
      variantId: 'var-beat-cbs-iss',
      name: 'Hitam',
      hexCode: '#18181B',
      secondaryHexCode: '#334155',
      imageUrl: studioUrl('Honda Beat', 'Beat CBS ISS', 'Hitam', '#18181B', '#334155'),
      isDefault: true,
    },
    {
      id: 'col-beat-iss-biru',
      variantId: 'var-beat-cbs-iss',
      name: 'Biru',
      hexCode: '#1E40AF',
      secondaryHexCode: '#0F172A',
      imageUrl: studioUrl('Honda Beat', 'Beat CBS ISS', 'Biru', '#1E40AF', '#0F172A'),
      isDefault: false,
    },
    {
      id: 'col-beat-iss-silver',
      variantId: 'var-beat-cbs-iss',
      name: 'Silver',
      hexCode: '#94A3B8',
      secondaryHexCode: '#1E293B',
      imageUrl: studioUrl('Honda Beat', 'Beat CBS ISS', 'Silver', '#94A3B8', '#1E293B'),
      isDefault: false,
    },

    // Beat Smartkey
    {
      id: 'col-beat-sk-hitam',
      variantId: 'var-beat-smartkey',
      name: 'Hitam Matte',
      hexCode: '#18181B',
      secondaryHexCode: '#CA8A04',
      imageUrl: studioUrl('Honda Beat', 'Beat Smartkey', 'Hitam Matte', '#18181B', '#CA8A04'),
      isDefault: true,
    },
    {
      id: 'col-beat-sk-biru',
      variantId: 'var-beat-smartkey',
      name: 'Biru Matte',
      hexCode: '#1E3A8A',
      secondaryHexCode: '#94A3B8',
      imageUrl: studioUrl('Honda Beat', 'Beat Smartkey', 'Biru Matte', '#1E3A8A', '#94A3B8'),
      isDefault: false,
    },
    {
      id: 'col-beat-sk-hijau',
      variantId: 'var-beat-smartkey',
      name: 'Hijau Matte',
      hexCode: '#14532D',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda Beat', 'Beat Smartkey', 'Hijau Matte', '#14532D', '#18181B'),
      isDefault: false,
    },

    // Beat Street
    {
      id: 'col-beat-st-hitam',
      variantId: 'var-beat-street',
      name: 'Hitam Street',
      hexCode: '#18181B',
      secondaryHexCode: '#EA580C',
      imageUrl: studioUrl('Honda Beat', 'Beat Street', 'Hitam Street', '#18181B', '#EA580C'),
      isDefault: true,
    },
    {
      id: 'col-beat-st-coklat',
      variantId: 'var-beat-street',
      name: 'Coklat Matte',
      hexCode: '#78350F',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda Beat', 'Beat Street', 'Coklat Matte', '#78350F', '#18181B'),
      isDefault: false,
    },

    // Scoopy Fashion
    {
      id: 'col-scoopy-fsh-cream',
      variantId: 'var-scoopy-fashion',
      name: 'Cream',
      hexCode: '#FEF3C7',
      secondaryHexCode: '#92400E',
      imageUrl: '/src/assets/images/motor_scooter_retro_cream_1790867381638.jpg',
      isDefault: true,
    },
    {
      id: 'col-scoopy-fsh-biru',
      variantId: 'var-scoopy-fashion',
      name: 'Biru',
      hexCode: '#2563EB',
      secondaryHexCode: '#FEF3C7',
      imageUrl: studioUrl('Honda Scoopy', 'Scoopy Fashion', 'Biru', '#2563EB', '#FEF3C7'),
      isDefault: false,
    },
    {
      id: 'col-scoopy-fsh-merah',
      variantId: 'var-scoopy-fashion',
      name: 'Merah',
      hexCode: '#DC2626',
      secondaryHexCode: '#F8FAFC',
      imageUrl: studioUrl('Honda Scoopy', 'Scoopy Fashion', 'Merah', '#DC2626', '#F8FAFC'),
      isDefault: false,
    },

    // Scoopy Prestige
    {
      id: 'col-scoopy-prs-putih',
      variantId: 'var-scoopy-prestige',
      name: 'Putih',
      hexCode: '#F8FAFC',
      secondaryHexCode: '#B45309',
      imageUrl: studioUrl('Honda Scoopy', 'Scoopy Prestige', 'Putih', '#F8FAFC', '#B45309'),
      isDefault: true,
    },
    {
      id: 'col-scoopy-prs-hitam',
      variantId: 'var-scoopy-prestige',
      name: 'Hitam',
      hexCode: '#18181B',
      secondaryHexCode: '#B45309',
      imageUrl: studioUrl('Honda Scoopy', 'Scoopy Prestige', 'Hitam', '#18181B', '#B45309'),
      isDefault: false,
    },

    // Vario 125 CBS
    {
      id: 'col-v125-cbs-merah',
      variantId: 'var-vario125-cbs',
      name: 'Merah',
      hexCode: '#DC2626',
      secondaryHexCode: '#18181B',
      imageUrl: '/src/assets/images/motor_matic_sporty_red_1790867362954.jpg',
      isDefault: true,
    },
    {
      id: 'col-v125-cbs-hitam',
      variantId: 'var-vario125-cbs',
      name: 'Hitam',
      hexCode: '#18181B',
      secondaryHexCode: '#DC2626',
      imageUrl: studioUrl('Honda Vario 125', 'Vario 125 CBS', 'Hitam', '#18181B', '#DC2626'),
      isDefault: false,
    },
    {
      id: 'col-v125-cbs-biru',
      variantId: 'var-vario125-cbs',
      name: 'Biru',
      hexCode: '#1D4ED8',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda Vario 125', 'Vario 125 CBS', 'Biru', '#1D4ED8', '#18181B'),
      isDefault: false,
    },

    // Vario 125 CBS-ISS
    {
      id: 'col-v125-iss-biru',
      variantId: 'var-vario125-cbs-iss',
      name: 'Biru Matte',
      hexCode: '#1E3A8A',
      secondaryHexCode: '#CA8A04',
      imageUrl: studioUrl('Honda Vario 125', 'Vario 125 CBS-ISS', 'Biru Matte', '#1E3A8A', '#CA8A04'),
      isDefault: true,
    },
    {
      id: 'col-v125-iss-putih',
      variantId: 'var-vario125-cbs-iss',
      name: 'Putih Matte',
      hexCode: '#F8FAFC',
      secondaryHexCode: '#CA8A04',
      imageUrl: studioUrl('Honda Vario 125', 'Vario 125 CBS-ISS', 'Putih Matte', '#F8FAFC', '#CA8A04'),
      isDefault: false,
    },
    {
      id: 'col-v125-iss-hitam',
      variantId: 'var-vario125-cbs-iss',
      name: 'Hitam Matte',
      hexCode: '#18181B',
      secondaryHexCode: '#CA8A04',
      imageUrl: studioUrl('Honda Vario 125', 'Vario 125 CBS-ISS', 'Hitam Matte', '#18181B', '#CA8A04'),
      isDefault: false,
    },

    // Vario 160 CBS
    {
      id: 'col-v160-cbs-merah',
      variantId: 'var-vario160-cbs',
      name: 'Merah',
      hexCode: '#B91C1C',
      secondaryHexCode: '#18181B',
      imageUrl: '/src/assets/images/motor_matic_sporty_red_1790867362954.jpg',
      isDefault: true,
    },
    {
      id: 'col-v160-cbs-hitam',
      variantId: 'var-vario160-cbs',
      name: 'Hitam',
      hexCode: '#18181B',
      secondaryHexCode: '#475569',
      imageUrl: studioUrl('Honda Vario 160', 'Vario 160 CBS', 'Hitam', '#18181B', '#475569'),
      isDefault: false,
    },
    {
      id: 'col-v160-cbs-biru',
      variantId: 'var-vario160-cbs',
      name: 'Biru Matte',
      hexCode: '#1E3A8A',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda Vario 160', 'Vario 160 CBS', 'Biru Matte', '#1E3A8A', '#18181B'),
      isDefault: false,
    },

    // Vario 160 ABS
    {
      id: 'col-v160-abs-hitam',
      variantId: 'var-vario160-abs',
      name: 'Hitam Matte',
      hexCode: '#18181B',
      secondaryHexCode: '#CA8A04',
      imageUrl: '/src/assets/images/motor_maxi_adventure_black_1790867393156.jpg',
      isDefault: true,
    },
    {
      id: 'col-v160-abs-putih',
      variantId: 'var-vario160-abs',
      name: 'Putih Matte',
      hexCode: '#F8FAFC',
      secondaryHexCode: '#CA8A04',
      imageUrl: studioUrl('Honda Vario 160', 'Vario 160 ABS', 'Putih Matte', '#F8FAFC', '#CA8A04'),
      isDefault: false,
    },

    // PCX 160 CBS
    {
      id: 'col-pcx-cbs-hitam',
      variantId: 'var-pcx-cbs',
      name: 'Hitam',
      hexCode: '#18181B',
      secondaryHexCode: '#94A3B8',
      imageUrl: '/src/assets/images/motor_maxi_adventure_black_1790867393156.jpg',
      isDefault: true,
    },
    {
      id: 'col-pcx-cbs-merah',
      variantId: 'var-pcx-cbs',
      name: 'Merah',
      hexCode: '#991B1B',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda PCX', 'PCX 160 CBS', 'Merah', '#991B1B', '#18181B'),
      isDefault: false,
    },
    {
      id: 'col-pcx-cbs-putih',
      variantId: 'var-pcx-cbs',
      name: 'Putih',
      hexCode: '#F8FAFC',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda PCX', 'PCX 160 CBS', 'Putih', '#F8FAFC', '#18181B'),
      isDefault: false,
    },

    // PCX 160 ABS
    {
      id: 'col-pcx-abs-hitam',
      variantId: 'var-pcx-abs',
      name: 'Hitam Gold',
      hexCode: '#18181B',
      secondaryHexCode: '#CA8A04',
      imageUrl: '/src/assets/images/motor_maxi_adventure_black_1790867393156.jpg',
      isDefault: true,
    },
    {
      id: 'col-pcx-abs-biru',
      variantId: 'var-pcx-abs',
      name: 'Biru Matte',
      hexCode: '#1E3A8A',
      secondaryHexCode: '#CA8A04',
      imageUrl: studioUrl('Honda PCX', 'PCX 160 ABS', 'Biru Matte', '#1E3A8A', '#CA8A04'),
      isDefault: false,
    },

    // ADV 160 CBS
    {
      id: 'col-adv-cbs-hitam',
      variantId: 'var-adv-cbs',
      name: 'Hitam',
      hexCode: '#18181B',
      secondaryHexCode: '#DC2626',
      imageUrl: '/src/assets/images/motor_maxi_adventure_black_1790867393156.jpg',
      isDefault: true,
    },
    {
      id: 'col-adv-cbs-merah',
      variantId: 'var-adv-cbs',
      name: 'Merah',
      hexCode: '#DC2626',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda ADV', 'ADV 160 CBS', 'Merah', '#DC2626', '#18181B'),
      isDefault: false,
    },
    {
      id: 'col-adv-cbs-putih',
      variantId: 'var-adv-cbs',
      name: 'Putih',
      hexCode: '#F8FAFC',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda ADV', 'ADV 160 CBS', 'Putih', '#F8FAFC', '#18181B'),
      isDefault: false,
    },

    // ADV 160 ABS
    {
      id: 'col-adv-abs-hitam',
      variantId: 'var-adv-abs',
      name: 'Hitam Matte',
      hexCode: '#18181B',
      secondaryHexCode: '#CA8A04',
      imageUrl: '/src/assets/images/motor_maxi_adventure_black_1790867393156.jpg',
      isDefault: true,
    },
    {
      id: 'col-adv-abs-hijau',
      variantId: 'var-adv-abs',
      name: 'Hijau Matte',
      hexCode: '#14532D',
      secondaryHexCode: '#CA8A04',
      imageUrl: studioUrl('Honda ADV', 'ADV 160 ABS', 'Hijau Matte', '#14532D', '#CA8A04'),
      isDefault: false,
    },

    // Stylo 160 CBS
    {
      id: 'col-stylo-cbs-cream',
      variantId: 'var-stylo-cbs',
      name: 'Cream',
      hexCode: '#FEF3C7',
      secondaryHexCode: '#18181B',
      imageUrl: '/src/assets/images/motor_scooter_retro_cream_1790867381638.jpg',
      isDefault: true,
    },
    {
      id: 'col-stylo-cbs-hitam',
      variantId: 'var-stylo-cbs',
      name: 'Hitam',
      hexCode: '#18181B',
      secondaryHexCode: '#475569',
      imageUrl: studioUrl('Honda Stylo', 'Stylo 160 CBS', 'Hitam', '#18181B', '#475569'),
      isDefault: false,
    },
    {
      id: 'col-stylo-cbs-merah',
      variantId: 'var-stylo-cbs',
      name: 'Merah',
      hexCode: '#DC2626',
      secondaryHexCode: '#18181B',
      imageUrl: studioUrl('Honda Stylo', 'Stylo 160 CBS', 'Merah', '#DC2626', '#18181B'),
      isDefault: false,
    },

    // Stylo 160 ABS
    {
      id: 'col-stylo-abs-hijau',
      variantId: 'var-stylo-abs',
      name: 'Hijau Royal',
      hexCode: '#064E3B',
      secondaryHexCode: '#92400E',
      imageUrl: studioUrl('Honda Stylo', 'Stylo 160 ABS', 'Hijau Royal', '#064E3B', '#92400E'),
      isDefault: true,
    },
    {
      id: 'col-stylo-abs-putih',
      variantId: 'var-stylo-abs',
      name: 'Putih Royal',
      hexCode: '#F8FAFC',
      secondaryHexCode: '#92400E',
      imageUrl: '/src/assets/images/motor_scooter_retro_cream_1790867381638.jpg',
      isDefault: false,
    },
    {
      id: 'col-stylo-abs-hitam',
      variantId: 'var-stylo-abs',
      name: 'Hitam Royal',
      hexCode: '#18181B',
      secondaryHexCode: '#92400E',
      imageUrl: studioUrl('Honda Stylo', 'Stylo 160 ABS', 'Hitam Royal', '#18181B', '#92400E'),
      isDefault: false,
    },
  ];

  // Specifications for each variant
  const motorSpecs: MotorSpec[] = motorVariants.map((variant) => {
    const is160 = variant.name.includes('160') || variant.name.includes('PCX') || variant.name.includes('ADV') || variant.name.includes('Stylo');
    const is125 = variant.name.includes('125');
    return {
      id: `spec-${variant.id}`,
      variantId: variant.id,
      engineType: is160
        ? '4-Langkah, 4-Katup, eSP+, Pendingin Cairan'
        : is125
        ? '4-Langkah, SOHC, eSP, Pendingin Cairan'
        : '4-Langkah, SOHC, eSP, Pendingin Udara',
      displacement: is160 ? '156,9 cc' : is125 ? '124,8 cc' : '109,5 cc',
      transmission: 'Otomatis, V-Matic',
      maxPower: is160 ? '11,3 kW (15,4 PS) / 8.500 rpm' : is125 ? '8,2 kW (11,1 PS) / 8.500 rpm' : '6,6 kW (9,0 PS) / 7.500 rpm',
      maxTorque: is160 ? '13,8 Nm / 7.000 rpm' : is125 ? '10,8 Nm / 5.000 rpm' : '9,2 Nm / 6.000 rpm',
      dimension: is160 ? '1.936 x 742 x 1.108 mm' : is125 ? '1.918 x 679 x 1.066 mm' : '1.876 x 669 x 1.080 mm',
      weight: is160 ? '118 - 133 kg' : is125 ? '111 kg' : '87 - 89 kg',
      tankCapacity: is160 ? '5,5 - 8,1 Liter' : is125 ? '5,5 Liter' : '4,2 Liter',
      frameType: is160 && (variant.name.includes('PCX') || variant.name.includes('ADV')) ? 'Double Cradle' : 'Tulang Punggung – eSAF (enhanced Smart Architecture Frame)',
      brakeSystem: variant.name.includes('ABS')
        ? 'Cakram Hidrolik Depan & Belakang dengan Anti-Lock Braking System (ABS)'
        : 'Cakram Hidrolik Depan, Tromol Belakang dengan Combi Brake System (CBS)',
      tireSize: is160
        ? 'Depan: 100/80 - 14M/C Tubeless · Belakang: 120/70 - 14M/C Tubeless'
        : 'Depan: 80/90 - 14M/C Tubeless · Belakang: 90/90 - 14M/C Tubeless',
      batteryType: 'MF 12V - 5Ah',
      features: variant.name.includes('Smartkey') || variant.name.includes('ABS') || variant.name.includes('Prestige') || variant.name.includes('ISS')
        ? 'Honda Smart Key System, Anti-Theft Alarm, Answer Back System, USB Power Charger, Full LED Headlight, Idling Stop System (ISS)'
        : 'LED Headlight, Combined Digital Panel Meter, Power Charger, Tuas Pengunci Rem, Bagasi Fungsional',
      extraNotes: 'Garansi Mesin 3 Tahun / 36.000 km · Garansi Rangka 5 Tahun Tanpa Batas Jarak Tempuh · Garansi PGM-FI 5 Tahun.',
    };
  });

  // Generate multiple DP options per variant (Type) — all colors in the same type share identical OTR, DP choices, and Tenor installments
  // Larger DP -> smaller monthly installment
  const creditSimulations: CreditSimulation[] = [
    {
      id: 'cred-var-beat-cbs-dp-2000000',
      modelId: 'model-beat',
      variantId: 'var-beat-cbs',
      colorId: 'ALL',
      colorName: 'Semua Warna',
      dp: 2000000,
      otr: 19000000,
      installments: { '11': 1890000, '17': 1325000, '23': 1045000, '29': 895000, '35': 785000 },
    },
    {
      id: 'cred-var-beat-cbs-dp-2500000',
      modelId: 'model-beat',
      variantId: 'var-beat-cbs',
      colorId: 'ALL',
      colorName: 'Semua Warna',
      dp: 2500000,
      otr: 19000000,
      installments: { '11': 1825000, '17': 1280000, '23': 1010000, '29': 865000, '35': 760000 },
    },
    {
      id: 'cred-var-beat-cbs-dp-3000000',
      modelId: 'model-beat',
      variantId: 'var-beat-cbs',
      colorId: 'ALL',
      colorName: 'Semua Warna',
      dp: 3000000,
      otr: 19000000,
      installments: { '11': 1760000, '17': 1240000, '23': 980000, '29': 840000, '35': 735000 },
    },
    {
      id: 'cred-var-beat-cbs-dp-4000000',
      modelId: 'model-beat',
      variantId: 'var-beat-cbs',
      colorId: 'ALL',
      colorName: 'Semua Warna',
      dp: 4000000,
      otr: 19000000,
      installments: { '11': 1630000, '17': 1155000, '23': 915000, '29': 785000, '35': 685000 },
    },
  ];

  // Generate 3 DP options for every other variant (Type) so each type has multiple DP choices (larger DP = smaller installment)
  for (const variant of motorVariants) {
    if (variant.id === 'var-beat-cbs') continue;
    const otr = variant.otrPrice;
    const baseDp =
      otr <= 21000000
        ? 2000000
        : otr <= 26000000
        ? 2500000
        : otr <= 32000000
        ? 3000000
        : 3500000;

    const dpOptions = [baseDp, baseDp + 500000, baseDp + 1000000, baseDp + 2000000];

    for (const dp of dpOptions) {
      const principal = Math.max(otr - dp, 5000000);
      const inst11 = Math.round((principal * 1.19) / 11 / 1000) * 1000;
      const inst17 = Math.round((principal * 1.28) / 17 / 1000) * 1000;
      const inst23 = Math.round((principal * 1.38) / 23 / 1000) * 1000;
      const inst29 = Math.round((principal * 1.48) / 29 / 1000) * 1000;
      const inst35 = Math.round((principal * 1.56) / 35 / 1000) * 1000;

      creditSimulations.push({
        id: `cred-${variant.id}-dp-${dp}`,
        modelId: variant.modelId,
        variantId: variant.id,
        colorId: 'ALL',
        colorName: 'Semua Warna',
        dp,
        otr,
        installments: {
          '11': inst11,
          '17': inst17,
          '23': inst23,
          '29': inst29,
          '35': inst35,
        },
      });
    }
  }

  return {
    users: [
      {
        id: 'user-admin-1',
        username: defaultUsername,
        passwordHash: hash,
        salt,
        role: 'admin',
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    siteSettings: {
      siteName: 'Zaenal Abidin Honda Parungkuda',
      companyName: 'PT Selamat Lestari Mandiri',
      branchName: 'Cabang Parungkuda',
      salesName: 'Zaenal Abidin',
      address: 'Jl. Siliwangi Depan Stasiun No.18, Parungkuda, Kecamatan Parungkuda, Kabupaten Sukabumi, Jawa Barat',
      whatsappNumber: '083806109569',
      whatsappDefaultMessage: 'Assalamualaikum Pak Zaenal Abidin, saya ingin berkonsultasi mengenai pembelian motor Honda di PT Selamat Lestari Mandiri Cabang Parungkuda.',
      logoUrl: '',
      faviconUrl: '',
      heroTitle: 'Temukan Motor Honda Impianmu di Parungkuda',
      heroSubtitle: 'Promo Honda Terbaru dengan Pilihan Kredit Ringan dan Cash Resmi PT Selamat Lestari Mandiri Cabang Parungkuda, Kabupaten Sukabumi.',
      heroImage: '/src/assets/images/hero_honda_showroom_1790867348852.jpg',
      heroPrimaryBtnText: 'Lihat Katalog Motor',
      heroPrimaryBtnLink: '#katalog',
      heroSecondaryBtnText: 'Chat WhatsApp Marketing',
      heroSecondaryBtnLink: 'whatsapp',
      aboutDescription:
        'PT Selamat Lestari Mandiri Cabang Parungkuda adalah dealer resmi sepeda motor Honda yang berlokasi strategis di Jl. Siliwangi Depan Stasiun No.18, Parungkuda, Kabupaten Sukabumi. Bersama Zaenal Abidin (Marketing Executive Resmi), kami melayani pembelian motor Honda secara Cash maupun Kredit dengan proses cepat, persyaratan mudah, transparan, serta pengiriman unit langsung ke rumah Anda di wilayah Sukabumi dan sekitarnya.',
      dealerPhotoUrl: '/src/assets/images/hero_honda_showroom_1790867348852.jpg',
      showroomPhotoUrl: '/src/assets/images/motor_matic_sporty_red_1790867362954.jpg',
      teamPhotoUrl: '/src/assets/images/dealer_showroom_handover_1790867406762.jpg',
      vision:
        'Menjadi dealer resmi sepeda motor Honda pilihan utama masyarakat Parungkuda dan Kabupaten Sukabumi melalui pelayanan pemasaran yang jujur, cepat, bersahabat, dan terpercaya.',
      missions: [
        'Memberikan kemudahan proses kepemilikan motor Honda baik secara tunai (Cash) maupun cicilan (Kredit) dengan angsuran yang transparan.',
        'Menyediakan informasi harga OTR, simulasi kredit, ketersediaan warna, dan promo terbaru secara akurat dan responsif.',
        'Mendampingi konsumen mulai dari konsultasi pemilihan tipe motor, penjemputan berkas persyaratan di rumah, hingga serah terima unit dan STNK/BPKB.',
        'Menjamin purna jual resmi melalui jaringan bengkel AHASS PT Selamat Lestari Mandiri serta garansi rangka 5 tahun.',
      ],
      operationalHours: 'Senin – Sabtu: 08.00 – 17.00 WIB · Minggu: 08.00 – 15.00 WIB (Layanan WhatsApp Online 24 Jam)',
      googleMapsAddress: 'Jl. Siliwangi Depan Stasiun No.18, Parungkuda, Kabupaten Sukabumi, Jawa Barat',
      facebookUrl: 'https://facebook.com/hondaparungkuda',
      instagramUrl: 'https://instagram.com/hondaparungkuda',
      tiktokUrl: 'https://tiktok.com/@hondaparungkuda',
      seoTitle: 'Zaenal Abidin Honda Parungkuda | Dealer Honda Sukabumi',
      seoDescription: 'Informasi motor Honda, promo, simulasi kredit, dan layanan pembelian Honda di Parungkuda, Kabupaten Sukabumi.',
      themePrimaryColor: '#DC2626',
    },
    tenors: [
      { id: 'tenor-11', months: 11, label: '11 Bulan', isActive: true },
      { id: 'tenor-17', months: 17, label: '17 Bulan', isActive: true },
      { id: 'tenor-23', months: 23, label: '23 Bulan', isActive: true },
      { id: 'tenor-29', months: 29, label: '29 Bulan', isActive: true },
      { id: 'tenor-35', months: 35, label: '35 Bulan', isActive: true },
    ],
    motorModels,
    motorVariants,
    motorColors,
    motorImages: [
      {
        id: 'img-1',
        variantId: 'var-beat-cbs',
        imageUrl: '/src/assets/images/motor_matic_sporty_red_1790867362954.jpg',
        caption: 'Desain Sporty & Rangka eSAF Lincah',
        sortOrder: 1,
      },
      {
        id: 'img-2',
        variantId: 'var-scoopy-fashion',
        imageUrl: '/src/assets/images/motor_scooter_retro_cream_1790867381638.jpg',
        caption: 'Gaya Retro Modern Eksklusif',
        sortOrder: 1,
      },
      {
        id: 'img-3',
        variantId: 'var-pcx-cbs',
        imageUrl: '/src/assets/images/motor_maxi_adventure_black_1790867393156.jpg',
        caption: 'Kemewahan Big Scooter 160cc eSP+',
        sortOrder: 1,
      },
    ],
    motorSpecs,
    creditSimulations,
    promos: [
      {
        id: 'promo-1',
        title: 'Gebyar Promo Kredit Honda Beat & Scoopy Parungkuda',
        description:
          'Dapatkan subsidi uang muka (DP) spesial mulai Rp 1.500.000 serta potongan tenor hingga 2x cicilan untuk pengajuan kredit All New Honda BeAT dan Honda Scoopy di wilayah Parungkuda, Cicurug, Cibadak, dan Kabupaten Sukabumi.',
        period: '1 Oktober – 30 November 2026',
        highlightText: 'DP Mulai Rp 1,5 Juta · Potongan 2x Angsuran',
        imageUrl: '/src/assets/images/motor_matic_sporty_red_1790867362954.jpg',
        whatsappText:
          'Assalamualaikum Pak Zaenal, saya tertarik dengan Gebyar Promo Kredit Honda Beat & Scoopy Parungkuda. Mohon info syaratnya.',
        linkUrl: '#simulasi',
        isActive: true,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'promo-2',
        title: 'Program Spesial Matic Besar 160cc: Vario 160, Stylo 160 & PCX 160',
        description:
          'Upgrade motor lama Anda ke lini skutik 160cc eSP+ bertenaga tinggi! Gratis oli mesin 1 tahun, servis gratis AHASS 4x, jaket eksklusif Honda, serta proses persetujuan leasing dalam 24 jam.',
        period: '1 Oktober – 31 Desember 2026',
        highlightText: 'Gratis Servis & Oli 1 Tahun + Jaket Eksklusif',
        imageUrl: '/src/assets/images/motor_maxi_adventure_black_1790867393156.jpg',
        whatsappText:
          'Assalamualaikum Pak Zaenal, saya ingin menanyakan Program Spesial Matic Besar 160cc (Vario 160 / Stylo / PCX).',
        linkUrl: '#simulasi',
        isActive: true,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'promo-3',
        title: 'Promo Cash & Repeat Order Konsumen Setia PT Selamat Lestari Mandiri',
        description:
          'Khusus konsumen yang pernah membeli motor di PT Selamat Lestari Mandiri atau pembelian secara Cash, nikmati cashback langsung dan pengantaran unit gratis hari yang sama untuk stok Ready.',
        period: 'Berlaku Sepanjang Tahun 2026',
        highlightText: 'Diskon Cash & Gratis Ongkir Se-Sukabumi',
        imageUrl: '/src/assets/images/motor_scooter_retro_cream_1790867381638.jpg',
        whatsappText:
          'Assalamualaikum Pak Zaenal, saya ingin menanyakan harga spesial pembelian Cash / Repeat Order Honda.',
        linkUrl: '#katalog',
        isActive: true,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    articles: [
      {
        id: 'art-1',
        title: 'Alur & Cara Pembelian Motor Honda Secara Kredit di Parungkuda',
        slug: 'alur-pembelian-motor-secara-kredit',
        category: 'Panduan Kredit',
        summary:
          'Panduan lengkap tahapan pengajuan kredit motor Honda dari rumah tanpa harus bolak-balik ke dealer hingga motor diantar ke garasi Anda.',
        content: `Membeli motor Honda secara kredit di PT Selamat Lestari Mandiri Cabang Parungkuda kini sangat praktis dan dapat diproses langsung dari rumah Anda.

1. Pilih Tipe Motor, Warna, DP & Tenor
Gunakan fitur Katalog dan Simulasi Kredit di website ini untuk melihat angsuran bulanan sesuai kemampuan anggaran Anda.

2. Konsultasi & Pengiriman Berkas via WhatsApp
Klik tombol "Ajukan / Pesan via WhatsApp" kepada Zaenal Abidin (083806109569). Anda cukup mengirimkan foto dokumen persyaratan melalui WhatsApp atau tim kami yang menjemput berkas ke rumah Anda.

3. Verifikasi / Survei Singkat Leasing
Tim leasing rekanan resmi (FIFGROUP, Adira Finance, OTO, MCF/MAF) akan melakukan verifikasi data singkat melalui telepon atau kunjungan ramah ke tempat tinggal.

4. Persetujuan (ACC) & Pengiriman Unit Motor
Setelah pengajuan disetujui, unit motor Honda baru langsung dikirim ke rumah Anda. Pembayaran uang muka (DP) dilakukan secara aman saat motor tiba di rumah (COD) atau di kasir resmi dealer.`,
        imageUrl: '/src/assets/images/dealer_showroom_handover_1790867406762.jpg',
        publishedDate: '2026-10-01',
        isPublished: true,
      },
      {
        id: 'art-2',
        title: 'Syarat Dokumen Pembelian Kredit & Cash Motor Honda',
        slug: 'syarat-dokumen-pembelian-kredit-dan-cash',
        category: 'Syarat & Dokumen',
        summary:
          'Daftar dokumen yang perlu disiapkan untuk pembelian tunai (Cash) maupun kredit bagi Karyawan, Wiraswasta, dan Perusahaan.',
        content: `Agar proses pengajuan motor Honda Anda berjalan lancar dan disetujui dalam waktu singkat, berikut adalah dokumen yang perlu dipersiapkan:

A. Syarat Pembelian Cash (Tunai):
• Foto KTP Pemohon (untuk domisili Sukabumi & sekitarnya)
• Foto Kartu Keluarga (KK) untuk keperluan registrasi STNK dan BPKB

B. Syarat Pembelian Kredit Perorangan (Karyawan / Umum):
• Foto KTP Pemohon dan KTP Pasangan (jika sudah menikah) atau KTP Orang Tua (jika belum menikah)
• Foto Kartu Keluarga (KK) terbaru
• Bukti penghasilan: Slip Gaji / ID Card Karyawan / Rekening Koran 3 bulan terakhir
• Bukti tempat tinggal: Rekening Listrik (Token/Pascabayar) atau PBB

C. Syarat Pembelian Kredit untuk Wiraswasta / Pedagang:
• Foto KTP Suami & Istri + Kartu Keluarga (KK)
• Foto tempat usaha / warung / SKU dari desa setempat

Seluruh dokumen cukup difoto dengan jelas dan dikirimkan ke WhatsApp Marketing Zaenal Abidin: 083806109569.`,
        imageUrl: '/src/assets/images/hero_honda_showroom_1790867348852.jpg',
        publishedDate: '2026-09-28',
        isPublished: true,
      },
      {
        id: 'art-3',
        title: 'Tips Cerdas Memilih DP dan Tenor Cicilan Motor yang Tepat',
        slug: 'tips-memilih-dp-dan-tenor-kredit-motor',
        category: 'Tips Finansial',
        summary:
          'Cara menentukan uang muka (DP) dan jangka waktu cicilan (11 hingga 35 bulan) agar cicilan bulanan tetap ringan.',
        content: `Banyak calon konsumen bingung menentukan antara DP rendah atau angsuran bulanan yang ringan. Berikut tips praktis dari kami:

1. Gunakan Aturan 30% Penghasilan Bulanan
Pastikan nominal angsuran bulanan motor tidak melebihi 30% dari total penghasilan bulanan bersih keluarga Anda agar kebutuhan harian tetap terjaga.

2. Keuntungan Memilih DP Lebih Besar
Semakin besar uang muka (DP) yang Anda bayarkan di awal, semakin kecil pokok pembiayaan sehingga cicilan bulanan jauh lebih hemat dan peluang persetujuan (ACC) leasing menjadi sangat tinggi.

3. Memilih Tenor: 11, 17, 23, 29, atau 35 Bulan?
• Tenor 11 – 17 Bulan: Cocok bagi Anda yang ingin cepat lunas dengan total bunga paling rendah.
• Tenor 23 – 29 Bulan: Pilihan paling seimbang antara besaran angsuran dan durasi kredit.
• Tenor 35 Bulan: Solusi terbaik untuk mendapatkan angsuran bulanan paling ringan.`,
        imageUrl: '/src/assets/images/motor_matic_sporty_red_1790867362954.jpg',
        publishedDate: '2026-09-24',
        isPublished: true,
      },
      {
        id: 'art-4',
        title: 'Informasi Pengambilan STNK, Plat Nomor, BPKB & Servis Gratis AHASS',
        slug: 'informasi-stnk-bpkb-dan-servis-ahass',
        category: 'Layanan Purna Jual',
        summary:
          'Estimasi waktu jadi STNK & Plat Nomor wilayah Kabupaten Sukabumi serta panduan klaim servis gratis KPB di bengkel AHASS.',
        content: `Setiap pembelian motor baru di PT Selamat Lestari Mandiri Cabang Parungkuda dilengkapi perlindungan resmi dan layanan administrasi kendaraan:

1. Estimasi STNK & Plat Nomor Resmi Samsat Sukabumi
Proses pembuatan STNK dan Plat Nomor untuk motor baru memakan waktu rata-rata 14 – 21 hari kerja. Saat STNK sudah selesai, kami akan langsung menghubungi Anda via WhatsApp dan STNK dapat diambil di dealer atau diantar ke rumah.

2. Pengambilan BPKB
• Untuk pembelian Cash: BPKB dapat diambil di dealer setelah selesai dari Samsat (estimasi 2 – 3 bulan).
• Untuk pembelian Kredit: BPKB disimpan dengan aman di kantor leasing resmi dan dapat diambil langsung setelah angsuran terakhir lunas.

3. Kupon Perawatan Berkala (KPB) & Garansi 5 Tahun
Gunakan fasilitas Servis Gratis hingga 4 kali di bengkel resmi AHASS PT Selamat Lestari Mandiri Parungkuda serta nikmati Garansi Rangka 5 Tahun tanpa batas jarak tempuh.`,
        imageUrl: '/src/assets/images/motor_scooter_retro_cream_1790867381638.jpg',
        publishedDate: '2026-09-19',
        isPublished: true,
      },
    ],
    testimonials: [
      {
        id: 'testi-1',
        customerName: 'Kak Andi Pratama',
        customerLocation: 'Parungkuda, Sukabumi',
        motorName: 'Honda Beat CBS Biru',
        handoverDate: '2026-09-29',
        caption:
          'Terima kasih Kak Andi sudah mempercayakan pembelian Honda Beat CBS kepada kami di PT Selamat Lestari Mandiri Cabang Parungkuda. Proses berkas via WhatsApp pagi, sore motor sudah mendarat di rumah!',
        customerPhotoUrl: '/src/assets/images/dealer_showroom_handover_1790867406762.jpg',
        handoverPhotoUrl: '/src/assets/images/dealer_showroom_handover_1790867406762.jpg',
        isPublished: true,
      },
      {
        id: 'testi-2',
        customerName: 'Ibu Siti Rahmawati',
        customerLocation: 'Cicurug, Sukabumi',
        motorName: 'Honda Scoopy Fashion Cream',
        handoverDate: '2026-09-25',
        caption:
          'Alhamdulillah serah terima unit Honda Scoopy Fashion Cream kepada Ibu Siti Rahmawati di Cicurug. Terima kasih atas kepercayaannya kepada Kang Zaenal Abidin Honda Parungkuda.',
        customerPhotoUrl: '/src/assets/images/motor_scooter_retro_cream_1790867381638.jpg',
        handoverPhotoUrl: '/src/assets/images/dealer_showroom_handover_1790867406762.jpg',
        isPublished: true,
      },
      {
        id: 'testi-3',
        customerName: 'Bapak Hendra Gunawan',
        customerLocation: 'Cibadak, Sukabumi',
        motorName: 'Honda PCX 160 CBS Hitam',
        handoverDate: '2026-09-18',
        caption:
          'Terima kasih Bapak Hendra Gunawan dari Cibadak yang telah meminang Honda PCX 160 CBS Hitam. Pelayanan ramah, DP transparan sesuai simulasi website, dan bonus helm + jaket lengkap!',
        customerPhotoUrl: '/src/assets/images/motor_maxi_adventure_black_1790867393156.jpg',
        handoverPhotoUrl: '/src/assets/images/dealer_showroom_handover_1790867406762.jpg',
        isPublished: true,
      },
    ],
    uploads: [],
  };
}
