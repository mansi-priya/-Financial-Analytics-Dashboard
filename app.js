const API_URL = 'http://localhost:5000/api';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatShortDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const setText = (id, value) => {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
};

const renderRecentTransactions = (transactions) => {
  const container = document.getElementById('recentTransactions');
  if (!container) return;

  const items = (transactions || []).slice(0, 3).map((tx, index) => {
    const isPositive = tx.type === 'revenue';
    const amount = isPositive ? '+' : '-';
    const avatarClass = ['avatar-one', 'avatar-two', 'avatar-three'][index % 3];
    const avatarLetter = tx.user ? tx.user.charAt(0).toUpperCase() : 'T';

    return `
      <div class="txn-item">
        <div class="avatar ${avatarClass}">${avatarLetter}</div>
        <div class="txn-main">
          <span class="txn-type">${isPositive ? 'Transfer from' : 'Transfer to'}</span>
          <strong>${tx.user || 'Unknown user'}</strong>
        </div>
        <div class="txn-amount ${isPositive ? 'positive' : 'negative'}">${amount}${formatCurrency(tx.amount)}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = items;
};

const renderTable = (transactions) => {
  const tableBody = document.getElementById('transactionsTableBody');
  if (!tableBody) return;

  const rows = (transactions || []).slice(0, 6).map((tx) => {
    const isCompleted = tx.status === 'completed';
    const miniClasses = ['mini-one', 'mini-two', 'mini-three'];
    const miniClass = miniClasses[Math.abs(tx.amount % miniClasses.length)];
    const shortName = (tx.user || 'User').split(' ')[0];

    return `
      <tr>
        <td class="person-cell">
          <div class="mini-avatar ${miniClass}">${shortName.charAt(0).toUpperCase()}</div>
          <span>${shortName}</span>
        </td>
        <td>${formatShortDate(tx.date)}</td>
        <td>${formatCurrency(tx.amount)}</td>
        <td><span class="status ${isCompleted ? 'success' : 'pending'}">${tx.status}</span></td>
      </tr>
    `;
  }).join('');

  tableBody.innerHTML = rows;
};

const loadDashboard = async () => {
  try {
    const response = await fetch(`${API_URL}/dashboard`);
    const payload = await response.json();

    const summary = payload.summary || {};
    const transactions = payload.transactions || [];

    setText('balanceValue', formatCurrency(summary.netIncome || 0));
    setText('revenueValue', formatCurrency(summary.totalRevenue || 0));
    setText('expenseValue', formatCurrency(summary.totalExpenses || 0));
    setText('savingsValue', formatCurrency(summary.netIncome || 0));

    renderRecentTransactions(transactions);
    renderTable(transactions);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    setText('balanceValue', '$ 0');
    setText('revenueValue', '$ 0');
    setText('expenseValue', '$ 0');
    setText('savingsValue', '$ 0');
  }
};

loadDashboard();
