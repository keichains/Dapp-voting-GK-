let barChart;
let doughnutChart;
let allVoteEvents = [];

const DASHBOARD_COLORS = [
    '#1A3FBF',
    '#BFDBFE',
    '#FDBA74',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#14B8A6',
    '#EC4899',
    '#64748B'
];

function getColor(index) {
    return DASHBOARD_COLORS[index % DASHBOARD_COLORS.length];
}

function formatAddress(address) {
    if (!address) return "Unknown";
    return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}

function formatPercent(value, total) {
    if (!total || total === 0) return "0.0%";
    return ((value / total) * 100).toFixed(1) + "%";
}

function getActiveCandidates(ids, names, voteCounts) {
    const candidates = [];

    for (let i = 0; i < ids.length; i++) {
        const name = names[i];

        if (!name || name.trim() === "") {
            continue;
        }

        candidates.push({
            id: Number(ids[i]),
            name: name,
            votes: Number(voteCounts[i])
        });
    }

    return candidates;
}

const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
        if (chart.config.type !== 'doughnut') return;

        const ctx = chart.ctx;
        const width = chart.width;
        const height = chart.height;

        const total = chart.options.plugins.centerText?.text || "0";

        ctx.save();

        ctx.font = "bold 24px 'Inter'";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#111827";

        const textX = Math.round((width - ctx.measureText(total).width) / 2);
        const textY = height / 2 - 10;
        ctx.fillText(total, textX, textY);

        ctx.font = "500 12px 'Inter'";
        ctx.fillStyle = "#6B7280";

        const subText = "Tổng phiếu";
        const subTextX = Math.round((width - ctx.measureText(subText).width) / 2);
        const subTextY = height / 2 + 15;
        ctx.fillText(subText, subTextX, subTextY);

        ctx.restore();
    }
};

function initCharts(candidates, total) {
    const labels = candidates.map(c => c.name);
    const shortLabels = candidates.map(c => `ID: ${c.id}`);
    const votes = candidates.map(c => c.votes);
    const colors = candidates.map((_, index) => getColor(index));

    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');

    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: shortLabels,
            datasets: [{
                label: 'Số phiếu',
                data: votes,
                backgroundColor: colors,
                borderRadius: 4,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: context => labels[context[0].dataIndex],
                        label: context => `${context.parsed.y} phiếu`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        maxTicksLimit: 5
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    doughnutChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: votes,
                backgroundColor: colors,
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                centerText: {
                    text: total.toLocaleString()
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const vote = context.parsed || 0;
                            return `${context.label}: ${vote} phiếu (${formatPercent(vote, total)})`;
                        }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    });
}

function updateCharts(candidates, total) {
    const labels = candidates.map(c => c.name);
    const shortLabels = candidates.map(c => `ID: ${c.id}`);
    const votes = candidates.map(c => c.votes);
    const colors = candidates.map((_, index) => getColor(index));

    if (!barChart || !doughnutChart) {
        initCharts(candidates, total);
        return;
    }

    barChart.data.labels = shortLabels;
    barChart.data.datasets[0].data = votes;
    barChart.data.datasets[0].backgroundColor = colors;
    barChart.update();

    doughnutChart.data.labels = labels;
    doughnutChart.data.datasets[0].data = votes;
    doughnutChart.data.datasets[0].backgroundColor = colors;
    doughnutChart.options.plugins.centerText.text = total.toLocaleString();
    doughnutChart.update();
}

function updateStatCards(candidates, total) {
    const totalVotesDOM = document.getElementById("totalVotesCount");
    const candidateCountDOM = document.getElementById("candidateCountDOM");
    const leaderNameDOM = document.getElementById("leaderNameDOM");

    if (totalVotesDOM) {
        totalVotesDOM.innerText = total.toLocaleString();
    }

    if (candidateCountDOM) {
        candidateCountDOM.innerText = candidates.length;
    }

    if (leaderNameDOM) {
        if (candidates.length === 0) {
            leaderNameDOM.innerText = "Chưa có ứng viên";
            return;
        }

        const sorted = [...candidates].sort((a, b) => b.votes - a.votes);
        const leader = sorted[0];

        if (leader.votes === 0) {
            leaderNameDOM.innerText = "Chưa có phiếu";
        } else {
            leaderNameDOM.innerText = leader.name;
        }
    }
}

function updateResultTable(candidates, total) {
    const tbody = document.getElementById("dashboardResultBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (candidates.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-6 px-5 text-center text-sm text-text-muted">
                    Chưa có ứng viên nào.
                </td>
            </tr>
        `;
        return;
    }

    const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);

    sortedCandidates.forEach((candidate, index) => {
        const tr = document.createElement("tr");
        tr.className = index === 0
            ? "bg-[#FAFAFA] hover:bg-slate-50 transition-colors"
            : "hover:bg-slate-50 transition-colors";

        tr.innerHTML = `
            <td class="py-4 px-5 text-center text-sm font-medium text-text-muted">
                ${index + 1}
            </td>
            <td class="py-4 px-5">
                <span class="text-sm ${index === 0 ? "font-semibold" : "font-medium"} text-text-main">
                    ${candidate.name}
                </span>
            </td>
            <td class="py-4 px-5 text-right text-sm font-medium text-text-main">
                ${candidate.votes.toLocaleString()}
            </td>
            <td class="py-4 px-5 text-right text-sm text-text-main">
                ${formatPercent(candidate.votes, total)}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function updateLegend(candidates) {
    const legendDOM = document.getElementById("dashboardLegendDOM");
    if (!legendDOM) return;

    legendDOM.innerHTML = "";

    if (candidates.length === 0) {
        legendDOM.innerHTML = `<span class="text-xs text-text-muted">Chưa có dữ liệu</span>`;
        return;
    }

    candidates.forEach((candidate, index) => {
        const item = document.createElement("div");
        item.className = "flex items-center gap-2";

        item.innerHTML = `
            <span class="w-3 h-3 rounded-sm" style="background-color:${getColor(index)}"></span>
            <span class="text-xs text-text-muted">${candidate.name}</span>
        `;

        legendDOM.appendChild(item);
    });
}

async function updateDashboard() {
    if (!contract) return;

    try {
        const [ids, names, voteCounts] = await contract.getAllCandidates();

        const candidates = getActiveCandidates(ids, names, voteCounts);
        const total = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

        updateStatCards(candidates, total);
        updateResultTable(candidates, total);
        updateLegend(candidates);
        updateCharts(candidates, total);

        console.log("Dashboard đã cập nhật:", candidates);
    } catch (error) {
        console.error("Lỗi cập nhật dashboard:", error);
    }
}

async function addTransactionLog(voter, candidateId, event) {
    const logDOM = document.getElementById("transactionLogDOM");
    if (!logDOM) return;

    const blockNumber = event?.log?.blockNumber || event?.blockNumber || "...";

    const emptyMessage = logDOM.querySelector(".text-text-muted");
    if (emptyMessage && emptyMessage.innerText.includes("Chưa có giao dịch")) {
        logDOM.innerHTML = "";
    }

    const item = document.createElement("div");
    item.className = "bg-[#F9FAFB] border border-border rounded p-3 flex flex-col gap-1";

    item.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-[#6D28D9]">Bỏ phiếu mới</span>
            <span class="text-[11px] text-text-muted">Vừa xong</span>
        </div>
        <div class="flex justify-between items-center mt-1">
            <span class="text-sm font-mono text-text-main">${formatAddress(voter)}</span>
            <span class="text-[11px] border border-border px-1.5 py-0.5 rounded bg-surface text-text-muted">
                ID ${candidateId} · Khối ${blockNumber}
            </span>
        </div>
    `;

    logDOM.prepend(item);
}

function listenToEvents() {
    if (!contract) return;

    contract.on("VotedEvent", async (voter, candidateId, round, event) => {
        console.log("Phát hiện vote mới:", {
            voter,
            candidateId: Number(candidateId),
            round: Number(round)
        });

        await updateDashboard();
        await loadPastVoteEvents();
    });

    contract.on("CandidateAdded", async () => {
        await updateDashboard();
    });

    contract.on("CandidateRemoved", async () => {
        await updateDashboard();
    });
}

window.addEventListener('load', async () => {
    const connected = await initWeb3();

    if (!connected) {
        console.log("Vui lòng kết nối ví để xem dashboard thật.");
        return;
    }

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#6B7280';

    await updateDashboard();
    await loadPastVoteEvents();

    setupViewAllLogsButton();
    listenToEvents();
});
async function loadPastVoteEvents() {
    const logDOM = document.getElementById("transactionLogDOM");

    if (!logDOM || !contract) {
        console.log("Không tìm thấy transactionLogDOM hoặc contract chưa sẵn sàng");
        return;
    }

    try {
        const filter = contract.filters.VotedEvent();

        const currentBlock = await provider.getBlockNumber();

        // Có thể tăng 5000 lên 20000 nếu muốn quét xa hơn
        const fromBlock = Math.max(currentBlock - 5000, 0);

        const events = await contract.queryFilter(filter, fromBlock, currentBlock);

        allVoteEvents = events.reverse();

        logDOM.innerHTML = "";

        if (allVoteEvents.length === 0) {
            logDOM.innerHTML = `
                <div class="text-sm text-text-muted">
                    Chưa có giao dịch vote nào được tìm thấy.
                </div>
            `;
            return;
        }

        const latestEvents = allVoteEvents.slice(0, 3);

        latestEvents.forEach((event) => {
            const voter = event.args[0];
            const candidateId = Number(event.args[1]);
            const round = Number(event.args[2]);
            const blockNumber = event.blockNumber;

            const item = createLogItem(voter, candidateId, round, blockNumber);
            logDOM.appendChild(item);
        });

        console.log("Đã tải lịch sử vote:", allVoteEvents);

    } catch (err) {
        console.error("Lỗi khi tải lịch sử vote:", err);

        logDOM.innerHTML = `
            <div class="text-sm text-text-muted">
                Không tải được lịch sử giao dịch vote.
            </div>
        `;
    }
}
function createLogItem(voter, candidateId, round, blockNumber) {
    const item = document.createElement("div");

    item.className = "bg-[#F9FAFB] border border-border rounded p-3 flex flex-col gap-1";

    item.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-[#6D28D9]">
                Bỏ phiếu mới
            </span>

            <span class="text-[11px] text-text-muted">
                Block ${blockNumber}
            </span>
        </div>

        <div class="flex justify-between items-center mt-1">
            <span class="text-sm font-mono text-text-main">
                ${formatAddress(voter)}
            </span>

            <span class="text-[11px] border border-border px-1.5 py-0.5 rounded bg-surface text-text-muted">
                ID ${candidateId} · Round ${round}
            </span>
        </div>
    `;

    return item;
}
function setupViewAllLogsButton() {
    const btnViewAll = document.getElementById("btnViewAllLogs");
    const modal = document.getElementById("allLogsModal");
    const modalBody = document.getElementById("allLogsModalBody");
    const btnClose = document.getElementById("btnCloseLogsModal");

    if (!btnViewAll || !modal || !modalBody || !btnClose) {
        console.log("Thiếu thành phần modal xem tất cả log");
        return;
    }

    btnViewAll.addEventListener("click", async () => {
        modal.classList.remove("hidden");
        modal.classList.add("flex");

        modalBody.innerHTML = `
            <div class="text-sm text-text-muted">
                Đang tải dữ liệu...
            </div>
        `;

        await loadPastVoteEvents();

        modalBody.innerHTML = "";

        if (allVoteEvents.length === 0) {
            modalBody.innerHTML = `
                <div class="text-sm text-text-muted">
                    Chưa có giao dịch vote nào.
                </div>
            `;
            return;
        }

        allVoteEvents.forEach((event) => {
            const voter = event.args[0];
            const candidateId = Number(event.args[1]);
            const round = Number(event.args[2]);
            const blockNumber = event.blockNumber;

            const item = createLogItem(voter, candidateId, round, blockNumber);
            modalBody.appendChild(item);
        });
    });

    btnClose.addEventListener("click", () => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
        }
    });
}