import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { EntitiesPage } from './pages/EntitiesPage';
import { ConfigPage } from './pages/ConfigPage';
import { FundsPage } from './pages/FundsPage';
import { PeriodsPage } from './pages/PeriodsPage';
import { ECLRateMatrixPage } from './pages/ECLRateMatrixPage';
import { AssetClassesPage } from './pages/AssetClassesPage';
import { RestatementPage } from './pages/RestatementPage';
import { GraphExplorerPage } from './pages/GraphExplorerPage';
import { FinancialProjectionsPage } from './pages/FinancialProjectionsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="admin-layout">
        <nav className="sidebar">
          <h1>EBG Admin</h1>
          <ul>
            <li className="nav-section">Visualization</li>
            <li><NavLink to="/graph">Graph Explorer</NavLink></li>
            <li><NavLink to="/projections">Financial Projections</NavLink></li>
            <li className="nav-section">Management</li>
            <li><NavLink to="/">Entities</NavLink></li>
            <li><NavLink to="/config">Configuration</NavLink></li>
            <li><NavLink to="/funds">Fund Management</NavLink></li>
            <li><NavLink to="/periods">Accounting Periods</NavLink></li>
            <li><NavLink to="/ecl-rates">ECL Rate Matrix</NavLink></li>
            <li><NavLink to="/asset-classes">Asset Classes</NavLink></li>
            <li><NavLink to="/restatement">Restatement</NavLink></li>
          </ul>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<EntitiesPage />} />
            <Route path="/graph" element={<GraphExplorerPage />} />
            <Route path="/projections" element={<FinancialProjectionsPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/funds" element={<FundsPage />} />
            <Route path="/periods" element={<PeriodsPage />} />
            <Route path="/ecl-rates" element={<ECLRateMatrixPage />} />
            <Route path="/asset-classes" element={<AssetClassesPage />} />
            <Route path="/restatement" element={<RestatementPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
