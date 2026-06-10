import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DataPages.css';

function VehiclesPage({ user, token }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    spz: '',
    brand: '',
    model: '',
    year: '',
    vin: '',
    purchaseDate: '',
    purchasePrice: ''
  });
  const [serviceFormData, setServiceFormData] = useState({
    type: 'STK',
    nextDue: '',
    lastDate: '',
    cost: '',
    provider: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('http://localhost:3001/api/vehicles', { headers });
      setVehicles(res.data);
    } catch (error) {
      alert('Chyba při načítání vozidel');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('http://localhost:3001/api/vehicles', formData, { headers });
      setFormData({ spz: '', brand: '', model: '', year: '', vin: '', purchaseDate: '', purchasePrice: '' });
      setShowForm(false);
      fetchVehicles();
    } catch (error) {
      alert('Chyba při přidávání vozidla');
    }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:3001/api/vehicles/${selectedVehicle.id}`, formData, { headers });
      setSelectedVehicle(null);
      setShowForm(false);
      fetchVehicles();
    } catch (error) {
      alert('Chyba při aktualizaci vozidla');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Opravdu chceš smazat toto vozidlo?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`http://localhost:3001/api/vehicles/${id}`, { headers });
      fetchVehicles();
      setSelectedVehicle(null);
    } catch (error) {
      alert('Chyba při mazání vozidla');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`http://localhost:3001/api/vehicles/${selectedVehicle.id}/services`, serviceFormData, { headers });
      setServiceFormData({ type: 'STK', nextDue: '', lastDate: '', cost: '', provider: '' });
      setShowServiceForm(false);
      // Refresh selected vehicle detail
      const res = await axios.get(`http://localhost:3001/api/vehicles/${selectedVehicle.id}`, { headers });
      setSelectedVehicle(res.data);
    } catch (error) {
      alert('Chyba při přidávání servisu');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Smazat tento servis?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`http://localhost:3001/api/vehicles/${selectedVehicle.id}/services/${serviceId}`, { headers });
      const res = await axios.get(`http://localhost:3001/api/vehicles/${selectedVehicle.id}`, { headers });
      setSelectedVehicle(res.data);
    } catch (error) {
      alert('Chyba při mazání servisu');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.spz.toLowerCase().includes(search.toLowerCase()) ||
                         v.brand.toLowerCase().includes(search.toLowerCase()) ||
                         v.model.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getSeverityColor = (severity) => {
    if (severity === 'expired') return '#c33';
    if (severity === 'critical') return '#f0ad4e';
    if (severity === 'warning') return '#f0ad4e';
    return '#5cb85c';
  };

  return (
    <div className="page">
      <h1>🚗 Vozový park</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Hledat vozidlo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">Všechna vozidla</option>
          <option value="active">Aktivní</option>
        </select>

        {(user.role === 'admin' || user.role === 'auta') && !showForm && !selectedVehicle && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nové vozidlo
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{selectedVehicle ? 'Úprava vozidla' : 'Nové vozidlo'}</h2>
          <form onSubmit={selectedVehicle ? handleUpdateVehicle : handleAddVehicle}>
            <div className="form-row">
              <div className="form-group">
                <label>SPZ *</label>
                <input
                  type="text"
                  value={formData.spz}
                  onChange={(e) => setFormData({ ...formData, spz: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Značka *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rok výroby</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>VIN</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Datum nákupu</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Cena nákupu</label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {selectedVehicle ? 'Aktualizovat' : 'Přidat'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setSelectedVehicle(null);
                  setFormData({ spz: '', brand: '', model: '', year: '', vin: '', purchaseDate: '', purchasePrice: '' });
                }}
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedVehicle && !showForm && (
        <div className="detail-container">
          <div className="detail-header">
            <h2>{selectedVehicle.spz} - {selectedVehicle.brand} {selectedVehicle.model}</h2>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedVehicle(null)}
            >
              Zavřít
            </button>
          </div>

          <div className="detail-grid">
            <div>
              <strong>SPZ:</strong> {selectedVehicle.spz}
            </div>
            <div>
              <strong>Značka:</strong> {selectedVehicle.brand} {selectedVehicle.model}
            </div>
            <div>
              <strong>Rok:</strong> {selectedVehicle.year || '-'}
            </div>
            <div>
              <strong>VIN:</strong> {selectedVehicle.vin || '-'}
            </div>
            <div>
              <strong>Nákup:</strong> {selectedVehicle.purchaseDate || '-'} ({selectedVehicle.purchasePrice || '-'} Kč)
            </div>
            <div>
              <strong>Stav:</strong> {selectedVehicle.status}
            </div>
          </div>

          <div style={{ marginTop: '25px' }}>
            <h3>🔧 Údržba a revize</h3>
            {selectedVehicle.services && selectedVehicle.services.length > 0 ? (
              <div className="services-list">
                {selectedVehicle.services.map(service => (
                  <div key={service.id} className="service-item">
                    <div className="service-info">
                      <strong>{service.type}</strong>
                      <p>Termín: {service.nextDue}</p>
                      {service.lastDate && <p>Poslední: {service.lastDate}</p>}
                      {service.provider && <p>Poskytovatel: {service.provider}</p>}
                    </div>
                    <div className="service-status" style={{ color: getSeverityColor(service.severity) }}>
                      {service.daysUntil < 0 ? `Po lhůtě: ${Math.abs(service.daysUntil)} dní` : `Za ${service.daysUntil} dní`}
                    </div>
                    {(user.role === 'admin' || user.role === 'auta') && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        onClick={() => handleDeleteService(service.id)}
                      >
                        Smazat
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>Žádné údržby zatím nejsou zaznamenány</p>
            )}

            {(user.role === 'admin' || user.role === 'auta') && !showServiceForm && (
              <button className="btn btn-primary" onClick={() => setShowServiceForm(true)} style={{ marginTop: '15px' }}>
                + Přidat údržbu
              </button>
            )}

            {showServiceForm && (
              <form onSubmit={handleAddService} style={{ marginTop: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '6px' }}>
                <div className="form-group">
                  <label>Typ údržby</label>
                  <select
                    value={serviceFormData.type}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, type: e.target.value })}
                  >
                    <option>STK</option>
                    <option>Pojištění</option>
                    <option>Emise</option>
                    <option>Servis</option>
                    <option>Technická kontrola</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Termín *</label>
                    <input
                      type="date"
                      value={serviceFormData.nextDue}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, nextDue: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Poslední</label>
                    <input
                      type="date"
                      value={serviceFormData.lastDate}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, lastDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Poskytovatel</label>
                    <input
                      type="text"
                      value={serviceFormData.provider}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, provider: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cena</label>
                    <input
                      type="number"
                      value={serviceFormData.cost}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, cost: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Přidat</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowServiceForm(false)}>Zrušit</button>
                </div>
              </form>
            )}
          </div>

          {(user.role === 'admin' || user.role === 'auta') && (
            <div className="detail-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setFormData(selectedVehicle);
                  setShowForm(true);
                }}
              >
                Editovat vozidlo
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteVehicle(selectedVehicle.id)}
              >
                Smazat vozidlo
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p>Načítám...</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SPZ</th>
                <th>Vozidlo</th>
                <th>Rok</th>
                <th>Stav</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(vehicle => (
                <tr key={vehicle.id}>
                  <td>{vehicle.spz}</td>
                  <td>{vehicle.brand} {vehicle.model}</td>
                  <td>{vehicle.year || '-'}</td>
                  <td>{vehicle.status}</td>
                  <td>
                    <button
                      className="btn btn-small"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      Zobrazit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVehicles.length === 0 && (
            <p className="no-data">Žádná vozidla nenalezena</p>
          )}
        </div>
      )}
    </div>
  );
}

export default VehiclesPage;

/* Styles for services list */
const styles = `
  .services-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  .service-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px;
    background: #f9f9f9;
    border-left: 4px solid #667eea;
    border-radius: 4px;
  }

  .service-info {
    flex: 1;
  }

  .service-info strong {
    display: block;
    color: #333;
    margin-bottom: 5px;
  }

  .service-info p {
    color: #666;
    margin: 3px 0;
    font-size: 13px;
  }

  .service-status {
    font-weight: bold;
    min-width: 120px;
    text-align: right;
  }
`;
