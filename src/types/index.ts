export interface User {
  id: string;
  username: string;
  role: 'admin';
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  companyName: string;
  branchName: string;
  salesName: string;
  address: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  logoUrl: string;
  faviconUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroPrimaryBtnText: string;
  heroPrimaryBtnLink: string;
  heroSecondaryBtnText: string;
  heroSecondaryBtnLink: string;
  aboutDescription: string;
  dealerPhotoUrl: string;
  showroomPhotoUrl: string;
  teamPhotoUrl: string;
  vision: string;
  missions: string[];
  operationalHours: string;
  googleMapsAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  seoTitle: string;
  seoDescription: string;
  themePrimaryColor: string;
}

export interface Tenor {
  id: string;
  months: number;
  label: string;
  isActive: boolean;
}

export interface MotorModel {
  id: string;
  brand: string;
  name: string;
  slug: string;
  category: 'Matic' | 'Sport' | 'Cub / Bebek' | 'BigBike';
  tagline: string;
  description: string;
  isFeatured: boolean;
  sortOrder: number;
}

export interface MotorVariant {
  id: string;
  modelId: string;
  name: string;
  code: string;
  otrPrice: number;
  status: 'READY' | 'INDENT';
  promoBadge: string;
  isActive: boolean;
}

export interface MotorColor {
  id: string;
  variantId: string;
  name: string;
  hexCode: string;
  secondaryHexCode?: string;
  imageUrl: string;
  isDefault: boolean;
}

export interface MotorImage {
  id: string;
  variantId: string;
  colorId?: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
}

export interface MotorSpec {
  id: string;
  variantId: string;
  engineType: string;
  displacement: string;
  transmission: string;
  maxPower: string;
  maxTorque: string;
  dimension: string;
  weight: string;
  tankCapacity: string;
  frameType: string;
  brakeSystem: string;
  tireSize: string;
  batteryType: string;
  features: string;
  extraNotes: string;
}

export interface CreditSimulation {
  id: string;
  modelId: string;
  variantId: string;
  colorId: string; // Can be specific colorId or 'ALL' if applies to all colors of that variant
  colorName: string; // e.g., 'Biru', 'Hitam', 'Semua Warna'
  dp: number;
  otr: number;
  installments: Record<string, number>; // key = tenor months string ("11", "17", "23", "29", "35"), value = monthly payment in IDR
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  period: string;
  highlightText: string;
  imageUrl: string;
  whatsappText: string;
  linkUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  publishedDate: string;
  isPublished: boolean;
}

export interface Testimonial {
  id: string;
  customerName: string;
  customerLocation: string;
  motorName: string;
  handoverDate: string;
  caption: string;
  customerPhotoUrl: string;
  handoverPhotoUrl: string;
  isPublished: boolean;
}

export interface DatabaseState {
  users: Array<{
    id: string;
    username: string;
    passwordHash: string;
    salt: string;
    role: 'admin';
    createdAt: string;
  }>;
  siteSettings: SiteSettings;
  tenors: Tenor[];
  motorModels: MotorModel[];
  motorVariants: MotorVariant[];
  motorColors: MotorColor[];
  motorImages: MotorImage[];
  motorSpecs: MotorSpec[];
  creditSimulations: CreditSimulation[];
  promos: Promo[];
  articles: Article[];
  testimonials: Testimonial[];
  uploads: Array<{
    id: string;
    filename: string;
    mimeType: string;
    dataUrl: string;
    createdAt: string;
  }>;
}

export interface PublicBootstrapData {
  siteSettings: SiteSettings;
  tenors: Tenor[];
  motorModels: MotorModel[];
  motorVariants: MotorVariant[];
  motorColors: MotorColor[];
  motorImages: MotorImage[];
  motorSpecs: MotorSpec[];
  creditSimulations: CreditSimulation[];
  promos: Promo[];
  articles: Article[];
  testimonials: Testimonial[];
}

export interface ExcelImportError {
  row: number;
  column?: string;
  message: string;
}

export interface ExcelImportResult {
  success: boolean;
  importedCount: number;
  updatedCount: number;
  errors: ExcelImportError[];
  message: string;
}
