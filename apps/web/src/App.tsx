import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<div className="flex h-screen items-center justify-center"><h1 className="text-2xl font-bold">Car Rental Platform - Dashboard</h1></div>} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
