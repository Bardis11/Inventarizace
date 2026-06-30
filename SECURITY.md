# 🔒 DANZER Inventory - Bezpečnostní Guidelines

## Důležité bezpečnostní opatření

### 1️⃣ Environment Variables (.env)

**NIKDY** necommituj `.env` soubor do Gitu!

```bash
# Kopíruj template
cp backend/.env.example backend/.env

# Vyplň svými hodnotami
nano backend/.env
```

### 2️⃣ JWT Secret - KRITICKÉ!

V **produkci** MUSÍŠ změnit `JWT_SECRET` na silný klíč:

```bash
# Generuj silný secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Vložit do .env
JWT_SECRET=tvůj-generovaný-super-silný-klíč-zde
```

### 3️⃣ CORS - Omez na tvoji doménu

**Development:**
```
CORS_ORIGIN=http://localhost:3000
```

**Produkce:**
```
CORS_ORIGIN=https://tvoje-domena.cz
```

### 4️⃣ Input Validation

Všechny inputy jsou **sanitizované** a **validované**:
- ✅ SPZ - formát kontrola
- ✅ Email - formát kontrola  
- ✅ Data - validity kontrola
- ✅ Stringy - XSS ochrany (& < > " ')
- ✅ Soubory - typ a velikost kontrola

### 5️⃣ File Upload - Bezpečnost

- ✅ Max 5MB
- ✅ Jen obrázky (JPEG, PNG, WebP)
- ✅ Uložení mimo root
- ✅ Randomizované jméno

### 6️⃣ Database - Prepared Statements

Všechny SQL queries používají **prepared statements** - chráněno proti SQL injection:

```javascript
// ✅ SPRÁVNĚ - chráněno
db.run('SELECT * FROM users WHERE id = ?', [userId], ...)

// ❌ ŠPATNĚ - SQL injection risk
db.run(`SELECT * FROM users WHERE id = ${userId}`, ...)
```

### 7️⃣ JWT Token Expiry

Tokeny expirují po **7 dnech** - jsou si vynuceni znovu se přihlásit.

```javascript
JWT_EXPIRY=7d
```

### 8️⃣ HTTPS - Produkce

V produkci **MUSÍŠ** použít HTTPS:

```bash
# Nginx proxy s SSL (Let's Encrypt)
# nebo
# Heroku, Railway, atd. s SSL
```

### 9️⃣ Rate Limiting

Chráněno proti brute-force útokům:
- Max 100 requestů za 15 minut
- Automatický reset

### 🔟 Logging

Všechny **error** a **warn** события jsou logovány:

```
LOG_LEVEL=info  # Development
LOG_LEVEL=warn  # Produkce
```

---

## 📋 Deployment Checklist

Před nasazením do produkce:

- [ ] Změněn JWT_SECRET na silný klíč
- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN nastaveno na tvoji doménu
- [ ] HTTPS enabled (SSL certifikát)
- [ ] Database backup nastaveno
- [ ] Logs se archivují
- [ ] Email notifikace na chyby
- [ ] 2FA/LDAP aktivní (pokud plánuješ)

---

## 🚨 Pokud zjistíš bezpečnostní chybu

1. Nehlásej ji veřejně
2. Kontaktuj admina prímo
3. Popis konkrétně co se stalo

---

**Bezpečnost není jednorázový projekt - je to kontinuální proces!** 🔒
