/**
 * Utilitaires pour l'authentification
 */

/**
 * Vérifie si l'utilisateur est en mode démo
 * @returns false - Nous n'utilisons plus le mode démo
 */
export const isDemoMode = (): boolean => {
  return false;
};

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns true si l'utilisateur est authentifié, false sinon
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Décode un token JWT
 * @param token Le token JWT à décoder
 * @returns Le contenu décodé du token ou null si invalide
 */
export const decodeToken = (token: string): any => {
  try {
    // Diviser le token en ses parties (header, payload, signature)
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Décoder la partie payload (deuxième partie)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erreur lors du décodage du token:', error);
    return null;
  }
};

/**
 * Vérifie si le token est expiré
 * @returns true si le token est expiré ou invalide, false sinon
 */
export const isTokenExpired = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  // La date d'expiration est en secondes, convertir en millisecondes
  const expirationDate = new Date(decoded.exp * 1000);
  const currentDate = new Date();

  // Considérer le token comme expiré 30 secondes avant sa date réelle d'expiration
  // pour éviter les problèmes de synchronisation
  return expirationDate.getTime() - currentDate.getTime() < 30000;
};

/**
 * Récupère les informations de l'utilisateur
 * @returns les informations de l'utilisateur ou null si non authentifié
 */
export const getUserInfo = () => {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    return null;
  }
};

/**
 * Redirige l'utilisateur vers la page de connexion
 * @param message Message d'erreur à afficher (optionnel)
 */
export const redirectToLogin = (message?: string) => {
  // Supprimer les informations d'authentification
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Stocker le message d'erreur pour l'afficher sur la page de connexion
  if (message) {
    sessionStorage.setItem('auth_error', message);
  }

  // Rediriger vers la page de connexion
  window.location.href = '/login';
};
