/**
 * Service pour la reconnaissance faciale
 * Ce service gère les appels API liés à la reconnaissance faciale
 */

import { get, post } from './apiService';
import { Student } from './studentService';

// Types pour la reconnaissance faciale
export interface RecognitionResult {
  recognized: boolean;
  student?: Student;
  confidence?: number;
  message: string;
  already_present?: boolean;
  presence_time?: string;
  timestamp?: string;
  mode?: 'arrivee' | 'depart';  // Mode de pointage (arrivée ou départ)
}

export interface PresenceRecord {
  id: number;
  etudiant: number;
  date: string;
  heure_arrivee: string;
  heure_depart?: string;
  statut: 'present' | 'absent' | 'retard' | 'excusé';
  notification_envoyee: boolean;
  commentaire?: string;
  created_at: string;
  updated_at: string;
  etudiant_nom?: string;
  etudiant_prenom?: string;
  etudiant_photo?: string;
  classe_nom?: string;
}

/**
 * Fonction pour reconnaître un visage
 * @param imageData Image en base64
 * @param mode Mode de pointage ('arrivee' ou 'depart')
 * @returns Résultat de la reconnaissance
 */
export const recognizeFace = async (
  imageData: string,
  mode: 'arrivee' | 'depart' = 'arrivee'
): Promise<RecognitionResult> => {
  try {
    // S'assurer que l'image est au format base64 avec le préfixe correct
    let formattedImageData = imageData;
    if (!imageData.startsWith('data:image')) {
      formattedImageData = `data:image/jpeg;base64,${imageData}`;
    }

    // Envoyer l'image au serveur pour reconnaissance
    const result = await post<RecognitionResult>('/reconnaissance/face/', {
      image: formattedImageData,
      mode: mode
    });

    // Ajouter un timestamp
    result.timestamp = new Date().toLocaleTimeString('fr-FR');

    // S'assurer que le mode est défini dans le résultat
    if (!result.mode) {
      result.mode = mode;
    }

    return result;
  } catch (error) {
    console.error('Erreur lors de la reconnaissance faciale:', error);
    throw error;
  }
};

/**
 * Fonction pour enregistrer une présence manuellement
 * @param studentId ID de l'étudiant
 * @param status Statut de présence (present, absent, retard, excusé)
 * @returns Résultat de l'enregistrement
 */
export const registerAttendance = async (
  studentId: number,
  status: 'present' | 'absent' | 'retard' | 'excusé' = 'present'
): Promise<any> => {
  return await post('/presences/register/', {
    student_id: studentId,
    status
  });
};

/**
 * Fonction pour récupérer l'historique des présences récentes
 * @param limit Nombre de résultats à récupérer
 * @returns Liste des présences récentes
 */
export const fetchRecentPresences = async (limit: number = 10): Promise<PresenceRecord[]> => {
  try {
    // Récupérer les présences depuis l'API en utilisant l'endpoint today qui fonctionne
    const presences = await get<PresenceRecord[]>('/presences/today/');

    // Ajouter des logs pour déboguer
    console.log('Présences récupérées:', presences);

    // Vérifier si presences est un tableau
    if (!Array.isArray(presences)) {
      console.error('Les données reçues ne sont pas un tableau:', presences);
      return [];
    }

    // Trier par date et heure d'arrivée (les plus récentes d'abord)
    const sortedPresences = presences.sort((a, b) => {
      // Vérifier si les propriétés nécessaires existent
      if (!a.heure_arrivee || !b.heure_arrivee) {
        return 0;
      }

      try {
        const dateA = new Date(`${a.date}T${a.heure_arrivee}`);
        const dateB = new Date(`${b.date}T${b.heure_arrivee}`);
        return dateB.getTime() - dateA.getTime();
      } catch (err) {
        console.error('Erreur lors du tri des présences:', err);
        return 0;
      }
    });

    // Limiter le nombre de résultats
    return sortedPresences.slice(0, limit);
  } catch (error) {
    console.error('Erreur lors de la récupération des présences récentes:', error);
    // Retourner un tableau vide au lieu de propager l'erreur
    return [];
  }
};

/**
 * Fonction pour récupérer les présences d'aujourd'hui
 * @returns Liste des présences d'aujourd'hui
 */
export const fetchTodayPresences = async (): Promise<PresenceRecord[]> => {
  try {
    // Récupérer les présences depuis l'API
    const presences = await get<PresenceRecord[]>('/presences/today/');
    return presences;
  } catch (error) {
    console.error('Erreur lors de la récupération des présences d\'aujourd\'hui:', error);
    throw error;
  }
};
