# Beeget Fashion — Frontend Technical PRD (React + Tailwind)

---

## Table of Contents

1. [Purpose & Scope](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#1-purpose--scope)
2. [Architecture & Tech Stack](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#2-architecture--tech-stack)
3. [Design System & Styling](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#3-design-system--styling)
4. [Component Library & Folder Structure](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#4-component-library--folder-structure)
5. [Page-Level Specifications](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#5-page-level-specifications)
    - 5.1 [Home Page](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#51-home-page)
    - 5.2 [Catalog Page](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#52-catalog-page)
    - 5.3 [Product Detail Page](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#53-product-detail-page)
    - 5.4 [Cart Page](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#54-cart-page)
    - 5.5 [Checkout Page](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#55-checkout-page)
    - 5.6 [User Account Pages](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#56-user-account-pages)
    - 5.7 [Admin Dashboard](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#57-admin-dashboard)
    - 5.8 [CMS & Static Pages](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#58-cms--static-pages)
6. [State Management & Data Flow](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#6-state-management--data-flow)
7. [Routing & Navigation](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#7-routing--navigation)
8. [Performance & Best Practices](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#8-performance--best-practices)
9. [Testing Strategy](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#9-testing-strategy)
10. [CI/CD & Deployment](https://chatgpt.com/c/6851152a-cf70-8008-950f-d53a2cbb810e#10-ci-cd--deployment)

---

## 1. Purpose & Scope

Provide a modern, responsive React frontend built with Tailwind CSS, fully integrated with the Beeget Fashion ME*N backend, to deliver an engaging shopping experience for customers and a robust admin interface.

**Scope includes:**

- Public storefront (Home, Shop, Product Detail)
- Cart & checkout flows
- User account management
- Admin dashboard (CRUD, reporting)
- CMS-driven static pages

---

## 2. Architecture & Tech Stack

- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS v3.x (utility-first with custom theme)
- **Routing:** React Router v6
- **State:**
    - Global: React Context (AuthContext, CartContext)
    - Server: React Query for data fetching & caching
- **HTTP:** Axios with interceptors for JWT
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Yup validation
- **Icons:** Heroicons (React)
- **Bundler:** Vite for faster builds
- **Linting & Formatting:** ESLint + Prettier

---

## 3. Design System & Styling

### 3.1 Tailwind Theme Customization

```
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        teal: '#3FC1C9',
        charcoal: '#2B2B2B',
        'soft-pink': '#F6C6C6',
        gold: '#D4AF37',
      },
      fontFamily: {
        logo: ['CustomScript', 'cursive'],
        heading: ['Playfair Display', 'serif'],
        body: ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/aspect-ratio')],
};

```

### 3.2 CSS Utilities & Patterns

- **Containers:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Typography:**
    - Headings: `font-heading text-charcoal` with size classes
    - Body: `font-body text-base leading-relaxed`
- **Buttons:**
    - Primary: `bg-teal hover:bg-soft-pink text-white font-semibold py-2 px-4 rounded`
    - Secondary: `bg-white border border-charcoal text-charcoal py-2 px-4 rounded`
- **Cards:** `bg-white shadow-md rounded-lg overflow-hidden`
- **Spacing:** Use `space-y-6` and `gap-4` for vertical & grid spacing

---

## 4. Component Library & Folder Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.jsx   # uses Tailwind for responsive nav
│   │   ├── Footer.jsx
│   │   └── NotificationBar.jsx
│   ├── Common/
│   │   ├── Button.jsx   # wraps <button> with tailwind classes
│   │   ├── Input.jsx    # styled inputs
│   │   └── Modal.jsx    # fixed positioning, backdrop
│   ├── Home/
│   │   ├── Hero.jsx     # Tailwind carousel with Framer Motion
│   │   ├── CollectionCard.jsx
│   │   └── FeatureGrid.jsx
│   ├── Shop/
│   │   ├── FilterSidebar.jsx
│   │   ├── ProductCard.jsx
│   │   └── ProductGrid.jsx
│   ├── Product/
│   │   ├── ImageGallery.jsx
│   │   └── AddToCartForm.jsx
│   ├── Cart/
│   │   ├── CartItem.jsx
│   │   └── CartSummary.jsx
│   ├── Checkout/
│   │   ├── ShippingForm.jsx
│   │   └── PaymentForm.jsx
│   └── Admin/
│       ├── DataTable.jsx
│       └── ReportChart.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── CartContext.jsx
├── hooks/
│   ├── useAuth.js
│   └── useCart.js
├── pages/
│   ├── Home.jsx
│   ├── Shop.jsx
│   ├── Product.jsx
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Profile.jsx
│   ├── Orders.jsx
│   └── AdminDashboard.jsx
└── utils/
    ├── api.js       # axios instance
    └── validators.js

```

---

## 5. Page-Level Specifications

### 5.1 Home Page (`/`)

- **Hero:** full-bleed `h-screen` section with centered text/button.
- **Category Cards:** grid `grid-cols-1 sm:grid-cols-3 gap-6`.
- **Best Sellers:** horizontal scroll `flex space-x-4 overflow-x-auto`.
- **Testimonials:** `grid grid-cols-1 md:grid-cols-3 gap-6`.

### 5.2 Catalog Page (`/shop`)

- Sidebar `w-full lg:w-1/4 p-4`, main `w-full lg:w-3/4`.
- Filters using `@tailwindcss/forms` styles.

### 5.3 Product Detail (`/product/:slug`)

- Flex layout `flex flex-col lg:flex-row gap-8`.
- Gallery uses `aspect-w-1 aspect-h-1` plugin for squares.

### 5.4 Cart (`/cart`)

- Table rows `flex items-center space-x-4 p-4 bg-white rounded shadow`.

### 5.5 Checkout (`/checkout`)

- Two-column layout: form `lg:w-2/3`, summary `lg:w-1/3`.

### 5.6 Account Pages (`/account/*`)

- Forms `max-w-md mx-auto space-y-6`.

### 5.7 Admin (`/admin/*`)

- Dashboard grid `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6`.

### 5.8 CMS Pages

- Rich text `prose max-w-none` via `@tailwindcss/typography`.

---

## 6. State Management & Data Flow

- AuthContext stores `user` & `tokens` in `localStorage`.
- CartContext syncs with `POST/GET /cart` using React Query.
- Page data fetched via `useQuery` hooks with Tailwind-styled loading skeletons.

---

## 7. Routing & Navigation

- React Router nested routes for `/account/*` and `/admin/*`.
- `ProtectedRoute` component checks AuthContext.
- Scroll-to-top on route change via custom hook.

---

## 8. Performance & Best Practices

- Purge unused Tailwind classes via `content` config.
- Lazy-load images with `loading="lazy"` & `blur` placeholder.
- Split vendor code via Vite's dynamic import.

---

## 9. Testing Strategy

- Unit: Jest for utility functions & context.
- Component: React Testing Library for key components.
- E2E: Cypress for flows (search, add-to-cart, purchase).
- Visual Regression: Percy integration.

---

## 10. CI/CD & Deployment

- GitHub Actions: `npm run lint && npm run test && npm run build`.
- Deploy built `dist/` to Vercel for global CDN.
- Preview Deploys on PRs.

---

*End of Beeget Fashion Frontend PRD (React + Tailwind).*