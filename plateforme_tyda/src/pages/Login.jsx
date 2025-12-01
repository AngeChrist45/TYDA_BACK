import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authApi } from '../lib/api';
import { Phone, Lock, Loader2, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('+225');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ phone, pin });
      localStorage.setItem('tyda_token', response.data.data.token);
      localStorage.setItem('tyda_user_role', response.data.data.user.role);
      
      // Forcer le rechargement pour mettre à jour l'état d'authentification
      window.location.href = from;
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Numéro ou PIN incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-400 to-green-500 px-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-white/80 mb-8 transition-colors font-semibold backdrop-blur-sm bg-white/10 px-4 py-2 rounded-xl border border-white/20">
          <ArrowLeft className="h-5 w-5" />
          Retour à l'accueil
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-10 backdrop-blur-sm border-2 border-orange-200">
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-green-500 mb-6 shadow-xl">
              <span className="text-3xl font-black text-white">T</span>
            </div>
            <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">Bienvenue !</h1>
            <p className="text-gray-600 text-lg font-medium">Accédez à votre compte TYDA</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Input */}
            <div>
              <label className="block text-sm font-black mb-3 text-gray-800">Numéro de téléphone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-orange-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225 XX XX XX XX XX"
                  className="w-full pl-14 pr-5 py-4 bg-gradient-to-r from-orange-50 to-green-50 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-orange-400 transition-all font-semibold text-gray-700"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 font-semibold">Format: +225XXXXXXXXXX</p>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-sm font-black mb-3 text-gray-800">Code PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-orange-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength="4"
                  className="w-full pl-14 pr-5 py-4 bg-gradient-to-r from-orange-50 to-green-50 border-2 border-orange-200 rounded-2xl focus:outline-none focus:border-orange-400 transition-all text-center text-3xl tracking-widest font-black"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 font-semibold">Votre code PIN à 4 chiffres</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 text-red-600 rounded-2xl text-sm flex items-start gap-3 font-semibold">
                <span className="text-2xl">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-green-500 text-white rounded-2xl font-black text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center pt-6 border-t-2 border-orange-100">
            <p className="text-gray-600 font-semibold">
              Vous n'avez pas de compte ?{' '}
              <Link to="/register" className="text-orange-600 hover:text-orange-700 font-black hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-white/90 text-sm backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
          <p className="font-semibold">🔒 Connexion sécurisée SSL</p>
        </div>
      </div>
    </div>
  );
}
