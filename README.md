#Správa firemních dat

Lokální aplikace pro správu smluv, vozového parku a majetku s role-based access control.

## ✨ Funkce

- **📋 Správa smluv** - Evidence smluv s termíny, sledování vypršení
- **🚗 Vozový park** - Správa vozidel, STK, pojištění, údržba
- **🏠 Majetek** - Inventář majetku, revize, záruky
- **⚡ Dashboard** - Přehled upozornění a stav všech dat
- **🔒 Role-based access** - Přístup podle role (admin, smlouvy, auta, majetek)
- **🎯 Filtrování a vyhledávání** - Snadná orientace v datech

## 🛠️ Technologický stack

- **Backend:** Node.js + Express + SQLite
- **Frontend:** React + Axios
- **Autentizace:** Dummy login (pro produkci lze napojit na Active Directory)

## 📋 Požadavky

- Node.js v18+ (https://nodejs.org/)
- npm (součást Node.js)
- Git (volitelně pro clone projektu)

## 🚀 Instalace & spuštění

### 1. Naklonuj projekt nebo stáhni soubory

```bash
git clone <repo-url> tomas-datify
cd tomas-datify
```

### 2. Spusť backend

```bash
cd backend
npm install
npm run dev
```

Backend poběží na `http://localhost:3001`

### 3. V NOVÉM terminálu spusť frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend poběží na `http://localhost:3000`

### 4. Otevři prohlížeč

Jdi na: **http://localhost:3000**

## 🔑 Přihlášení (Demo)

```
Email: demo@tomas.cz
Heslo: demo

Role (vyber si jednu):
- admin (vidí všechno)
- smlouvy (vidí jen smlouvy)
- auta (vidí jen vozový park)
- majetek (vidí jen majetek)
```

## 📂 Struktura projektu

```
tomas-datify/
├── backend/
│   ├── src/
│   │   ├── server.js          (hlavní server)
│   │   ├── database.js        (SQLite setup)
│   │   └── routes/
│   │       ├── auth.js        (autentizace)
│   │       ├── contracts.js   (smlouvy)
│   │       ├── vehicles.js    (vozidla)
│   │       └── assets.js      (majetek)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js             (hlavní komponenta)
│   │   ├── pages/
│   │   │   ├── LoginPage.js   (login)
│   │   │   ├── Dashboard.js   (přehled)
│   │   │   ├── ContractsPage.js
│   │   │   ├── VehiclesPage.js
│   │   │   └── AssetsPage.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
│
└── README.md
```

## 📊 API Endpointy

### Autentizace
- `POST /api/auth/login` - Přihlášení

### Smlouvy
- `GET /api/contracts` - Seznam smluv
- `GET /api/contracts/:id` - Detail smlouvy
- `POST /api/contracts` - Nová smlouva
- `PUT /api/contracts/:id` - Úprava smlouvy
- `DELETE /api/contracts/:id` - Smazání smlouvy

### Vozidla
- `GET /api/vehicles` - Seznam vozidel
- `GET /api/vehicles/:id` - Detail vozidla
- `POST /api/vehicles` - Nové vozidlo
- `PUT /api/vehicles/:id` - Úprava vozidla
- `DELETE /api/vehicles/:id` - Smazání vozidla
- `POST /api/vehicles/:id/services` - Přidat servis (STK, pojištění...)
- `PUT /api/vehicles/:id/services/:serviceId` - Úprava servisu
- `DELETE /api/vehicles/:id/services/:serviceId` - Smazání servisu

### Majetek
- `GET /api/assets` - Seznam majetku
- `GET /api/assets/:id` - Detail majetku
- `POST /api/assets` - Nový majetek
- `PUT /api/assets/:id` - Úprava majetku
- `DELETE /api/assets/:id` - Smazání majetku
- `POST /api/assets/:id/revisions` - Přidat revizi
- `DELETE /api/assets/:id` - Smazání majetku

## 🔔 Notifikace

Aplikace automaticky varuje na:
- **Smlouvy expirující za <30 dní** (warning)
- **Smlouvy vypršelé** (critical)
- **STK/pojištění/emise za <14 dní** (warning)
- **STK/pojištění/emise po lhůtě** (critical)
- **Revize majetku po lhůtě** (critical)
- **Revize majetku za <30 dní** (warning)

## 🗄️ Databáze

SQLite databáze se vytváří automaticky v `backend/data/tomas.db`

Pokud chceš resetovat data, jednoduše smaž soubor `tomas.db` a restartuj backend.

## 🔐 Bezpečnost

V aktuální verzi je to dummy login pro testování. Pro produkci lze snadno napojit:

- **Active Directory** (LDAP)
- **Azure AD** (SAML)
- **Custom auth server**

Upravit: `backend/src/routes/auth.js`

## 🛠️ Troubleshooting

### Port 3000/3001 je obsazený
```bash
# Změní se port na 3002 (frontend) a 3002 (backend)
# Nebo zabij proces co používá port:

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### npm install selže
```bash
# Vymaž node_modules a zkus znovu
rm -rf node_modules package-lock.json
npm install
```

### Databáze je poškozená
```bash
# Smaž a nech se vytvořit nová
rm backend/data/tomas.db
# Restartuj backend
```

## 📝 Poznámky

- Všechna data jsou uložena lokálně v SQLite
- Demo data se vloží automaticky při prvním spuštění
- Aplikace běží pouze na localhost (není online)

## 🚀 Další vývoj

Možnosti k rozšíření:
- Napojení na skutečný AD/Azure AD
- Export do Excelu
- PDF reporting
- Emailové notifikace
- Více uživatelů s rolemi
- Integrace s účetním softwarem

## 📞 Support

Pokud máš problém:
1. Zkontroluj console (DevTools F12 v prohlížeči)
2. Zkontroluj backend logs v terminálu
3. Zkus restartovat backend a frontend

## 📄 Licence

Projekt je určen pro vnitřní použití v podniku.

---

**Vytvořeno:** 2026  
**Verze:** 1.0.0
