import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';
import { Strategies } from './pages/Strategies';
import { Glossary } from './pages/Glossary';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Nav />
      <Routes>
        <Route path="/" element={<Strategies />} />
        <Route path="/glossary" element={<Glossary />} />
      </Routes>
    </BrowserRouter>
  );
}
