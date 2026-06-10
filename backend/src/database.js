const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/tomas.db');
const dataDir = path.join(__dirname, '../data');

// Vytvoří data složku pokud neexistuje
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Chyba při připojení k databázi:', err);
      } else {
        console.log('✅ Připojeno k SQLite databázi');
      }
    });
    db.configure('busyTimeout', 10000);
  }
  return db;
}

async function initDatabase() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    
    database.serialize(() => {
      // Tabulka pro uživatele (sessions)
      database.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          username TEXT NOT NULL,
          role TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabulka pro smlouvy
      database.run(`
        CREATE TABLE IF NOT EXISTS contracts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          counterparty TEXT,
          startDate DATE,
          endDate DATE NOT NULL,
          status TEXT DEFAULT 'active',
          filePath TEXT,
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabulka pro vozidla
      database.run(`
        CREATE TABLE IF NOT EXISTS vehicles (
          id TEXT PRIMARY KEY,
          spz TEXT UNIQUE NOT NULL,
          brand TEXT,
          model TEXT,
          year INTEGER,
          vin TEXT,
          purchaseDate DATE,
          purchasePrice REAL,
          currentKm INTEGER,
          status TEXT DEFAULT 'active',
          notes TEXT,
          attachmentPath TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabulka pro údržbu vozidel
      database.run(`
        CREATE TABLE IF NOT EXISTS vehicle_services (
          id TEXT PRIMARY KEY,
          vehicleId TEXT NOT NULL,
          type TEXT NOT NULL,
          nextDue DATE NOT NULL,
          lastDate DATE,
          nextKm INTEGER,
          currentKm INTEGER,
          cost REAL,
          provider TEXT,
          notes TEXT,
          validFrom DATE,
          validTo DATE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
        )
      `);

      // Tabulka pro majetek
      database.run(`
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT,
          size TEXT,
          owner TEXT,
          purchaseDate DATE,
          purchasePrice REAL,
          currentValue REAL,
          location TEXT,
          status TEXT DEFAULT 'active',
          warrantyEndDate DATE,
          lastRevision DATE,
          revisionInterval INTEGER,
          notes TEXT,
          attachmentPath TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabulka pro revize majetku
      database.run(`
        CREATE TABLE IF NOT EXISTS asset_revisions (
          id TEXT PRIMARY KEY,
          assetId TEXT NOT NULL,
          revisionDate DATE NOT NULL,
          nextDue DATE,
          result TEXT,
          notes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (assetId) REFERENCES assets(id)
        )
      `);

      // Tabulka pro notifikace
      database.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          entityType TEXT NOT NULL,
          entityId TEXT NOT NULL,
          daysUntil INTEGER,
          severity TEXT DEFAULT 'warning',
          seen BOOLEAN DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📋 Všechny tabulky vytvořeny/ověřeny');
          seedDatabase(database).then(resolve).catch(reject);
        }
      });
    });
  });
}

async function seedDatabase(database) {
  return new Promise((resolve, reject) => {
    const { v4: uuid } = require('uuid');

    database.serialize(() => {
      // Kontrola zda už existují data
      database.get("SELECT COUNT(*) as count FROM contracts", (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count > 0) {
          console.log('📊 Databáze již obsahuje data');
          resolve();
          return;
        }

        console.log('🌱 Vkládání example dat...');

        // Example smlouvy
        const contracts = [
          {
            id: uuid(),
            name: 'Pronájem kanceláří',
            counterparty: 'RealEstateAG s.r.o.',
            startDate: '2023-01-15',
            endDate: '2026-01-15',
            status: 'active',
            notes: 'Kancelářský prostor v centru'
          },
          {
            id: uuid(),
            name: 'Servisní smlouva IT',
            counterparty: 'TechCorp s.r.o.',
            startDate: '2024-01-01',
            endDate: '2025-12-31',
            status: 'active',
            notes: 'Podpora a údržba IT infrastruktury'
          },
          {
            id: uuid(),
            name: 'Pojistka majetku',
            counterparty: 'Allianz Česká pojišťovna',
            startDate: '2024-06-01',
            endDate: '2025-05-31',
            status: 'active',
            notes: 'Pojištění movitého majetku'
          }
        ];

        contracts.forEach(contract => {
          database.run(
            `INSERT INTO contracts (id, name, counterparty, startDate, endDate, status, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [contract.id, contract.name, contract.counterparty, contract.startDate, contract.endDate, contract.status, contract.notes]
          );
        });

        // Example vozidla
        const vehicles = [
          {
            id: uuid(),
            spz: '1A1 1234',
            brand: 'Škoda',
            model: 'Octavia',
            year: 2021,
            vin: 'TMBET812345678901',
            purchaseDate: '2021-03-15',
            purchasePrice: 450000,
            currentKm: 45000,
            status: 'active'
          },
          {
            id: uuid(),
            spz: '2B2 5678',
            brand: 'Volkswagen',
            model: 'Transporter',
            year: 2020,
            vin: 'WVWZZZ3CZ6E123456',
            purchaseDate: '2020-06-10',
            purchasePrice: 800000,
            currentKm: 78000,
            status: 'active'
          },
          {
            id: uuid(),
            spz: '3C3 9101',
            brand: 'Ford',
            model: 'Focus',
            year: 2019,
            vin: 'WF0FXXWPXC8K12345',
            purchaseDate: '2019-09-20',
            purchasePrice: 350000,
            currentKm: 92000,
            status: 'active'
          }
        ];

        let vehicleIds = [];
        vehicles.forEach(vehicle => {
          vehicleIds.push(vehicle.id);
          database.run(
            `INSERT INTO vehicles (id, spz, brand, model, year, vin, purchaseDate, purchasePrice, currentKm, status, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [vehicle.id, vehicle.spz, vehicle.brand, vehicle.model, vehicle.year, vehicle.vin, vehicle.purchaseDate, vehicle.purchasePrice, vehicle.currentKm || 0, vehicle.status]
          );
        });

        // Example servisní údaje pro vozidla
        const services = [
          { vehicleIdx: 0, type: 'STK', nextDue: '2026-03-15', lastDate: '2024-03-15', nextKm: 105000, currentKm: 45000, validFrom: '2024-03-15', validTo: '2026-03-15', provider: 'STK Praha' },
          { vehicleIdx: 0, type: 'Pojištění', nextDue: '2025-08-01', lastDate: '2024-08-01', validFrom: '2024-08-01', validTo: '2025-08-01', provider: 'Allianz' },
          { vehicleIdx: 0, type: 'Přezutí', nextDue: '2025-02-01', nextKm: 50000, currentKm: 45000, provider: 'Autoservis Novák' },
          { vehicleIdx: 0, type: 'Olej', nextDue: '2025-01-15', nextKm: 50000, currentKm: 45000, provider: 'Autoservis Novák' },
          { vehicleIdx: 1, type: 'STK', nextDue: '2025-02-20', lastDate: '2023-02-20', nextKm: 180000, currentKm: 78000, validFrom: '2023-02-20', validTo: '2025-02-20', provider: 'STK Brno' },
          { vehicleIdx: 1, type: 'Přezutí', nextDue: '2024-12-15', nextKm: 80000, currentKm: 78000, provider: 'Autoservis' },
          { vehicleIdx: 2, type: 'STK', nextDue: '2025-01-10', lastDate: '2023-01-10', validFrom: '2023-01-10', validTo: '2025-01-10', provider: 'STK Praha' }
        ];

        services.forEach(service => {
          database.run(
            `INSERT INTO vehicle_services (id, vehicleId, type, nextDue, lastDate, nextKm, currentKm, validFrom, validTo, provider, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [uuid(), vehicleIds[service.vehicleIdx], service.type, service.nextDue, service.lastDate || null, service.nextKm || null, service.currentKm || null, service.validFrom || null, service.validTo || null, service.provider || null]
          );
        });

        // Example majetek
        const assets = [
          {
            id: uuid(),
            name: 'PC - HP EliteDesk',
            category: 'IT',
            purchaseDate: '2023-01-10',
            purchasePrice: 25000,
            currentValue: 18000,
            location: 'Kancelář 101',
            status: 'active',
            owner: 'Jan Horák',
            warrantyEndDate: '2026-01-10',
            revisionInterval: 24,
            size: 'Velký'
          },
          {
            id: uuid(),
            name: 'Tiskárna - Canon',
            category: 'IT',
            purchaseDate: '2022-06-15',
            purchasePrice: 12000,
            currentValue: 8000,
            location: 'Kancelář 102',
            status: 'active',
            owner: 'Marie Svobodová',
            lastRevision: '2024-06-15',
            revisionInterval: 12,
            size: 'Velký'
          },
          {
            id: uuid(),
            name: 'Klimatizace - LG',
            category: 'Zařízení',
            purchaseDate: '2021-07-20',
            purchasePrice: 35000,
            currentValue: 28000,
            location: 'Serverovna',
            status: 'active',
            owner: 'IT oddělení',
            lastRevision: '2024-07-20',
            revisionInterval: 12,
            size: 'Velký'
          },
          {
            id: uuid(),
            name: 'Stůl - Ikea Bekant',
            category: 'Nábytek',
            purchaseDate: '2023-03-01',
            purchasePrice: 3000,
            currentValue: 2500,
            location: 'Kancelář 101',
            status: 'active',
            owner: 'Jan Horák',
            size: 'Malý'
          },
          {
            id: uuid(),
            name: 'Židle kancelářská',
            category: 'Nábytek',
            purchaseDate: '2023-03-01',
            purchasePrice: 2500,
            currentValue: 2000,
            location: 'Kancelář 102',
            status: 'active',
            owner: 'Marie Svobodová',
            size: 'Malý'
          }
        ];

        assets.forEach(asset => {
          database.run(
            `INSERT INTO assets (id, name, category, size, owner, purchaseDate, purchasePrice, currentValue, location, status, warrantyEndDate, lastRevision, revisionInterval, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [asset.id, asset.name, asset.category, asset.size || null, asset.owner || null, asset.purchaseDate || null, asset.purchasePrice || null, asset.currentValue || null, asset.location || null, asset.status, asset.warrantyEndDate || null, asset.lastRevision || null, asset.revisionInterval || null]
          );
        });

        console.log('✅ Example data úspěšně vložena');
        resolve();
      });
    });
  });
}

module.exports = { getDb, initDatabase };
