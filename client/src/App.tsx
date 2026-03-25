import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { EntitiesPage } from './pages/EntitiesPage';
import { ConfigPage } from './pages/ConfigPage';
import { FundsPage } from './pages/FundsPage';
import { PeriodsPage } from './pages/PeriodsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="admin-layout">
        <nav className="sidebar">
          <h1>EBG Admin</h1>
          <ul>
            <li><NavLink to="/">Entities</NavLink></li>
            <li><NavLink to="/config">Configuration</NavLink></li>
            <li><NavLink to="/funds">Fund Management</NavLink></li>
            <li><NavLink to="/periods">Accounting Periods</NavLink></li>
          </ul>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<EntitiesPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/funds" element={<FundsPage />} />
            <Route path="/periods" element={<PeriodsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
