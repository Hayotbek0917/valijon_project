# POS — Do'kon boshqaruv tizimi

React + Vite asosidagi do'kon (POS) boshqaruv paneli.

## Texnologiyalar

- React 19, Vite 8, React Router
- Material UI, Tailwind CSS 4, Recharts
- Ma'lumotlar: Django REST API + PostgreSQL (JWT auth)

## Backend bilan bog'lanish

Frontend Django API ga ulangan. Ishga tushirish:

```bash
# 1. Backend (loyiha ildizida)
uv run python manage.py migrate
uv run python manage.py seed_pos_demo
uv run python manage.py runserver

# 2. Frontend
cd Pos
cp .env.example .env   # birinchi marta
bun install
bun run dev
```

`.env` da `VITE_API_URL=http://localhost:8000` bo'lishi kerak.

Demo loginlar (backend seed): `admin` / `123`, `boss` / `123`, `manager` / `123`, `kassir` / `123`

## Loyiha tuzilmasi

```
src/
├── App.jsx
├── main.jsx
├── config/
│   ├── navigation.js      # Sidebar va sahifa sarlavhalari
│   ├── constants.js       # Ranglar, sidebar o'lchamlari
│   └── dealerProducts.js  # Diler buyurtma mahsulot sozlamalari
├── context/
│   └── AppContext.jsx     # Global holat (mahsulot, sklad, dilerlar, agentlar)
├── data/
│   └── initialData.js     # Demo boshlang'ich ma'lumotlar
├── routes/
│   └── AppRoutes.jsx
├── components/
│   ├── layout/            # Layout, Sidebar (yangi dizayn), Header
│   └── ui/
├── pages/
│   ├── Agents.jsx         # Agentlar
│   ├── DealerOrders.jsx   # Dilerlar → Zakaz
│   ├── DealerReceipts.jsx # Dilerlar → Prixod
│   └── …
└── utils/
```

## Navigatsiya (yangi dizayn)

| Yo'l | Sahifa |
|------|--------|
| `/` | Dashboard |
| `/pos` | Kassa |
| `/products` | Mahsulotlar va qoldiq |
| `/agents` | Agentlar |
| `/dilerlar/zakaz` | Diler buyurtma |
| `/dilerlar/prixod` | Diler qabul (prixod) |
| `/ai-analytics` | AI tahlil |
| `/expire-management` | Yaroqlilik muddati |
| `/reports` | Hisobot |
| `/settings` | Sozlamalar |

Eski sahifalar (menyuda yo'q): `/suppliers`, `/purchase-orders`

## Rollar

| Rol | Login | Parol | Asosiy kirish |
|-----|-------|-------|----------------|
| Admin | `admin` | `123` | `/` — barcha menyular, xodimlar va tizim sozlamalari |
| Boss | `boss` | `123` | `/` — moliyaviy tahlil, AI Analytica; sozlamalarda faqat profil va market (ko'rish) |
| Manager | `manager` | `123` | `/` — operatsiya (sklad, dilerlar); foyda kartochkalari yashirin |
| Kassir | `kassir` | `123` | `/pos` — faqat POS va mahsulotlar (read-only) |

Admin yangi xodimlarni **Sozlamalar → Xodimlar** bo'limidan rol bilan qo'shadi.

## Ishga tushirish

```bash
bun install
bun run dev
```
