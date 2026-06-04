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
import { FinancialStatements } from './pages/FinancialStatements';
import { EarningsSurprises } from './pages/EarningsSurprises';
import { ValuationSnapshot } from './pages/ValuationSnapshot';
import { DCFCalculator } from './pages/DCFCalculator';
import { DividendSafety } from './pages/DividendSafety';
import { Landing } from './pages/Landing';
import { NewsSentiment } from './pages/NewsSentiment';
import { ZeroCostCollar } from './pages/ZeroCostCollar';
import { StocksGlossary } from './pages/StocksGlossary';
import { ResearchFramework } from './pages/ResearchFramework';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/strategies" element={<Strategies />} />
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
        <Route path="/financials" element={<FinancialStatements />} />
        <Route path="/earnings-history" element={<EarningsSurprises />} />
        <Route path="/valuation" element={<ValuationSnapshot />} />
        <Route path="/dcf" element={<DCFCalculator />} />
        <Route path="/dividends" element={<DividendSafety />} />
        <Route path="/news-sentiment" element={<NewsSentiment />} />
        <Route path="/zero-cost-collar" element={<ZeroCostCollar />} />
        <Route path="/stocks-glossary" element={<StocksGlossary />} />
        <Route path="/research-framework" element={<ResearchFramework />} />
      </Routes>
    </BrowserRouter>
  );
}
