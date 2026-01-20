import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './RevenueChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="chart-placeholder">Nenhum dado disponível para o gráfico</div>;
  }

  // Preparar dados para o gráfico
  const labels = data.map((item) => item.date);
  const approvedData = data.map((item) => item.approved_revenue);
  const pendingData = data.map((item) => item.pending_revenue);
  const cancelledData = data.map((item) => item.cancelled_revenue);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Receita Aprovada',
        data: approvedData,
        borderColor: '#00D47E',
        backgroundColor: 'rgba(0, 212, 126, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Receita Pendente',
        data: pendingData,
        borderColor: '#ffd43b',
        backgroundColor: 'rgba(255, 212, 59, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Receita Cancelada',
        data: cancelledData,
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Evolução Diária de Receita',
        font: {
          size: 18,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return 'R$ ' + value.toFixed(0);
          },
        },
      },
    },
  };

  return (
    <div className="revenue-chart">
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

export default RevenueChart;

