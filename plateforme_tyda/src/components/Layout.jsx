import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi, cartApi } from '../lib/api';

export default function Layout() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState('');
  
  const token = localStorage.getItem('tyda_token');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!token,
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    enabled: !!token,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const cartItemsCount = cart?.data?.data?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const getInitials = () => {
    if (!user?.data) return 'U';
    const firstName = user.data.firstName || '';
    const lastName = user.data.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tyda_token');
    localStorage.removeItem('tyda_user_role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar épurée */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo simple */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">
                TYDA
              </span>
            </Link>

            {/* Navigation desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">
                Accueil
              </Link>
              <Link to="/products" className="text-gray-700 hover:text-gray-900 font-medium">
                Produits
              </Link>
              <Link to="/categories" className="text-gray-700 hover:text-gray-900 font-medium">
                Catégories
              </Link>
            </div>

            {/* Search bar */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF6B35]"
                />
              </form>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/favorites" className="text-gray-700 hover:text-[#FF6B35]">
                ♥
              </Link>
              <Link to="/cart" className="relative text-gray-700 hover:text-[#FF6B35]">
                🛒
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#FF6B35] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
              
              {token ? (
                <div className="relative group">
                  <button className="w-10 h-10 bg-[#FF6B35] text-white rounded-full font-medium">
                    {getInitials()}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-50">
                      Mon profil
                    </Link>
                    <Link to="/orders" className="block px-4 py-2 hover:bg-gray-50">
                      Mes commandes
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="px-6 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b]"
                >
                  Connexion
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <form onSubmit={handleSearch} className="px-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </form>
                <Link to="/" className="px-2 py-2 text-gray-700 hover:text-gray-900">
                  Accueil
                </Link>
                <Link to="/products" className="px-2 py-2 text-gray-700 hover:text-gray-900">
                  Produits
                </Link>
                <Link to="/categories" className="px-2 py-2 text-gray-700 hover:text-gray-900">
                  Catégories
                </Link>
                <Link to="/favorites" className="px-2 py-2 text-gray-700 hover:text-gray-900">
                  Favoris
                </Link>
                <Link to="/cart" className="px-2 py-2 text-gray-700 hover:text-gray-900">
                  Panier
                </Link>
                {token ? (
                  <>
                    <Link to="/profile" className="px-2 py-2 text-gray-700 hover:text-gray-900">
                      Mon profil
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="text-left px-2 py-2 text-red-600"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="px-2 py-2 text-[#FF6B35]">
                    Connexion
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="min-h-screen">
        <Outlet />
      </main>

      {/* Footer simple */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">TYDA</h3>
              <p className="text-gray-600 text-sm">
                La marketplace ivoirienne de confiance
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Navigation</h4>
              <div className="flex flex-col space-y-2 text-sm">
                <Link to="/products" className="text-gray-600 hover:text-gray-900">
                  Produits
                </Link>
                <Link to="/categories" className="text-gray-600 hover:text-gray-900">
                  Catégories
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Aide</h4>
              <div className="flex flex-col space-y-2 text-sm">
                <Link to="/faq" className="text-gray-600 hover:text-gray-900">
                  FAQ
                </Link>
                <Link to="/contact" className="text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Légal</h4>
              <div className="flex flex-col space-y-2 text-sm">
                <Link to="/terms" className="text-gray-600 hover:text-gray-900">
                  CGU
                </Link>
                <Link to="/privacy" className="text-gray-600 hover:text-gray-900">
                  Confidentialité
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            © 2025 TYDA. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
