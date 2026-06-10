import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DataPages.css';

function AssetsPage({ user, token }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    location: '',
    warrantyEndDate: '',
    revisionInterval: '',
    notes: ''
  });

  const categories = ['IT', 'Nábytek', 'Zařízení', 'Stroje', 'Ostatní'];

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('http://localhost:3001/api/assets', { headers });
      setAssets(res.data);
    } catch (error) {
      alert('Chyba při načítání majetku');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('http://localhost:3001/api/assets', formData, { headers });
      setFormData({
        name: '',
        category: '',
        purchaseDate: '',
        purchasePrice: '',
        currentValue: '',
        location: '',
        warrantyEndDate: '',
        revisionInterval: '',
        notes: ''
      });
      setShowForm(false);
      fetchAssets();
    } catch (error) {
      alert('Chyba při přidávání majetku');
    }
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:3001/api/assets/${selectedAsset.id}`, formData, { headers });
      setSelectedAsset(null);
      setShowForm(false);
      fetchAssets();
    } catch (error) {
      alert('Chyba při aktualizaci majetku');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Opravdu chceš smazat tento majetek?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`http://localhost:3001/api/assets/${id}`, { headers });
      fetchAssets();
      setSelectedAsset(null);
    } catch (error) {
      alert('Chyba při mazání majetku');
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                         (a.location && a.location.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="page">
      <h1>🏠 Majetek</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Hledat majetek..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
          <option value="all">Všechny kategorie</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">Všechen majetek</option>
          <option value="active">Aktivní</option>
          <option value="deprecated">Zastaralý</option>
        </select>

        {(user.role === 'admin' || user.role === 'majetek') && !showForm && !selectedAsset && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nový majetek
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{selectedAsset ? 'Úprava majetku' : 'Nový majetek'}</h2>
          <form onSubmit={selectedAsset ? handleUpdateAsset : handleAddAsset}>
            <div className="form-group">
              <label>Název *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Kategorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">-</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Umístění</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Např. Kancelář 101"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cena nákupu</label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Současná hodnota</label>
                <input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                />
              </div>
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
                <label>Konec záruky</label>
                <input
                  type="date"
                  value={formData.warrantyEndDate}
                  onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Interval revize (měsíce)</label>
              <input
                type="number"
                value={formData.revisionInterval}
                onChange={(e) => setFormData({ ...formData, revisionInterval: e.target.value })}
                placeholder="Např. 12 pro každý rok"
              />
            </div>

            <div className="form-group">
              <label>Poznámky</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {selectedAsset ? 'Aktualizovat' : 'Přidat'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setSelectedAsset(null);
                  setFormData({
                    name: '',
                    category: '',
                    purchaseDate: '',
                    purchasePrice: '',
                    currentValue: '',
                    location: '',
                    warrantyEndDate: '',
                    revisionInterval: '',
                    notes: ''
                  });
                }}
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedAsset && !showForm && (
        <div className="detail-container">
          <div className="detail-header">
            <h2>{selectedAsset.name}</h2>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedAsset(null)}
            >
              Zavřít
            </button>
          </div>

          <div className="detail-grid">
            <div>
              <strong>Kategorie:</strong> {selectedAsset.category || '-'}
            </div>
            <div>
              <strong>Umístění:</strong> {selectedAsset.location || '-'}
            </div>
            <div>
              <strong>Cena nákupu:</strong> {selectedAsset.purchasePrice ? `${selectedAsset.purchasePrice} Kč` : '-'}
            </div>
            <div>
              <strong>Současná hodnota:</strong> {selectedAsset.currentValue ? `${selectedAsset.currentValue} Kč` : '-'}
            </div>
            <div>
              <strong>Datum nákupu:</strong> {selectedAsset.purchaseDate || '-'}
            </div>
            <div>
              <strong>Záruka do:</strong> {selectedAsset.warrantyEndDate || '-'}
            </div>
            <div>
              <strong>Stav:</strong> {selectedAsset.status}
            </div>
            {selectedAsset.revisionStatus && (
              <div>
                <strong>Stav revize:</strong>
                <p style={{ margin: '5px 0 0 0', color: selectedAsset.revisionStatus.severity === 'critical' ? '#c33' : '#666' }}>
                  {selectedAsset.revisionStatus.message}
                </p>
              </div>
            )}
            {selectedAsset.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Poznámky:</strong>
                <p>{selectedAsset.notes}</p>
              </div>
            )}
          </div>

          {(user.role === 'admin' || user.role === 'majetek') && (
            <div className="detail-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setFormData(selectedAsset);
                  setShowForm(true);
                }}
              >
                Editovat
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteAsset(selectedAsset.id)}
              >
                Smazat
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
                <th>Název</th>
                <th>Kategorie</th>
                <th>Umístění</th>
                <th>Cena</th>
                <th>Hodnota</th>
                <th>Stav</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => (
                <tr key={asset.id}>
                  <td>{asset.name}</td>
                  <td>{asset.category || '-'}</td>
                  <td>{asset.location || '-'}</td>
                  <td>{asset.purchasePrice ? `${asset.purchasePrice} Kč` : '-'}</td>
                  <td>{asset.currentValue ? `${asset.currentValue} Kč` : '-'}</td>
                  <td>{asset.status}</td>
                  <td>
                    <button
                      className="btn btn-small"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      Zobrazit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAssets.length === 0 && (
            <p className="no-data">Žádný majetek nenalezen</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AssetsPage;
