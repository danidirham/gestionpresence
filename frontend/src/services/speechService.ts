/**
 * Service pour la synthèse vocale
 * Ce service utilise l'API Web Speech pour convertir du texte en parole
 */

/**
 * Options pour la synthèse vocale
 */
export interface SpeechOptions {
  lang?: string;       // Langue (fr-FR, en-US, etc.)
  volume?: number;     // Volume (0 à 1)
  rate?: number;       // Vitesse (0.1 à 10)
  pitch?: number;      // Tonalité (0 à 2)
  voice?: SpeechSynthesisVoice; // Voix spécifique à utiliser
}

/**
 * Vérifie si la synthèse vocale est disponible dans le navigateur
 * @returns true si la synthèse vocale est disponible, false sinon
 */
export const isSpeechSynthesisAvailable = (): boolean => {
  return 'speechSynthesis' in window;
};

/**
 * Récupère la liste des voix disponibles
 * @returns Liste des voix disponibles
 */
export const getVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSynthesisAvailable()) {
    console.warn('La synthèse vocale n\'est pas disponible dans ce navigateur');
    return [];
  }
  
  return window.speechSynthesis.getVoices();
};

/**
 * Récupère une voix française si disponible, sinon la voix par défaut
 * @returns Voix française ou voix par défaut
 */
export const getFrenchVoice = (): SpeechSynthesisVoice | undefined => {
  const voices = getVoices();
  
  // Chercher une voix française
  const frenchVoice = voices.find(voice => 
    voice.lang.includes('fr') && voice.localService
  );
  
  // Si aucune voix française n'est trouvée, chercher une voix française non locale
  if (!frenchVoice) {
    return voices.find(voice => voice.lang.includes('fr'));
  }
  
  return frenchVoice;
};

/**
 * Parle un texte avec la synthèse vocale
 * @param text Texte à prononcer
 * @param options Options de synthèse vocale
 * @returns Promise qui se résout lorsque la parole est terminée
 */
export const speak = (text: string, options: SpeechOptions = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisAvailable()) {
      console.warn('La synthèse vocale n\'est pas disponible dans ce navigateur');
      reject(new Error('La synthèse vocale n\'est pas disponible'));
      return;
    }
    
    // Arrêter toute synthèse vocale en cours
    window.speechSynthesis.cancel();
    
    // Créer un nouvel objet d'énoncé
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Appliquer les options
    utterance.lang = options.lang || 'fr-FR';
    utterance.volume = options.volume !== undefined ? options.volume : 1;
    utterance.rate = options.rate !== undefined ? options.rate : 1;
    utterance.pitch = options.pitch !== undefined ? options.pitch : 1;
    
    // Utiliser la voix spécifiée ou trouver une voix française
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      const frenchVoice = getFrenchVoice();
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
    }
    
    // Événements
    utterance.onend = () => {
      resolve();
    };
    
    utterance.onerror = (event) => {
      reject(new Error(`Erreur de synthèse vocale: ${event.error}`));
    };
    
    // Démarrer la synthèse vocale
    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Génère un message de bienvenue personnalisé pour l'arrivée d'un étudiant
 * @param studentName Nom de l'étudiant
 * @returns Message de bienvenue
 */
export const generateWelcomeMessage = (studentName: string): string => {
  const greetings = [
    `Bonjour ${studentName}, bienvenue en cours.`,
    `Bonjour ${studentName}, ravi de vous voir aujourd'hui.`,
    `Bienvenue ${studentName}, bon cours à vous.`,
    `Bonjour ${studentName}, votre présence a été enregistrée.`
  ];
  
  // Choisir un message aléatoire
  return greetings[Math.floor(Math.random() * greetings.length)];
};

/**
 * Génère un message personnalisé pour le départ d'un étudiant
 * @param studentName Nom de l'étudiant
 * @returns Message de départ
 */
export const generateGoodbyeMessage = (studentName: string): string => {
  const goodbyes = [
    `Au revoir ${studentName}, à bientôt.`,
    `Au revoir ${studentName}, bonne journée.`,
    `Merci pour votre participation ${studentName}, à la prochaine.`,
    `Votre départ a été enregistré ${studentName}, à bientôt.`
  ];
  
  // Choisir un message aléatoire
  return goodbyes[Math.floor(Math.random() * goodbyes.length)];
};
