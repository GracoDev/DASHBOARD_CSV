import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { backend1API, backend2API } from '../services/api';
import MetricsCards from './MetricsCards';
import RevenueChart from './RevenueChart';
import Filters from './Filters';
import SyncButton from './SyncButton';
import './Dashboard.css';

function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
  });
  const [tempFilters, setTempFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
  });

  const loadData = async (filtersToUse = filters) => {
    setLoading(true);
    setError('');
    try {
      const [metricsData, timeSeriesData] = await Promise.all([
        backend2API.getMetrics(token, filtersToUse),
        backend2API.getTimeSeries(token, filtersToUse),
      ]);
      setMetrics(metricsData);
      // Backend 2 retorna { filters, data } para time-series
      setTimeSeries(timeSeriesData.data || timeSeriesData);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Erro ao carregar dados. Verifique sua conexão.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados apenas uma vez ao montar o componente
  useEffect(() => {
    loadData();
  }, [token]);

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters });
    loadData(tempFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { startDate: '', endDate: '', paymentMethod: '' };
    setTempFilters(clearedFilters);
    setFilters(clearedFilters);
    loadData(clearedFilters);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSync = async () => {
    try {
      await backend1API.sync(token);
      alert('Sincronização iniciada com sucesso!');
      // Recarregar dados após sincronização (usando filtros atuais)
      setTimeout(() => {
        loadData(filters);
      }, 2000);
    } catch (err) {
      alert(
        err.response?.data?.error || 'Erro ao sincronizar dados. Tente novamente.'
      );
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="header-actions">
          <SyncButton onSync={handleSync} />
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <Filters 
          filters={tempFilters} 
          onFiltersChange={setTempFilters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading">Carregando dados...</div>
        ) : (
          <>
            {metrics && <MetricsCards metrics={metrics} />}
            {timeSeries && timeSeries.length > 0 && (
              <RevenueChart data={timeSeries} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

