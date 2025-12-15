import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi, cartApi } from '../lib/api';
import tydaLogo from '../assets/TYDA.png';

export default function Layout() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const token = localStorage.getItem('tyda_token');

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar moderne et professionnelle */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo professionnel avec image */}
            <Link to="/" className="flex items-center group">
              <img 
                src={tydaLogo} 
                alt="TYDA Logo" 
                className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Navigation desktop avec style moderne */}
            <div className="hidden lg:flex items-center space-x-1">
              <Link 
                to="/" 
                className="px-4 py-2 text-gray-700 hover:text-[#FF6B35] hover:bg-gray-50 rounded-lg font-medium transition-all"
              >
                Accueil
              </Link>
              <Link 
                to="/products" 
                className="px-4 py-2 text-gray-700 hover:text-[#FF6B35] hover:bg-gray-50 rounded-lg font-medium transition-all"
              >
                Produits
              </Link>
              <Link 
                to="/categories" 
                className="px-4 py-2 text-gray-700 hover:text-[#FF6B35] hover:bg-gray-50 rounded-lg font-medium transition-all"
              >
                Catégories
              </Link>
            </div>

            {/* Search bar moderne */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative">
                <svg 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B35] focus:bg-white transition-all"
                />
              </form>
            </div>

            {/* Actions avec badges et dropdown */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Favoris */}
              <Link 
                to="/favorites" 
                className="p-3 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-50 rounded-xl transition-all relative"
                title="Favoris"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Panier avec badge */}
              <Link 
                to="/cart" 
                className="p-3 text-gray-600 hover:text-[#FF6B35] hover:bg-gray-50 rounded-xl transition-all relative"
                title="Panier"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#FF6B35] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </Link>
              
              {/* Profile dropdown ou bouton connexion */}
              {token ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B35] to-[#e55a2b] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                      {getInitials()}
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu amélioré */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                      {/* Header du dropdown */}
                      <div className="px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] text-white">
                        <p className="text-sm font-medium">{user?.data?.firstName} {user?.data?.lastName}</p>
                        <p className="text-xs opacity-90">{user?.data?.email || user?.data?.phone}</p>
                      </div>

                      {/* Menu items */}
                      <div className="py-2">
                        <Link 
                          to="/profile" 
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-[#FF6B35] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-700 group-hover:text-gray-900 font-medium">Mon profil</span>
                        </Link>

                        <Link 
                          to="/orders" 
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-[#FF6B35] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span className="text-gray-700 group-hover:text-gray-900 font-medium">Mes commandes</span>
                        </Link>

                        <div className="border-t border-gray-100 my-2"></div>

                        <button 
                          onClick={() => {
                            handleLogout();
                            setProfileDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-3 hover:bg-red-50 transition-colors group"
                        >
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span className="text-gray-700 group-hover:text-red-600 font-medium">Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] text-white rounded-xl hover:shadow-lg font-medium transition-all transform hover:scale-105"
                >
                  Connexion
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu amélioré */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 animate-fadeIn">
              <div className="flex flex-col space-y-1">
                {/* Search mobile */}
                <form onSubmit={handleSearch} className="px-2 mb-4">
                  <div className="relative">
                    <svg 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6B35]"
                    />
                  </div>
                </form>

                <Link to="/" className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Accueil
                </Link>
                <Link to="/products" className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Produits
                </Link>
                <Link to="/categories" className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Catégories
                </Link>
                <Link to="/favorites" className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Favoris
                </Link>
                <Link to="/cart" className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center justify-between" onClick={() => setMobileMenuOpen(false)}>
                  <span>Panier</span>
                  {cartItemsCount > 0 && (
                    <span className="bg-[#FF6B35] text-white text-xs px-2 py-1 rounded-full font-bold">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
                
                <div className="border-t border-gray-200 my-2"></div>
                
                {token ? (
                  <>
                    <div className="px-4 py-2 bg-gray-50 rounded-lg mb-2">
                      <p className="text-sm font-medium text-gray-900">{user?.data?.firstName} {user?.data?.lastName}</p>
                      <p className="text-xs text-gray-600">{user?.data?.email || user?.data?.phone}</p>
                    </div>
                    <Link to="/profile" className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                      Mon profil
                    </Link>
                    <Link to="/orders" className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                      Mes commandes
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    className="mx-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] text-white rounded-xl text-center font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
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
