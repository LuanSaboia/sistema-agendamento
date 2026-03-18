// src/pages/Home.tsx
import CalendarView from '../components/CalendarView';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900 underline decoration-blue-500">Acompanhamentos</h1>
        {user ? (
          <Link to="/admin" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg">Painel Admin</Link>
        ) : (
          <Link to="/login" className="text-sm text-slate-500 hover:text-blue-600">Login</Link>
        )}
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100">
          <CalendarView />
        </div>
      </main>
    </div>
  );
}