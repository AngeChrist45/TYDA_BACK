import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Search, Menu, X, Package, Home as HomeIcon, ShoppingBag, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const token = localStorage.getItem('tyda_token');
  const userRole = localStorage.getItem('tyda_user_role');
  const isVendor = userRole === 'vendeur';

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!token,
  });

  // Fonction pour obtenir les initiales de l'utilisateur
  const getInitials = () => {
    if (!user?.data) return 'U';
    const firstName = user.data.firstName || '';
    const lastName = user.data.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
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
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header moderne */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo redesigné */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-green-400 shadow-lg group-hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-105">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-orange-600 via-orange-500 to-green-600 bg-clip-text text-transparent">
                  TYDA
                </span>
                <div className="text-xs text-orange-600 font-semibold tracking-wider">MARKETPLACE</div>
              </div>
            </Link>

            {/* Navigation centrale */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-orange-50 transition-all group"
              >
                <HomeIcon className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-gray-700 group-hover:text-orange-600">Accueil</span>
              </Link>
              <Link 
                to="/products" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-orange-50 transition-all group"
              >
                <Package className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-gray-700 group-hover:text-orange-600">Produits</span>
              </Link>
            </nav>

            {/* Search bar moderne - Plus large */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-6">
              <div className="relative w-full group">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-orange-400 group-focus-within:text-orange-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Rechercher des produits, catégories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-5 py-3.5 bg-gradient-to-r from-orange-50 to-green-50 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-orange-400 focus:shadow-xl transition-all text-gray-700 font-semibold placeholder:text-gray-400 text-base"
                />
              </div>
            </form>

            {/* Actions - Redesign avec initiales */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              {token ? (
                <>
                  {/* Favoris */}
                  <Link 
                    to="/favorites" 
                    className="relative p-3 hover:bg-orange-50 rounded-xl transition-all group hidden sm:block"
                  >
                    <Heart className="h-6 w-6 text-orange-600 group-hover:scale-110 group-hover:fill-orange-600 transition-all" />
                  </Link>
                  
                  {/* Panier */}
                  <Link 
                    to="/cart" 
                    className="relative p-3 hover:bg-orange-50 rounded-xl transition-all group hidden sm:block"
                  >
                    <ShoppingCart className="h-6 w-6 text-orange-600 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-1 right-1 h-5 w-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                      0
                    </span>
                  </Link>

                  {/* Avatar avec initiales */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="relative group"
                    >
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-xl transition-all group-hover:scale-105">
                        {getInitials()}
                      </div>
                      {isVendor && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <ShoppingBag className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                    
                    {/* Menu dropdown modernisé */}
                    {isMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsMenuOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl py-3 border border-orange-100 z-50">
                          {/* User info header */}
                          <div className="px-4 py-3 border-b border-orange-100">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center text-white font-bold text-lg">
                                {getInitials()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">
                                  {user?.data?.firstName} {user?.data?.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{user?.data?.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div className="py-2">
                            <Link 
                              to="/profile" 
                              className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors group"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <UserIcon className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                              <span className="font-semibold text-gray-700">Mon Profil</span>
                            </Link>
                            <Link 
                              to="/orders" 
                              className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors group"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <Package className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
                              <span className="font-semibold text-gray-700">Mes Commandes</span>
                            </Link>
                            {isVendor && (
                              <Link 
                                to="/vendor-dashboard" 
                                className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors group"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <ShoppingBag className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                                <span className="font-semibold text-gray-700">Espace Vendeur</span>
                              </Link>
                            )}
                          </div>

                          {/* Logout */}
                          <div className="border-t border-orange-100 pt-2 mt-2">
                            <button
                              onClick={() => {
                                handleLogout();
                                setIsMenuOpen(false);
                              }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full group"
                            >
                              <LogOut className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
                              <span className="font-semibold text-red-600">Déconnexion</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-5 py-2.5 border-2 border-orange-500 text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-bold"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-green-500 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-orange-50 rounded-xl transition-all"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-orange-600" />
                ) : (
                  <Menu className="h-6 w-6 text-orange-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-orange-100">
              <nav className="flex flex-col space-y-2">
                <Link 
                  to="/" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <HomeIcon className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-gray-700">Accueil</span>
                </Link>
                <Link 
                  to="/products" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Package className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-gray-700">Produits</span>
                </Link>
                {token && (
                  <>
                    <Link 
                      to="/favorites" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-all sm:hidden"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Heart className="h-5 w-5 text-orange-600" />
                      <span className="font-semibold text-gray-700">Favoris</span>
                    </Link>
                    <Link 
                      to="/cart" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-all sm:hidden"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                      <span className="font-semibold text-gray-700">Panier</span>
                  </Link>
                </>
              )}
              </nav>
            </div>
          )}
        </div>
      </header>      {/* Main Content */}
      <main className="min-h-[calc(100vh-5rem)]">
        <Outlet />
      </main>

      {/* Footer moderne */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* À propos */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-green-500 flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <h3 className="font-bold text-xl bg-gradient-to-r from-orange-400 to-green-400 bg-clip-text text-transparent">TYDA</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Votre marketplace de confiance en Côte d'Ivoire. Achetez et vendez en toute sécurité 🇨🇮
              </p>
            </div>

            {/* Liens rapides */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-orange-400">Liens rapides</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/products" className="text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 bg-orange-400 rounded-full group-hover:scale-150 transition-transform"></span>
                    Produits
                  </Link>
                </li>
                <li>
                  <Link to="/categories" className="text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 bg-orange-400 rounded-full group-hover:scale-150 transition-transform"></span>
                    Catégories
                  </Link>
                </li>
                <li>
                  <Link to="/become-vendor" className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 bg-green-400 rounded-full group-hover:scale-150 transition-transform"></span>
                    Devenir Vendeur
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-orange-400">Support</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 bg-orange-400 rounded-full group-hover:scale-150 transition-transform"></span>
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 bg-orange-400 rounded-full group-hover:scale-150 transition-transform"></span>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-2 group">
                    <span className="h-1 w-1 bg-orange-400 rounded-full group-hover:scale-150 transition-transform"></span>
                    Aide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Nous suivre */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-orange-400">Nous suivre</h4>
              <div className="flex gap-3 mb-4">
                <button className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:scale-110 transition-transform flex items-center justify-center">
                  <span className="text-white text-sm font-bold">f</span>
                </button>
                <button className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 hover:scale-110 transition-transform flex items-center justify-center">
                  <span className="text-white text-sm font-bold">tw</span>
                </button>
                <button className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-green-400 hover:scale-110 transition-transform flex items-center justify-center">
                  <span className="text-white text-sm font-bold">in</span>
                </button>
              </div>
              <p className="text-gray-400 text-sm">
                Restez connectés pour les dernières offres
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2025 TYDA. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-orange-400 transition-colors">Confidentialité</Link>
              <Link to="/terms" className="hover:text-orange-400 transition-colors">Conditions</Link>
              <Link to="/cookies" className="hover:text-orange-400 transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
