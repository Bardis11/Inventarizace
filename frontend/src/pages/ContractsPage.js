import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DataPages.css';

function ContractsPage({ user, token }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    counterparty: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('http://localhost:3001/api/contracts', { headers });
      setContracts(res.data);
    } catch (error) {
      alert('Chyba při načítání smluv');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('http://localhost:3001/api/contracts', formData, { headers });
      setFormData({ name: '', counterparty: '', startDate: '', endDate: '', notes: '' });
      setShowForm(false);
      fetchContracts();
    } catch (error) {
      alert('Chyba při přidávání smlouvy');
    }
  };

  const handleUpdateContract = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:3001/api/contracts/${selectedContract.id}`, formData, { headers });
      setSelectedContract(null);
      setShowForm(false);
      setFormData({ name: '', counterparty: '', startDate: '', endDate: '', notes: '' });
      fetchContracts();
    } catch (error) {
      alert('Chyba při aktualizaci smlouvy');
    }
  };

  const handleDeleteContract = async (id) => {
    if (!window.confirm('Opravdu chceš smazat tuto smlouvu?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`http://localhost:3001/api/contracts/${id}`, { headers });
      fetchContracts();
    } catch (error) {
      alert('Chyba při mazání smlouvy');
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         (c.counterparty && c.counterparty.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
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
      <h1>📋 Smlouvy</h1>

      <div className="controls">
        <input
          type="text"
          placeholder="Hledat smlouvu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="all">Všechny smlouvy</option>
          <option value="active">Aktivní</option>
          <option value="expired">Vypršelé</option>
        </select>

        {(user.role === 'admin' || user.role === 'smlouvy') && !showForm && !selectedContract && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nová smlouva
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{selectedContract ? 'Úprava smlouvy' : 'Nová smlouva'}</h2>
          <form onSubmit={selectedContract ? handleUpdateContract : handleAddContract}>
            <div className="form-group">
              <label>Název smlouvy *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Druhá strana</label>
              <input
                type="text"
                value={formData.counterparty}
                onChange={(e) => setFormData({ ...formData, counterparty: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Datum začátku</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Datum konce *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
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
                {selectedContract ? 'Aktualizovat' : 'Přidat'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setSelectedContract(null);
                  setFormData({ name: '', counterparty: '', startDate: '', endDate: '', notes: '' });
                }}
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedContract && !showForm && (
        <div className="detail-container">
          <div className="detail-header">
            <h2>{selectedContract.name}</h2>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedContract(null)}
            >
              Zavřít
            </button>
          </div>

          <div className="detail-grid">
            <div>
              <strong>Druhá strana:</strong> {selectedContract.counterparty || '-'}
            </div>
            <div>
              <strong>Začátek:</strong> {selectedContract.startDate || '-'}
            </div>
            <div>
              <strong>Konec:</strong> {selectedContract.endDate}
            </div>
            <div>
              <strong>Stav:</strong> {selectedContract.status}
            </div>
            {selectedContract.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Poznámky:</strong>
                <p>{selectedContract.notes}</p>
              </div>
            )}
          </div>

          {(user.role === 'admin' || user.role === 'smlouvy') && (
            <div className="detail-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setFormData(selectedContract);
                  setShowForm(true);
                }}
              >
                Editovat
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  handleDeleteContract(selectedContract.id);
                  setSelectedContract(null);
                }}
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
                <th>Druhá strana</th>
                <th>Konec</th>
                <th>Dní do konce</th>
                <th>Stav</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map(contract => (
                <tr key={contract.id}>
                  <td>{contract.name}</td>
                  <td>{contract.counterparty || '-'}</td>
                  <td>{contract.endDate}</td>
                  <td>
                    <span style={{ color: getSeverityColor(contract.severity) }}>
                      {contract.daysUntilExpiration} dní
                    </span>
                  </td>
                  <td>{contract.status}</td>
                  <td>
                    <button
                      className="btn btn-small"
                      onClick={() => setSelectedContract(contract)}
                    >
                      Zobrazit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredContracts.length === 0 && (
            <p className="no-data">Žádné smlouvy nenalezeny</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ContractsPage;
