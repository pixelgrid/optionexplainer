import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';
import { Strategies } from './pages/Strategies';
import { Glossary } from './pages/Glossary';
import { Greeks } from './pages/Greeks';
import { Pricing } from './pages/Pricing';
import { Volatility } from './pages/Volatility';
import { OptionsChain } from './pages/OptionsChain';
import { Lifecycle } from './pages/Lifecycle';
import { Earnings } from './pages/Earnings';
import { Wheel } from './pages/Wheel';
import { RiskManagement } from './pages/RiskManagement';
import { Mistakes } from './pages/Mistakes';
import { VRP } from './pages/VRP';
import { DTE45 } from './pages/DTE45';
import { VIXRegime } from './pages/VIXRegime';
import { Dispersion } from './pages/Dispersion';
import { GammaScalping } from './pages/GammaScalping';
import { PutWrite } from './pages/PutWrite';
import { PMCC } from './pages/PMCC';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Nav />
      <Routes>
        <Route path="/" element={<Strategies />} />
        <Route path="/glossary" element={<Glossary />} />
        <Route path="/greeks" element={<Greeks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/volatility" element={<Volatility />} />
        <Route path="/options-chain" element={<OptionsChain />} />
        <Route path="/lifecycle" element={<Lifecycle />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/wheel" element={<Wheel />} />
        <Route path="/risk" element={<RiskManagement />} />
        <Route path="/mistakes" element={<Mistakes />} />
        <Route path="/vrp" element={<VRP />} />
        <Route path="/dte45" element={<DTE45 />} />
        <Route path="/vix-regime" element={<VIXRegime />} />
        <Route path="/dispersion" element={<Dispersion />} />
        <Route path="/gamma-scalping" element={<GammaScalping />} />
        <Route path="/put-write" element={<PutWrite />} />
        <Route path="/pmcc" element={<PMCC />} />
      </Routes>
    </BrowserRouter>
  );
}
