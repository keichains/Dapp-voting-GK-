// ════════════════════════════════════════════════════════
//  Tính năng mở rộng #3 — Biểu đồ Chart.js
//  Mô tả  : Biểu đồ cột/tròn · cập nhật realtime theo event
// ════════════════════════════════════════════════════════

let chartBarInstance = null;
let chartPieInstance = null;
let currentChartMode = 'bar';

const CHART_COLORS = [
  'rgba(59,130,246,0.85)',
  'rgba(16,185,129,0.85)',
  'rgba(245,158,11,0.85)',
  'rgba(168,85,247,0.85)',
  'rgba(239,68,68,0.85)',
  'rgba(236,72,153,0.85)',
  'rgba(20,184,166,0.85)',
  'rgba(99,102,241,0.85)',
  'rgba(234,179,8,0.85)',
  'rgba(249,115,22,0.85)',
];

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      labels: {
        color: '#e2e8f0',
        font: { family: "'DM Mono', monospace", size: 11 },
        padding: 16,
      }
    },
    tooltip: {
      backgroundColor: '#1a2235',
      borderColor: '#1e2d45',
      borderWidth: 1,
      titleColor: '#e2e8f0',
      bodyColor: '#60a5fa',
      callbacks: {
        label: (ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const val   = ctx.chart.config.type === 'bar' ? ctx.parsed.y : ctx.parsed;
          const pct   = total > 0 ? Math.round(val * 100 / total) : 0;
          return ` ${val} phiếu (${pct}%)`;
        }
      }
    }
  }
};

// Chuyển giữa biểu đồ cột và tròn
function switchChart(mode) {
  currentChartMode = mode;
  document.getElementById('chart-bar-btn').classList.toggle('active', mode === 'bar');
  document.getElementById('chart-pie-btn').classList.toggle('active', mode === 'pie');
  document.getElementById('chart-bar').style.display = mode === 'bar' ? 'block' : 'none';
  document.getElementById('chart-pie').style.display = mode === 'pie' ? 'block' : 'none';
}

// Hàm chính — tạo hoặc cập nhật biểu đồ
// Được gọi tự động mỗi khi renderCandidates() chạy
// → tức là cũng chạy khi có event VotedEvent từ contract
function updateCharts() {
  const active     = candidatesData.filter(c => c.name && c.name !== '');
  const totalVotes = active.reduce((s, c) => s + c.voteCount, 0);

  const emptyEl   = document.getElementById('chart-empty');
  const barCanvas = document.getElementById('chart-bar');
  const pieCanvas = document.getElementById('chart-pie');

  // Chưa có phiếu nào → hiện thông báo, ẩn canvas
  if (totalVotes === 0) {
    emptyEl.style.display   = 'block';
    barCanvas.style.display = 'none';
    pieCanvas.style.display = 'none';
    return;
  }

  emptyEl.style.display   = 'none';
  barCanvas.style.display = currentChartMode === 'bar' ? 'block' : 'none';
  pieCanvas.style.display = currentChartMode === 'pie' ? 'block' : 'none';

  const labels = active.map(c => c.name);
  const data   = active.map(c => c.voteCount);
  const colors = active.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  // ── BIỂU ĐỒ CỘT ──────────────────────────────────────
  if (chartBarInstance) {
    // Đã có rồi → chỉ cập nhật data, không vẽ lại từ đầu
    chartBarInstance.data.labels                      = labels;
    chartBarInstance.data.datasets[0].data            = data;
    chartBarInstance.data.datasets[0].backgroundColor = colors;
    chartBarInstance.update('active');
  } else {
    // Chưa có → tạo mới
    chartBarInstance = new Chart(barCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Số phiếu',
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.85', '1')),
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          x: {
            ticks: { color: '#64748b', font: { family: "'DM Mono', monospace", size: 10 } },
            grid:  { color: 'rgba(30,45,69,0.6)' }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#64748b',
              font: { family: "'DM Mono', monospace", size: 10 },
              stepSize: 1,
              precision: 0,
            },
            grid: { color: 'rgba(30,45,69,0.6)' }
          }
        }
      }
    });
  }

  // ── BIỂU ĐỒ TRÒN ─────────────────────────────────────
  if (chartPieInstance) {
    chartPieInstance.data.labels                      = labels;
    chartPieInstance.data.datasets[0].data            = data;
    chartPieInstance.data.datasets[0].backgroundColor = colors;
    chartPieInstance.update('active');
  } else {
    chartPieInstance = new Chart(pieCanvas.getContext('2d'), {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#111827',
          borderWidth: 2,
          hoverOffset: 8,
        }]
      },
      options: {
        ...CHART_DEFAULTS,
        plugins: {
          ...CHART_DEFAULTS.plugins,
          legend: { ...CHART_DEFAULTS.plugins.legend, position: 'bottom' }
        }
      }
    });
  }
}