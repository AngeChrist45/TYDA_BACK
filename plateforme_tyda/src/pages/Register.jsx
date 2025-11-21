import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import { Phone, User, Mail, Lock, Loader2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Info + PIN
  const [phone, setPhone] = useState('+225');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(''); // Code OTP en mode dev
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    pin: '',
    confirmPin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.requestOTP(phone);
      // En développement, le backend renvoie le code OTP
      if (response.data?.data?.otpCode) {
        setDevOtp(response.data.data.otpCode);
        console.log('🔐 Code OTP:', response.data.data.otpCode);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Erreur lors de l\'envoi de l\'OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authApi.verifyOTP(phone, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Code OTP invalide');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete registration with user info + PIN
  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.pin !== formData.confirmPin) {
      setError('Les codes PIN ne correspondent pas');
      return;
    }
    if (formData.pin.length !== 4) {
      setError('Le code PIN doit contenir 4 chiffres');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await authApi.register({
        phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        pin: formData.pin,
      });
      localStorage.setItem('tyda_token', response.data.token);
      localStorage.setItem('tyda_user_role', response.data.user.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-card px-4 py-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 gradient-primary rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 gradient-secondary rounded-full blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Inscription</h1>
            <p className="text-muted-foreground">Créez votre compte TYDA</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s ? 'gradient-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-1 mx-2 transition-all ${
                    step > s ? 'gradient-primary' : 'bg-muted'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Phone Number */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Numéro de téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 XX XX XX XX XX"
                    className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  📱 Vous recevrez un code de vérification par SMS
                </p>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Recevoir le code
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-center">Code de vérification</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="••••••"
                    maxLength="6"
                    className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center text-2xl tracking-widest"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Code envoyé au <span className="font-semibold">{phone}</span>
                </p>
                {devOtp && (
                  <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">🔓 Mode développement</p>
                    <p className="text-lg font-bold text-primary tracking-wider">{devOtp}</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 border border-input rounded-lg font-semibold hover:bg-accent transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      Vérifier
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: User Info + PIN */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Prénom"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Nom"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemple.com"
                    className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Code PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="••••"
                      maxLength="4"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center text-2xl tracking-widest"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirmer PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={formData.confirmPin}
                      onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value })}
                      placeholder="••••"
                      maxLength="4"
                      className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center text-2xl tracking-widest"
                      required
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">🔒 Le code PIN sécurise vos connexions futures</p>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || formData.pin.length !== 4}
                className="w-full py-3 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-primary hover:text-primary/90 font-semibold transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>🇨🇮 Marketplace 100% ivoirienne</p>
        </div>
      </div>
    </div>
  );
}
