/**
 * Service central pour les appels API
 * Ce service gère les appels API vers le backend Django
 */

import { isDemoMode, isTokenExpired, redirectToLogin } from '../utils/authUtils';

// URL de base de l'API
// Utiliser l'URL directe du serveur backend
const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Fonction pour obtenir l'URL de base de l'API
 */
export const getApiUrl = (): string => {
  return API_URL;
};

// Types pour l'authentification
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
}

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Fonction pour obtenir les headers d'authentification
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Fonction pour gérer les erreurs des appels API
 */
const handleApiError = async (response: Response): Promise<ApiError> => {
  let errorMessage = 'Une erreur est survenue';
  let status = response.status;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Réponse d\'erreur API:', data);

      // Gestion des différents formats d'erreur possibles
      if (data.detail) {
        errorMessage = data.detail;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (typeof data === 'string') {
        errorMessage = data;
      } else if (Object.keys(data).length > 0) {
        // Si l'erreur est un objet avec des champs (validation d'erreurs)
        const errors = Object.entries(data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        errorMessage = `Erreurs de validation: ${errors}`;
      }
    } else {
      // Si la réponse n'est pas du JSON, essayer de lire le texte
      const text = await response.text();
      console.log('Réponse d\'erreur API (texte):', text);
      if (text) {
        errorMessage = `Erreur ${status}: ${text}`;
      } else {
        errorMessage = `Erreur ${status}: ${response.statusText}`;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la lecture de la réponse:', error);
  }

  return { message: errorMessage, status };
};

/**
 * Fonction pour se connecter à l'application
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await handleApiError(response);
      throw new Error(error.message);
    }

    const data = await response.json();

    // Stocker le token dans le localStorage
    localStorage.setItem('token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
};

/**
 * Fonction pour se déconnecter de l'application
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

/**
 * Fonction pour rafraîchir le token d'authentification
 */
export const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken })
    });

    if (!response.ok) {
      // Si le refresh token est invalide, déconnecter l'utilisateur
      logout();
      return false;
    }

    const data = await response.json();

    // Mettre à jour le token d'accès dans le localStorage
    localStorage.setItem('token', data.access);
    return true;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return false;
  }
};

/**
 * Fonction pour gérer les réponses 401 (Unauthorized)
 */
const handleUnauthorized = async (endpoint: string, options: RequestInit): Promise<Response> => {
  // Tenter de rafraîchir le token
  const refreshed = await refreshToken();

  if (!refreshed) {
    // Si le rafraîchissement échoue, rediriger vers la page de connexion
    redirectToLogin('Session expirée. Veuillez vous reconnecter.');
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  // Réessayer la requête avec le nouveau token
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: getAuthHeaders()
  });
};

/**
 * Fonction générique pour effectuer un appel GET
 */
export const get = async <T>(endpoint: string): Promise<T> => {
  try {
    // Vérifier si le token est expiré avant de faire la requête
    if (isTokenExpired()) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        redirectToLogin('Session expirée. Veuillez vous reconnecter.');
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }

    let response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    // Si la réponse est 401, tenter de rafraîchir le token
    if (response.status === 401) {
      response = await handleUnauthorized(endpoint, { method: 'GET' });
    }

    if (!response.ok) {
      const error = await handleApiError(response);
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la récupération des données (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Fonction générique pour effectuer un appel POST
 */
export const post = async <T>(endpoint: string, data: any): Promise<T> => {
  try {
    console.log(`Envoi de données POST vers ${endpoint}:`, data);

    // Vérifier si le token est expiré avant de faire la requête
    if (isTokenExpired() && endpoint !== '/auth/token/' && endpoint !== '/auth/token/refresh/') {
      const refreshed = await refreshToken();
      if (!refreshed) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }

    // Préparer les options de la requête
    const headers = getAuthHeaders();
    console.log('Headers de la requête:', headers);

    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    };

    // Effectuer la requête
    console.log(`Envoi de la requête à ${API_URL}${endpoint}`);
    let response = await fetch(`${API_URL}${endpoint}`, options);
    console.log(`Réponse reçue: status ${response.status} ${response.statusText}`);

    // Si la réponse est 401, tenter de rafraîchir le token
    if (response.status === 401) {
      console.log('Tentative de rafraîchissement du token...');
      response = await handleUnauthorized(endpoint, options);
      console.log(`Nouvelle réponse après rafraîchissement: status ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      console.error(`Erreur API (${response.status}): ${response.statusText}`);
      const error = await handleApiError(response);
      throw new Error(error.message);
    }

    // Traiter la réponse
    const responseData = await response.json();
    console.log(`Données reçues de ${endpoint}:`, responseData);
    return responseData;
  } catch (error) {
    console.error(`Erreur lors de l'envoi des données (${endpoint}):`, error);

    // Améliorer le message d'erreur
    if (error instanceof Error) {
      // Si c'est une erreur réseau (fetch a échoué)
      if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
        throw new Error(`Erreur de connexion au serveur. Vérifiez que le backend est en cours d'exécution à ${API_URL}.`);
      }
      // Sinon, propager l'erreur telle quelle
      throw error;
    }

    // Si ce n'est pas une instance d'Error, créer une nouvelle erreur
    throw new Error('Une erreur inconnue est survenue lors de la communication avec le serveur.');
  }
};

/**
 * Fonction générique pour effectuer un appel PUT
 */
export const put = async <T>(endpoint: string, data: any): Promise<T> => {
  try {
    // Vérifier si le token est expiré avant de faire la requête
    if (isTokenExpired()) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }

    const options = {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    };

    let response = await fetch(`${API_URL}${endpoint}`, options);

    // Si la réponse est 401, tenter de rafraîchir le token
    if (response.status === 401) {
      response = await handleUnauthorized(endpoint, options);
    }

    if (!response.ok) {
      const error = await handleApiError(response);
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la mise à jour des données (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Fonction générique pour effectuer un appel PATCH
 */
export const patch = async <T>(endpoint: string, data: any): Promise<T> => {
  try {
    // Vérifier si le token est expiré avant de faire la requête
    if (isTokenExpired()) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }

    const options = {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    };

    let response = await fetch(`${API_URL}${endpoint}`, options);

    // Si la réponse est 401, tenter de rafraîchir le token
    if (response.status === 401) {
      response = await handleUnauthorized(endpoint, options);
    }

    if (!response.ok) {
      const error = await handleApiError(response);
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la mise à jour partielle des données (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Fonction générique pour effectuer un appel DELETE
 */
export const del = async (endpoint: string): Promise<void> => {
  try {
    // Vérifier si le token est expiré avant de faire la requête
    if (isTokenExpired()) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }

    const options = {
      method: 'DELETE',
      headers: getAuthHeaders()
    };

    let response = await fetch(`${API_URL}${endpoint}`, options);

    // Si la réponse est 401, tenter de rafraîchir le token
    if (response.status === 401) {
      response = await handleUnauthorized(endpoint, options);
    }

    if (!response.ok) {
      const error = await handleApiError(response);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression des données (${endpoint}):`, error);
    throw error;
  }
};
