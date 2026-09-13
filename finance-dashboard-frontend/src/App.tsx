import { useEffect, useMemo, useState } from 'react';
import './App.css';

type Transaction = {
  _id?: string;
  date: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  status: 'completed' | 'pending' | 'failed';
  user: string;
  description: string;
};

type Summary = {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalTransactions: number;
};

type SortKey = 'date' | 'amount' | 'user' | 'category' | 'status';

const API_BASE = 'http://localhost:5000/api';
const ALL_COLUMNS = ['date', 'amount', 'type', 'category', 'status', 'user', 'description'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('financeToken'));
  const [user, setUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('financeUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [chartView, setChartView] = useState<'income' | 'expenses' | 'monthly'>('income');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPerson, setSelectedPerson] = useState('Sneha Iyer');
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    user: '',
    category: 'Marketing',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    status: 'pending',
    type: 'expense',
  });
  const [loginForm, setLoginForm] = useState({
    email: 'admin@financedash.com',
    password: 'Admin@123',
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(ALL_COLUMNS);
  const [exportPreset, setExportPreset] = useState<'filtered' | 'all' | 'monthly'>('filtered');

  const fetchDashboard = async (authToken: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load dashboard data. Please log in again.');
      }

      const payload = await response.json();
      setSummary(payload.summary || null);
      setTransactions(payload.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
    }
  }, [token]);

  const filteredTransactions = useMemo(() => {
    const filtered = [...transactions].filter((item) => {
      const matchesSearch =
        !search ||
        [item.user, item.category, item.type, item.status, item.description]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesType;
    });

    filtered.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (sortKey === 'amount') {
        return (a.amount - b.amount) * direction;
      }

      if (sortKey === 'date') {
        return ((new Date(a.date).getTime() - new Date(b.date).getTime()) * direction);
      }

      return String(a[sortKey]).localeCompare(String(b[sortKey])) * direction;
    });

    return filtered;
  }, [transactions, search, categoryFilter, statusFilter, typeFilter, sortDirection, sortKey]);

  const categories = useMemo(
    () => [...new Set(transactions.map((item) => item.category))],
    [transactions]
  );

  const candidateUsers = useMemo(
    () => [...new Set(transactions.map((item) => item.user))].slice(0, 6),
    [transactions]
  );

  const visiblePeople = useMemo(
    () => (showAllProfiles ? candidateUsers : candidateUsers.slice(0, 3)),
    [candidateUsers, showAllProfiles]
  );

  const selectedPersonChartData = useMemo(() => {
    const monthly = Array.from({ length: 12 }, (_, index) => ({
      label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index],
      value: 0,
      expenseValue: 0,
    }));

    transactions
      .filter((item) => item.user === selectedPerson)
      .forEach((item) => {
        const monthIndex = new Date(item.date).getMonth();
        if (item.type === 'revenue') {
          monthly[monthIndex].value += item.amount;
        }
        if (item.type === 'expense') {
          monthly[monthIndex].expenseValue += item.amount;
        }
      });

    return monthly;
  }, [transactions, selectedPerson]);

  const activeChartData = useMemo(() => {
    if (chartView === 'expenses') {
      return selectedPersonChartData.map((point) => ({ ...point, value: point.expenseValue }));
    }

    if (chartView === 'monthly') {
      return selectedPersonChartData.map((point) => ({ ...point, value: point.value + point.expenseValue }));
    }

    return selectedPersonChartData.map((point) => ({ ...point, value: point.value }));
  }, [selectedPersonChartData, chartView]);

  const personChartMax = useMemo(
    () => Math.max(...activeChartData.map((point) => point.value), 1),
    [activeChartData]
  );

  const yAxisLabels = useMemo(() => {
    const step = personChartMax / 4;
    return Array.from({ length: 4 }, (_, index) => Math.round(personChartMax - step * index));
  }, [personChartMax]);

  const handleSort = (field: SortKey) => {
    if (sortKey === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(field);
    setSortDirection('desc');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('financeToken', data.token);
      localStorage.setItem('financeUser', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('financeToken');
    localStorage.removeItem('financeUser');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setSummary(null);
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((item) => item !== column)
        : [...prev, column]
    );
  };

  const handleExport = async () => {
    if (!token) return;

    const columns = selectedColumns.join(',');
    const response = await fetch(`${API_BASE}/export/csv?columns=${encodeURIComponent(columns)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Export failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'financial-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const handleAddTransaction = () => {
    const userName = transactionForm.user.trim();
    const amount = Number(transactionForm.amount);

    if (!userName || !transactionForm.category || !transactionForm.date || !amount || amount <= 0) {
      setError('Please fill in valid name, category, date, and amount.');
      return;
    }

    const newTransaction: Transaction = {
      _id: `manual-${Date.now()}`,
      user: userName,
      category: transactionForm.category,
      date: transactionForm.date,
      amount,
      type: transactionForm.type as 'revenue' | 'expense',
      status: transactionForm.status as 'completed' | 'pending' | 'failed',
      description: `${transactionForm.type} entry for ${userName}`,
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    setSummary((prev) => {
      if (!prev) return prev;

      const nextSummary = { ...prev };
      if (newTransaction.type === 'revenue') {
        nextSummary.totalRevenue += newTransaction.amount;
        nextSummary.netIncome += newTransaction.amount;
      } else {
        nextSummary.totalExpenses += newTransaction.amount;
        nextSummary.netIncome -= newTransaction.amount;
      }
      nextSummary.totalTransactions += 1;
      return nextSummary;
    });

    setTransactionForm({
      user: '',
      category: 'Marketing',
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      status: 'pending',
      type: 'expense',
    });
    setAddTransactionOpen(false);
    setError('');
  };

  if (!token || !user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="brand-wrap auth-brand">
            <div className="brand-mark">
              <span className="mark-green" />
              <span className="mark-gold" />
              <span className="mark-blue" />
            </div>
            <div className="brand-name">Penta</div>
          </div>

          <h1>Finance Analytics</h1>
          <p className="subtitle">Sign in to access your dashboard</p>

          {error ? <div className="alert-chip danger">{error}</div> : null}

          <form onSubmit={handleLogin} className="auth-form">
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </label>

            <button type="submit" className="primary-btn">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const linePoints = activeChartData
    .map((point, index) => `${index * 48 + 8},${110 - (point.value / Math.max(personChartMax, 1)) * 90}`)
    .join(' ');

  const pageTitle = activeNav === 'Setting' ? 'Settings' : activeNav;

  const renderNavContent = () => {
    if (activeNav === 'Transactions') {
      return (
        <div className="subpage">
          <header className="subpage-header">
            <div>
              <p className="eyebrow">Operations</p>
              <h2>Transaction overview</h2>
            </div>
            <button className="ghost-btn" type="button" onClick={() => setAddTransactionOpen(true)}>Add transaction</button>
          </header>

          <div className="stat-grid">
            <div className="info-card">
              <span>Total volume</span>
              <strong>{formatCurrency(summary?.totalRevenue || 0)}</strong>
            </div>
            <div className="info-card">
              <span>Pending</span>
              <strong>{transactions.filter((item) => item.status === 'pending').length}</strong>
            </div>
            <div className="info-card">
              <span>Completed</span>
              <strong>{transactions.filter((item) => item.status === 'completed').length}</strong>
            </div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-header">
              <h2>Cash flow</h2>
            </div>
            <div className="mini-chart" aria-label="Transaction flow chart">
              {[55, 72, 64, 94, 88, 110, 80, 102, 96, 120, 114, 130].map((value, index) => (
                <div key={index} className="mini-bar-wrap">
                  <span className="mini-bar" style={{ height: `${value}%` }} />
                  <small>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}</small>
                </div>
              ))}
            </div>
          </div>

          <section className="table-panel panel">
            <div className="table-header">
              <h2>Recent entries</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 8).map((item) => (
                  <tr key={item._id || `${item.user}-${item.date}`}>
                    <td className="person-cell">
                      <div className="mini-avatar mini-one">{item.user.charAt(0).toUpperCase()}</div>
                      <span>{item.user}</span>
                    </td>
                    <td>{formatDate(item.date)}</td>
                    <td><span className="category-pill">{item.category}</span></td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td><span className={`status ${item.status === 'completed' ? 'success' : item.status === 'failed' ? 'failed' : 'pending'}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {addTransactionOpen ? (
            <div className="modal-backdrop" onClick={() => setAddTransactionOpen(false)}>
              <div className="modal-card transaction-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header-row">
                  <div>
                    <p className="eyebrow">Create</p>
                    <h3>Add transaction</h3>
                  </div>
                  <button className="close-modal" type="button" aria-label="Close add transaction modal" onClick={() => setAddTransactionOpen(false)}>
                    ×
                  </button>
                </div>

                <div className="transaction-form-grid">
                  <label>
                    Name
                    <input
                      type="text"
                      value={transactionForm.user}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, user: event.target.value }))}
                      placeholder="Enter name"
                    />
                  </label>

                  <label>
                    Category
                    <input
                      type="text"
                      value={transactionForm.category}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, category: event.target.value }))}
                      placeholder="e.g. Marketing"
                    />
                  </label>

                  <label>
                    Date
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, date: event.target.value }))}
                    />
                  </label>

                  <label>
                    Amount
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={transactionForm.amount}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, amount: event.target.value }))}
                      placeholder="0"
                    />
                  </label>

                  <label>
                    Status
                    <select
                      value={transactionForm.status}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </label>

                  <label>
                    Type
                    <select
                      value={transactionForm.type}
                      onChange={(event) => setTransactionForm((prev) => ({ ...prev, type: event.target.value }))}
                    >
                      <option value="expense">Expense</option>
                      <option value="revenue">Revenue</option>
                    </select>
                  </label>
                </div>

                <div className="modal-actions">
                  <button className="secondary-btn" type="button" onClick={() => setAddTransactionOpen(false)}>
                    Cancel
                  </button>
                  <button className="primary-btn" type="button" onClick={handleAddTransaction}>
                    Save transaction
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    if (activeNav === 'Wallet') {
      return (
        <div className="subpage">
          <header className="subpage-header">
            <div>
              <p className="eyebrow">Portfolio</p>
              <h2>Wallet summary</h2>
            </div>
          </header>

          <div className="stat-grid wallet-grid">
            <div className="info-card accent-green">
              <span>Available</span>
              <strong>{formatCurrency(summary?.netIncome || 0)}</strong>
            </div>
            <div className="info-card accent-gold">
              <span>Invested</span>
              <strong>{formatCurrency((summary?.totalRevenue || 0) * 0.38)}</strong>
            </div>
            <div className="info-card accent-blue">
              <span>Reserved</span>
              <strong>{formatCurrency((summary?.totalExpenses || 0) * 0.25)}</strong>
            </div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-header">
              <h2>Balance allocation</h2>
            </div>
            <div className="donut-wrap">
              <div className="donut-chart">
                <div className="donut-center">
                  <strong>{formatCurrency(summary?.netIncome || 0)}</strong>
                </div>
              </div>
              <div className="legend-list">
                <div><span className="legend-color green" /> Cash</div>
                <div><span className="legend-color gold" /> Growth</div>
                <div><span className="legend-color blue" /> Reserve</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeNav === 'Analytics') {
      return (
        <div className="subpage">
          <header className="subpage-header">
            <div>
              <p className="eyebrow">Insights</p>
              <h2>Performance analytics</h2>
            </div>
          </header>

          <div className="stat-grid">
            <div className="info-card">
              <span>Net margin</span>
              <strong>{((summary?.netIncome || 0) / Math.max(summary?.totalRevenue || 1, 1) * 100).toFixed(1)}%</strong>
            </div>
            <div className="info-card">
              <span>Expense ratio</span>
              <strong>{((summary?.totalExpenses || 0) / Math.max(summary?.totalRevenue || 1, 1) * 100).toFixed(1)}%</strong>
            </div>
            <div className="info-card">
              <span>Forecast</span>
              <strong>{formatCurrency((summary?.totalRevenue || 0) * 1.12)}</strong>
            </div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-header">
              <h2>Income trend</h2>
            </div>
            <div className="trend-box">
              <svg viewBox="0 0 560 180" preserveAspectRatio="none" aria-label="Analytics trend chart">
                <path d="M0 150 C80 120, 140 90, 210 110 S330 160, 400 90 S500 50, 560 70" className="income-line" />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    if (activeNav === 'Personal') {
      return (
        <div className="subpage">
          <header className="subpage-header">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>Personal finance</h2>
            </div>
          </header>

          <div className="profile-layout">
            <div className="panel profile-card">
              <div className="profile-avatar-large">{user.name?.[0] || 'A'}</div>
              <h3>{user.name || 'Admin User'}</h3>
              <p>{user.email}</p>
            </div>
            <div className="panel profile-detail">
              <div className="detail-item"><span>Monthly target</span><strong>{formatCurrency(210000)}</strong></div>
              <div className="detail-item"><span>Saved this month</span><strong>{formatCurrency(65000)}</strong></div>
              <div className="detail-item"><span>Spend limit</span><strong>{formatCurrency(98000)}</strong></div>
            </div>
          </div>
        </div>
      );
    }

    if (activeNav === 'Message') {
      return (
        <div className="subpage">
          <header className="subpage-header">
            <div>
              <p className="eyebrow">Communications</p>
              <h2>Inbox</h2>
            </div>
          </header>

          <div className="message-list">
            {[
              ['Finance reminder', 'Your cash reserve is above target by 8%.'],
              ['Settlement update', 'Two pending payments were cleared today.'],
              ['System alert', 'CSV export is ready for download.'],
            ].map(([title, body], index) => (
              <div className="panel message-item" key={title}>
                <span className="message-badge">{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeNav === 'Setting') {
      return (
        <div className="subpage">
          <header className="subpage-header">
            <div>
              <p className="eyebrow">Preferences</p>
              <h2>Dashboard settings</h2>
            </div>
          </header>

          <div className="settings-grid">
            <div className="panel setting-item">
              <span>Currency</span>
              <strong>INR</strong>
            </div>
            <div className="panel setting-item">
              <span>Timezone</span>
              <strong>UTC+5:30</strong>
            </div>
            <div className="panel setting-item">
              <span>Notifications</span>
              <strong>Enabled</strong>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-page">
        <header className="topbar">
          <h1>{pageTitle}</h1>
          <div className="topbar-actions">
            <button className="bell-button" aria-label="notifications" type="button" />
            <button className="profile-pill" type="button" onClick={handleLogout}>
              <div className="profile-avatar">{user.name?.[0] || 'A'}</div>
            </button>
          </div>
        </header>

        {error ? (
          <div className="alert-chip danger" role="alert">
            <span>{error}</span>
            <button type="button" aria-label="Dismiss alert" onClick={() => setError('')}>
              ×
            </button>
          </div>
        ) : null}

        <section className="metrics-row">
          <div className="metric-card">
            <div className="metric-label">Balance</div>
            <div className="metric-value">{formatCurrency(summary?.netIncome || 0)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Revenue</div>
            <div className="metric-value green">{formatCurrency(summary?.totalRevenue || 0)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Expenses</div>
            <div className="metric-value">{formatCurrency(summary?.totalExpenses || 0)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Savings</div>
            <div className="metric-value">{formatCurrency(summary?.netIncome || 0)}</div>
          </div>
        </section>

        <section className="content-grid">
          <div className="chart-panel panel">
            <div className="panel-header">
              <h2>{selectedPerson}'s overview</h2>
              <div className="segmented-control">
                <button
                  className={`tag ${chartView === 'income' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setChartView('income')}
                >
                  Income
                </button>
                <button
                  className={`tag ${chartView === 'expenses' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setChartView('expenses')}
                >
                  Expenses
                </button>
                <button
                  className={`tag ${chartView === 'monthly' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setChartView('monthly')}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="chart-area">
              <div className="y-axis" aria-label="Y-axis values">
                {yAxisLabels.map((label) => (
                  <span key={label}>₹{label.toLocaleString('en-IN')}</span>
                ))}
              </div>

              <div className="chart-frame">
                <div className="chart-legend" aria-label="Chart legend">
                  <span><i className="legend-dot income-dot" /> Income</span>
                  <span><i className="legend-dot expense-dot" /> Expenses</span>
                  <span><i className="legend-dot person-dot" /> {selectedPerson}</span>
                </div>
                <svg viewBox="0 0 560 210" preserveAspectRatio="none" aria-label={`${selectedPerson} ${chartView} chart`}>
                  <g className="grid-lines">
                    <line x1="0" y1="20" x2="560" y2="20" />
                    <line x1="0" y1="70" x2="560" y2="70" />
                    <line x1="0" y1="120" x2="560" y2="120" />
                    <line x1="0" y1="170" x2="560" y2="170" />
                  </g>
                  <polyline className="income-line" points={linePoints} />
                  <path className="expense-line" d="M0,120 C70,90 130,150 180,100 S260,50 300,95 S360,150 430,80 S510,40 560,95" />
                  <g className="chart-mark">
                    <circle cx="280" cy="95" r="6" />
                    <text x="318" y="100">{formatCurrency(Math.max(...activeChartData.map((point) => point.value), 0))}</text>
                  </g>
                </svg>
                <div className="x-axis" aria-label="X-axis months">
                  {activeChartData.map((point) => (
                    <span key={point.label}>{point.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="transactions-panel panel">
            <div className="panel-header small-header">
              <h2>Recent Transaction</h2>
              <button
                type="button"
                className="see-all-btn"
                onClick={() => setShowAllProfiles((prev) => !prev)}
              >
                {showAllProfiles ? 'Show less' : 'See all'}
              </button>
            </div>

            <div className="txn-list">
              {visiblePeople.map((person, index) => {
                const avatarClass = ['avatar-one', 'avatar-two', 'avatar-three'][index % 3];
                const isSelected = person === selectedPerson;
                const avatarLetter = person.charAt(0).toUpperCase();
                const personTotal = transactions
                  .filter((item) => item.user === person)
                  .reduce((sum, item) => sum + item.amount, 0);

                return (
                  <button
                    key={person}
                    type="button"
                    className={`person-button ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPerson(person)}
                  >
                    <div className={`avatar ${avatarClass}`}>{avatarLetter}</div>
                    <div className="txn-main">
                      <span className="txn-type">{isSelected ? 'Selected profile' : 'Transfer to'}</span>
                      <strong>{person}</strong>
                    </div>
                    <div className="txn-amount positive">{formatCurrency(personTotal)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="table-panel panel">
          <div className="table-header">
            <h2>Transactions</h2>
            <div className="table-controls">
              <input
                className="search-field"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search for anything..."
              />
              <button className="ghost-btn" type="button" onClick={() => setExportOpen(true)}>
                Export CSV
              </button>
            </div>
          </div>

          <div className="filters-row">
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All types</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('user')}>Name</th>
                <th onClick={() => handleSort('date')}>Date</th>
                <th onClick={() => handleSort('category')}>Category</th>
                <th onClick={() => handleSort('amount')}>Amount</th>
                <th onClick={() => handleSort('status')}>Status</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((item) => (
                <tr key={item._id || `${item.user}-${item.date}-${item.amount}`}>
                  <td className="person-cell">
                    <div className="mini-avatar mini-one">{item.user.charAt(0).toUpperCase()}</div>
                    <span>{item.user}</span>
                  </td>
                  <td>{formatDate(item.date)}</td>
                  <td>
                    <span className="category-pill">{item.category}</span>
                  </td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>
                    <span className={`status ${item.status === 'completed' ? 'success' : item.status === 'failed' ? 'failed' : 'pending'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <span className={`type-pill ${item.type === 'revenue' ? 'revenue' : 'expense'}`}>
                      {item.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading ? <div className="empty-state">Loading data...</div> : null}
          {!loading && filteredTransactions.length === 0 ? (
            <div className="empty-state">No transactions match the current filters.</div>
          ) : null}
        </section>

        {exportOpen ? (
          <div className="modal-backdrop" onClick={() => setExportOpen(false)}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header-row">
                <div>
                  <p className="eyebrow">Export report</p>
                  <h3>Customize your CSV</h3>
                </div>
                <button className="close-modal" type="button" aria-label="Close export modal" onClick={() => setExportOpen(false)}>
                  ×
                </button>
              </div>

              <div className="export-summary-box">
                <div>
                  <span>Rows</span>
                  <strong>{filteredTransactions.length}</strong>
                </div>
                <div>
                  <span>Scope</span>
                  <strong>{exportPreset === 'all' ? 'All data' : exportPreset === 'monthly' ? 'Monthly snapshot' : 'Filtered view'}</strong>
                </div>
                <div>
                  <span>Net</span>
                  <strong>{formatCurrency(summary?.netIncome || 0)}</strong>
                </div>
              </div>

              <div className="export-presets">
                {[
                  ['filtered', 'Filtered view'],
                  ['all', 'All records'],
                  ['monthly', 'Monthly summary'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`preset-btn ${exportPreset === value ? 'active' : ''}`}
                    onClick={() => setExportPreset(value as 'filtered' | 'all' | 'monthly')}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="column-grid">
                {ALL_COLUMNS.map((column) => (
                  <label key={column} className="column-option">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column)}
                      onChange={() => toggleColumn(column)}
                    />
                    <span>{column}</span>
                  </label>
                ))}
              </div>

              <div className="modal-actions">
                <button className="secondary-btn" type="button" onClick={() => setExportOpen(false)}>
                  Cancel
                </button>
                <button className="primary-btn" type="button" onClick={handleExport}>
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-mark">
            <span className="mark-green" />
            <span className="mark-gold" />
            <span className="mark-blue" />
          </div>
          <div className="brand-name">Penta</div>
        </div>

        <nav className="nav">
          {['Dashboard', 'Transactions', 'Wallet', 'Analytics', 'Personal', 'Message', 'Setting'].map((label) => (
            <button
              key={label}
              type="button"
              className={`nav-item ${activeNav === label ? 'active' : ''}`}
              onClick={() => setActiveNav(label)}
            >
              <span className={`icon ${
                label === 'Dashboard' ? 'grid-icon' :
                label === 'Transactions' ? 'card-icon' :
                label === 'Wallet' ? 'wallet-icon' :
                label === 'Analytics' ? 'chart-icon' :
                label === 'Personal' ? 'person-icon' :
                label === 'Message' ? 'message-icon' : 'settings-icon'
              }`} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        {renderNavContent()}
      </main>
    </div>
  );
}

export default App;
