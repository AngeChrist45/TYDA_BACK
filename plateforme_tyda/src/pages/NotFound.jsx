import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, PackageX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 gradient-primary rounded-full blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 gradient-secondary rounded-full blur-3xl opacity-10 animate-pulse delay-1000"></div>
      
      <div className="max-w-2xl w-full text-center relative z-10">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[180px] md:text-[250px] font-black leading-none bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <PackageX className="h-24 w-24 md:h-32 md:w-32 text-muted-foreground/20 animate-bounce" />
          </div>
        </div>

        {/* Message */}
        <div className="mb-10 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Oups! Page introuvable
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            La page que vous recherchez n'existe pas ou a été déplacée. 
            Retournez à l'accueil pour continuer vos achats.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 px-8 py-4 gradient-primary text-white rounded-xl font-bold hover:shadow-2xl hover:-translate-y-1 transition-all shadow-lg"
          >
            <Home className="h-5 w-5" />
            Retour à l'accueil
          </Link>
          
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary rounded-xl font-bold hover:bg-accent hover:shadow-xl transition-all"
          >
            <Search className="h-5 w-5" />
            Parcourir les produits
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Liens rapides :</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/cart" className="text-sm text-primary hover:underline font-medium">
              Mon panier
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/favorites" className="text-sm text-primary hover:underline font-medium">
              Mes favoris
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/orders" className="text-sm text-primary hover:underline font-medium">
              Mes commandes
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/profile" className="text-sm text-primary hover:underline font-medium">
              Mon profil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
