import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, MessageSquare, LogOut } from 'lucide-react';

export default function VendorLayout() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('tyda_token');
    localStorage.removeItem('tyda_user_role');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r min-h-screen bg-card">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary"></div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                TYDA Vendeur
              </span>
            </Link>

            <nav className="space-y-2">
              <Link
                to="/vendor"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/vendor')
                    ? 'bg-primary text-white'
                    : 'hover:bg-accent'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Tableau de bord</span>
              </Link>

              <Link
                to="/vendor/products"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/vendor/products')
                    ? 'bg-primary text-white'
                    : 'hover:bg-accent'
                }`}
              >
                <Package className="h-5 w-5" />
                <span>Mes produits</span>
              </Link>

              <Link
                to="/vendor/negotiations"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive('/vendor/negotiations')
                    ? 'bg-primary text-white'
                    : 'hover:bg-accent'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span>Négociations</span>
              </Link>
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent w-full mt-8 text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
