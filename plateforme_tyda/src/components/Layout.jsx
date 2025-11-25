import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Store } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const token = localStorage.getItem('tyda_token');
  const userRole = localStorage.getItem('tyda_user_role');
  const isVendor = userRole === 'vendeur';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tyda_token');
    localStorage.removeItem('tyda_user_role');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="h-8 w-8 rounded-lg gradient-primary shadow-lg group-hover:shadow-xl transition-shadow"></div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                TYDA
              </span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              {token ? (
                <>
                  <Link to="/favorites" className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-all">
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link to="/cart" className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-all relative">
                    <ShoppingCart className="h-5 w-5" />
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-all"
                    >
                      <User className="h-5 w-5" />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl py-2">
                        <Link to="/profile" className="block px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                          Mon Profil
                        </Link>
                        <Link to="/orders" className="block px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                          Mes Commandes
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          Déconnexion
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 transition-all shadow-sm hover:shadow-md font-medium"
                >
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">TYDA</h3>
              <p className="text-sm text-muted-foreground">
                Votre marketplace de confiance en Côte d'Ivoire
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">Produits</Link></li>
                <li><Link to="/categories" className="text-muted-foreground hover:text-primary transition-colors">Catégories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Vendeur</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/become-vendor" className="text-muted-foreground hover:text-primary transition-colors">Devenir Vendeur</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 TYDA. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
