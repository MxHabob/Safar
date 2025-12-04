# هيكل المكونات - Component Structure

## 📁 تنظيم الملفات المقترح

```
web/src/
├── components/
│   ├── listings/              # مكونات العقارات
│   │   ├── listing-card.tsx
│   │   ├── listing-gallery.tsx
│   │   ├── listing-header.tsx
│   │   ├── listing-amenities.tsx
│   │   └── listing-reviews.tsx
│   │
│   ├── search/                # مكونات البحث
│   │   ├── hero-search-bar.tsx
│   │   ├── filters-sidebar.tsx
│   │   ├── search-results.tsx
│   │   ├── map-view.tsx
│   │   └── price-filter.tsx
│   │
│   ├── booking/               # مكونات الحجز
│   │   ├── booking-widget.tsx
│   │   ├── date-range-picker.tsx
│   │   ├── guest-selector.tsx
│   │   └── booking-summary.tsx
│   │
│   ├── travel/                # مكونات السفر
│   │   ├── ai-trip-planner-form.tsx
│   │   ├── travel-guide-card.tsx
│   │   ├── destination-card.tsx
│   │   └── trip-plan-card.tsx
│   │
│   ├── dashboard/             # مكونات Dashboard
│   │   ├── stats-card.tsx
│   │   ├── upcoming-bookings.tsx
│   │   ├── recent-activity.tsx
│   │   └── revenue-chart.tsx
│   │
│   ├── host/                  # مكونات المضيف
│   │   ├── host-stats.tsx
│   │   ├── listing-management.tsx
│   │   └── booking-management.tsx
│   │
│   ├── shared/                # مكونات مشتركة (موجودة)
│   │   ├── blur-image.tsx
│   │   ├── framed-photo.tsx
│   │   ├── photo-carousel.tsx
│   │   └── ...
│   │
│   └── ui/                    # مكونات UI الأساسية (موجودة)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
├── app/
│   ├── (home)/                # الصفحات العامة
│   │   ├── page.tsx           # الصفحة الرئيسية (تحديث)
│   │   ├── listings/          # صفحات العقارات
│   │   │   ├── page.tsx       # قائمة العقارات
│   │   │   └── [slug]/        # تفاصيل العقار
│   │   │       └── page.tsx
│   │   ├── search/            # صفحة البحث
│   │   │   └── page.tsx
│   │   └── travel-guides/    # دليل السفر
│   │       ├── page.tsx
│   │       └── [slug]/
│   │           └── page.tsx
│   │
│   ├── (app)/                 # الصفحات المحمية
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── messages/
│   │   ├── travel-plans/
│   │   └── ...
│   │
│   └── (host)/                # صفحات المضيف
│       ├── host/
│       │   ├── listings/
│       │   ├── bookings/
│       │   └── analytics/
│
└── lib/
    ├── hooks/                 # Custom hooks
    │   ├── use-listings.ts
    │   ├── use-booking.ts
    │   ├── use-search.ts
    │   └── use-trip-planner.ts
    │
    └── utils/                 # Utilities
        ├── format-price.ts
        ├── format-date.ts
        └── ...
```

---

## 🧩 المكونات الرئيسية

### 1. ListingCard Component

```tsx
// components/listings/listing-card.tsx
interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    location: string;
    price: number;
    currency: string;
    rating: number;
    reviewCount: number;
    images: string[];
    blurhash?: string;
  };
  variant?: 'default' | 'compact' | 'featured';
}

export function ListingCard({ listing, variant = 'default' }: ListingCardProps) {
  // استخدام FramedPhoto style للصورة الرئيسية
  // عرض المعلومات الأساسية
  // تصميم minimal وأنيق
}
```

**التصميم:**
- صورة رئيسية (FramedPhoto style)
- العنوان والموقع
- التقييم وعدد المراجعات
- السعر
- Hover effect للتفاعل

---

### 2. HeroSearchBar Component

```tsx
// components/search/hero-search-bar.tsx
interface HeroSearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export function HeroSearchBar({ onSearch, initialFilters }: HeroSearchBarProps) {
  // شريط بحث كبير وبارز
  // فلاتر: الموقع، التواريخ، الضيوف
  // تصميم minimal مع focus على الوظيفة
}
```

**الميزات:**
- Location autocomplete (Mapbox Geocoder)
- Date range picker
- Guest selector
- Search button prominent

---

### 3. BookingWidget Component

```tsx
// components/booking/booking-widget.tsx
interface BookingWidgetProps {
  listing: Listing;
  onBook: (bookingData: BookingData) => void;
  sticky?: boolean;
}

export function BookingWidget({ listing, onBook, sticky }: BookingWidgetProps) {
  // عرض السعر
  // Date picker
  // Guest selector
  // عرض السعر الإجمالي
  // زر الحجز
}
```

**التصميم:**
- Card design minimal
- معلومات واضحة
- Sticky على mobile
- Loading states

---

### 4. ListingGallery Component

```tsx
// components/listings/listing-gallery.tsx
interface ListingGalleryProps {
  images: ListingImage[];
  primaryImage?: string;
}

export function ListingGallery({ images, primaryImage }: ListingGalleryProps) {
  // Carousel للصور
  // Lightbox للعرض الكامل
  // Navigation dots
  // استخدام BlurImage للتحميل السلس
}
```

**الميزات:**
- Full-screen lightbox
- Keyboard navigation
- Touch gestures
- Blurhash placeholders

---

### 5. FiltersSidebar Component

```tsx
// components/search/filters-sidebar.tsx
interface FiltersSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  resultsCount?: number;
}

export function FiltersSidebar({ filters, onFiltersChange, resultsCount }: FiltersSidebarProps) {
  // فلاتر منظمة
  // Price range slider
  // Property type checkboxes
  // Amenities checkboxes
  // Clear filters button
}
```

**التصميم:**
- Accordion style للفلاتر
- Clear visual hierarchy
- Mobile-friendly (drawer)

---

### 6. AITripPlannerForm Component

```tsx
// components/travel/ai-trip-planner-form.tsx
interface AITripPlannerFormProps {
  onSubmit: (data: TripPlannerRequest) => Promise<void>;
}

export function AITripPlannerForm({ onSubmit }: AITripPlannerFormProps) {
  // نموذج شامل
  // Natural language input
  // Budget selector
  // Travel style selector
  // Loading state أثناء الإنشاء
}
```

**الميزات:**
- Textarea كبير للطلب النصي
- Visual feedback
- Progress indicator
- Results display

---

## 🎨 Design Tokens

### Colors (إضافة إلى globals.css):

```css
:root {
  /* Travel Theme Colors */
  --travel-primary: oklch(0.6 0.15 200);      /* Soft Blue */
  --travel-accent: oklch(0.55 0.22 27);       /* Warm Red */
  --travel-success: oklch(0.6 0.15 150);      /* Green */
  
  /* Status Colors */
  --status-available: oklch(0.6 0.15 150);
  --status-booked: oklch(0.5 0.15 0);
  --status-pending: oklch(0.7 0.15 80);
  
  /* Price Colors */
  --price-highlight: oklch(0.55 0.22 27);
  --price-discount: oklch(0.6 0.15 150);
}
```

### Typography Scale:

```css
/* Headings */
--text-h1: 2.5rem;    /* 40px */
--text-h2: 2rem;      /* 32px */
--text-h3: 1.5rem;    /* 24px */
--text-h4: 1.25rem;   /* 20px */

/* Body */
--text-body: 1rem;    /* 16px */
--text-small: 0.875rem; /* 14px */
--text-xs: 0.75rem;   /* 12px */
```

### Spacing Scale:

```css
--space-xs: 0.25rem;  /* 4px */
--space-sm: 0.5rem;   /* 8px */
--space-md: 1rem;     /* 16px */
--space-lg: 1.5rem;   /* 24px */
--space-xl: 2rem;     /* 32px */
--space-2xl: 3rem;    /* 48px */
```

---

## 🔄 State Management

### استخدام Zustand للـ State:

```tsx
// lib/stores/search-store.ts
import { create } from 'zustand';

interface SearchState {
  filters: SearchFilters;
  results: Listing[];
  loading: boolean;
  setFilters: (filters: SearchFilters) => void;
  search: () => Promise<void>;
  clearFilters: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  filters: {},
  results: [],
  loading: false,
  setFilters: (filters) => set({ filters }),
  search: async () => {
    set({ loading: true });
    // API call
    set({ loading: false });
  },
  clearFilters: () => set({ filters: {} }),
}));
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* sm */
--breakpoint-md: 768px;   /* md */
--breakpoint-lg: 1024px;  /* lg */
--breakpoint-xl: 1280px;  /* xl */
--breakpoint-2xl: 1536px; /* 2xl */
```

### Layout Adaptations:

- **Mobile (< 768px)**:
  - Single column layout
  - Filters في drawer
  - Sticky booking widget
  - Full-width images

- **Tablet (768px - 1024px)**:
  - Two column layout
  - Sidebar filters
  - Grid listings

- **Desktop (> 1024px)**:
  - Split-screen layout (حيثما يناسب)
  - Sidebar filters
  - Multi-column grids

---

## 🚀 Performance Optimizations

### 1. Image Optimization:
- استخدام `next/image` مع Blurhash
- Lazy loading للصور
- Responsive images
- WebP/AVIF formats

### 2. Code Splitting:
- Dynamic imports للمكونات الكبيرة
- Route-based code splitting
- Component lazy loading

### 3. Caching:
- React Query للـ API caching
- Static page generation حيثما أمكن
- ISR للصفحات الديناميكية

---

## ✅ Best Practices

1. **Component Composition**: بناء مكونات صغيرة وقابلة لإعادة الاستخدام
2. **Type Safety**: استخدام TypeScript بشكل كامل
3. **Accessibility**: ARIA labels و semantic HTML
4. **Performance**: تحسين الأداء من البداية
5. **Testing**: كتابة tests للمكونات الحرجة

---

**آخر تحديث**: 2025

