import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Lock, AlertCircle, Loader2, LogIn, School } from 'lucide-react'
import { toast } from 'sonner'
import { login, LoginCredentials } from '../services/apiService'

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Animation d'entrée et vérification des erreurs d'authentification
  useEffect(() => {
    setShowWelcome(true)

    // Vérifier s'il y a un message d'erreur d'authentification dans sessionStorage
    const authError = sessionStorage.getItem('auth_error')
    if (authError) {
      setError(authError)
      sessionStorage.removeItem('auth_error')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Utiliser le service d'authentification pour se connecter
      const credentials: LoginCredentials = { username, password }

      // Authentification réelle
      try {
        await login(credentials)
        toast.success('Connexion réussie')
        navigate('/dashboard')
      } catch (apiError) {
        console.error("Erreur d'API:", apiError)
        setError('Identifiants invalides ou serveur indisponible.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Erreur de connexion:', err)
      setError('Erreur de connexion. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-all duration-500">
      <div
        className={`sm:mx-auto sm:w-full sm:max-w-md transform transition-all duration-700 ${
          showWelcome ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="flex justify-center items-center mb-2">
          <div className="bg-blue-600 p-3 rounded-full shadow-md">
            <School className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
          Connexion à votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Système de gestion de présence intelligente
        </p>
      </div>

      <div
        className={`mt-8 sm:mx-auto sm:w-full sm:max-w-md transition-all duration-700 delay-300 ${
          showWelcome ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Mot de passe oublié?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 transform hover:translate-y-[-1px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Identifiants de démonstration
                </span>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>Nom d'utilisateur: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">admin</span></p>
              <p>Mot de passe: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">Admin123!</span></p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link to="/" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            &larr; Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
