import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ user, token, onNavigate }) {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchAlerts();
  }, [user, token]);

  const fetchAlerts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const alertsList = [];
      let contractCount = 0;
      let vehicleCount = 0;
      let assetCount = 0;

      // Vezmi smlouvy
      if (['admin', 'smlouvy'].includes(user.role)) {
        try {
          const res = await axios.get('http://localhost:3001/api/contracts', { headers });
          contractCount = res.data.length;
          const expiring = res.data.filter(c => c.daysUntilExpiration <= 30 && c.daysUntilExpiration > 0);
          const expired = res.data.filter(c => c.daysUntilExpiration < 0);

          if (expired.length > 0) {
            alertsList.push({
              type: 'contract',
              severity: 'critical',
              message: `${expired.length} smluva(y) vypršely`,
              count: expired.length
            });
          }

          if (expiring.length > 0) {
            alertsList.push({
              type: 'contract',
              severity: 'warning',
              message: `${expiring.length} smluva(y) expirují za <30 dní`,
              count: expiring.length
            });
          }
        } catch (e) {
          console.error('Chyba při načítání smluv', e);
        }
      }

      // Vezmi vozidla
      if (['admin', 'auta'].includes(user.role)) {
        try {
          const res = await axios.get('http://localhost:3001/api/vehicles', { headers });
          vehicleCount = res.data.length;

          // Vezmi servisní údaje
          for (const vehicle of res.data) {
            const vehicleDetail = await axios.get(`http://localhost:3001/api/vehicles/${vehicle.id}`, { headers });
            vehicleDetail.data.services.forEach(service => {
              if (service.daysUntil < 0) {
                alertsList.push({
                  type: 'vehicle-service',
                  severity: 'critical',
                  message: `${vehicle.spz}: ${service.type} je ${Math.abs(service.daysUntil)} dní po termínu`,
                  vehicle: vehicle.spz
                });
              } else if (service.daysUntil < 14) {
                alertsList.push({
                  type: 'vehicle-service',
                  severity: 'warning',
                  message: `${vehicle.spz}: ${service.type} za ${service.daysUntil} dní`,
                  vehicle: vehicle.spz
                });
              }
            });
          }
        } catch (e) {
          console.error('Chyba při načítání vozidel', e);
        }
      }

      // Vezmi majetek
      if (['admin', 'majetek'].includes(user.role)) {
        try {
          const res = await axios.get('http://localhost:3001/api/assets', { headers });
          assetCount = res.data.length;

          res.data.forEach(asset => {
            if (asset.revisionStatus && asset.revisionStatus.status === 'overdue') {
              alertsList.push({
                type: 'asset-revision',
                severity: 'critical',
                message: `${asset.name}: ${asset.revisionStatus.message}`,
                asset: asset.name
              });
            } else if (asset.revisionStatus && asset.revisionStatus.status === 'upcoming') {
              alertsList.push({
                type: 'asset-revision',
                severity: 'warning',
                message: `${asset.name}: ${asset.revisionStatus.message}`,
                asset: asset.name
              });
            }
          });
        } catch (e) {
          console.error('Chyba při načítání majetku', e);
        }
      }

      setAlerts(alertsList.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, ok: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }));

      setStats({
        contracts: contractCount,
        vehicles: vehicleCount,
        assets: assetCount
      });
    } catch (error) {
      console.error('Chyba při načítání upozornění:', error);
    }
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return '🚨';
    if (severity === 'warning') return '⚠️';
    return 'ℹ️';
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        {['admin', 'smlouvy'].includes(user.role) && (
          <div className="stat-card" onClick={() => onNavigate('contracts')}>
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Smlouvy</h3>
              <p className="stat-number">{stats.contracts || 0}</p>
            </div>
          </div>
        )}

        {['admin', 'auta'].includes(user.role) && (
          <div className="stat-card" onClick={() => onNavigate('vehicles')}>
            <div className="stat-icon">🚗</div>
            <div className="stat-content">
              <h3>Vozový park</h3>
              <p className="stat-number">{stats.vehicles || 0}</p>
            </div>
          </div>
        )}

        {['admin', 'majetek'].includes(user.role) && (
          <div className="stat-card" onClick={() => onNavigate('assets')}>
            <div className="stat-icon">🏠</div>
            <div className="stat-content">
              <h3>Majetek</h3>
              <p className="stat-number">{stats.assets || 0}</p>
            </div>
          </div>
        )}
      </div>

      <div className="alerts-section">
        <h2>⚡ Upozornění (Příštích 30 dní)</h2>
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <p>✅ Žádná upozornění. Všechno je v pořádku!</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert alert-${alert.severity}`}>
                <span className="alert-icon">{getSeverityIcon(alert.severity)}</span>
                <div className="alert-content">
                  <p>{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="refresh-btn" onClick={fetchAlerts}>
        🔄 Obnovit
      </button>
    </div>
  );
}

export default Dashboard;
