/**
 * Service pour la gestion des étudiants
 * Ce service gère les appels API liés aux étudiants
 */

import { get, post, put, del } from './apiService';

// Types pour les étudiants
export interface Student {
  id?: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: string;
  adresse?: string;
  contact_parent?: string;
  photo?: string;
  donnees_biometriques?: string;
  statut: string;
  classe: number;
  classe_nom?: string;
  // Propriété temporaire pour stocker la photo en base64 pendant le processus de création
  _photoData?: string;
}

export interface Parent {
  id?: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  relation: string;
  notifications_sms: boolean;
  notifications_email: boolean;
  etudiant: number;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: string;
  description?: string;
  annee_scolaire: string;
}

/**
 * Fonction pour récupérer la liste des étudiants
 */
export const fetchStudents = async (): Promise<Student[]> => {
  return await get<Student[]>('/etudiants/');
};

/**
 * Fonction pour récupérer un étudiant par son ID
 */
export const fetchStudentById = async (id: number): Promise<Student> => {
  return await get<Student>(`/etudiants/${id}/`);
};

/**
 * Fonction pour récupérer les parents d'un étudiant
 */
export const fetchStudentParents = async (studentId: number): Promise<Parent[]> => {
  return await get<Parent[]>(`/etudiants/${studentId}/parents/`);
};

/**
 * Fonction pour créer un nouvel étudiant
 */
export const createStudent = async (student: Student): Promise<Student> => {
  try {
    // Créer une copie des données pour éviter de modifier l'original
    const studentData = { ...student };

    // Toujours vérifier et traiter la photo séparément pour éviter les erreurs de validation
    let photoData = null;

    // Vérifier si la photo est une chaîne base64 (longue chaîne de caractères)
    if (studentData.photo && typeof studentData.photo === 'string') {
      // Si c'est une URL ou une référence courte, la laisser telle quelle
      if (studentData.photo.length > 1000 || studentData.photo.startsWith('data:image')) {
        console.log('Photo base64 détectée dans les données de création. Taille:', studentData.photo.length);

        // Sauvegarder la photo pour l'utiliser plus tard
        photoData = studentData.photo;

        // IMPORTANT: Toujours supprimer la photo des données pour la création initiale
        delete studentData.photo;
        console.log('Photo retirée des données de création pour éviter les erreurs de validation');
      } else {
        console.log('Photo non-base64 détectée, conservation dans les données');
      }
    }

    console.log('Données d\'étudiant à envoyer:', studentData);
    const createdStudent = await post<Student>('/etudiants/', studentData);

    // Stocker la photo originale dans l'objet retourné pour pouvoir l'utiliser plus tard
    if (photoData && createdStudent.id) {
      createdStudent._photoData = photoData;
    }

    return createdStudent;
  } catch (error) {
    console.error('Erreur dans createStudent:', error);

    // Améliorer le message d'erreur pour aider au débogage
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes('photo') || errorMessage.includes('image')) {
        console.error('Erreur liée à la photo. Assurez-vous que la photo a été correctement retirée des données.');
      }
    }

    throw error;
  }
};

/**
 * Fonction pour mettre à jour un étudiant
 */
export const updateStudent = async (id: number, student: Student): Promise<Student> => {
  try {
    // Créer une copie des données pour éviter de modifier l'original
    const studentData = { ...student };

    // Toujours vérifier et traiter la photo séparément pour éviter les erreurs de validation
    let photoData = null;

    // Vérifier si la photo est une chaîne base64 (longue chaîne de caractères)
    if (studentData.photo && typeof studentData.photo === 'string') {
      // Si c'est une URL ou une référence courte, la laisser telle quelle
      if (studentData.photo.length > 1000 || studentData.photo.startsWith('data:image')) {
        console.log('Photo base64 détectée dans les données de mise à jour');

        // Sauvegarder la photo pour l'utiliser plus tard
        photoData = studentData.photo;

        // IMPORTANT: Toujours supprimer la photo des données pour la mise à jour initiale
        delete studentData.photo;
        console.log('Photo retirée des données de mise à jour pour éviter les erreurs de validation');
      } else {
        console.log('Photo non-base64 détectée, conservation dans les données');
      }
    }

    console.log('Données d\'étudiant à mettre à jour:', studentData);
    const updatedStudent = await put<Student>(`/etudiants/${id}/`, studentData);

    // Si nous avons une photo base64, l'enregistrer séparément via l'endpoint register_face
    if (photoData && updatedStudent.id) {
      try {
        console.log('Enregistrement séparé de la photo après mise à jour de l\'étudiant');
        const photoResponse = await registerStudentFace(updatedStudent.id, photoData);
        console.log('Photo enregistrée avec succès après mise à jour:', photoResponse);

        // Mettre à jour l'objet étudiant avec l'information que la photo a été enregistrée
        updatedStudent.photo = 'photo_enregistree';
      } catch (photoError) {
        console.error('Erreur lors de l\'enregistrement de la photo après mise à jour:', photoError);
        // Ne pas faire échouer la mise à jour complète si seule la photo échoue
      }
    }

    return updatedStudent;
  } catch (error) {
    console.error('Erreur dans updateStudent:', error);

    // Améliorer le message d'erreur pour aider au débogage
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes('photo') || errorMessage.includes('image')) {
        console.error('Erreur liée à la photo. Assurez-vous que la photo a été correctement retirée des données.');
      }
    }

    throw error;
  }
};

/**
 * Fonction pour supprimer un étudiant
 */
export const deleteStudent = async (id: number): Promise<void> => {
  return await del(`/etudiants/${id}/`);
};

/**
 * Fonction pour enregistrer le visage d'un étudiant
 */
export const registerStudentFace = async (id: number, imageData: string): Promise<any> => {
  try {
    console.log(`Envoi de la photo pour l'étudiant ${id}, taille: ${imageData.length} caractères`);

    // S'assurer que l'image est au format base64 avec le préfixe correct
    let formattedImageData = imageData;
    if (!imageData.startsWith('data:image')) {
      formattedImageData = `data:image/jpeg;base64,${imageData}`;
      console.log('Préfixe ajouté à l\'image base64');
    }

    // Extraire le type MIME et les données base64
    const matches = formattedImageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      throw new Error('Format d\'image base64 invalide');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    console.log(`Type MIME détecté: ${mimeType}`);

    // Envoyer l'image au serveur
    const response = await post<any>(`/etudiants/${id}/register_face/`, {
      image: formattedImageData,
      mime_type: mimeType,
      base64_data: base64Data,
      student_id: id,
      update_photo: true  // Indiquer explicitement qu'on veut mettre à jour la photo
    });

    console.log('Réponse du serveur pour l\'enregistrement du visage:', response);
    return response;
  } catch (error) {
    console.error('Erreur dans registerStudentFace:', error);
    throw error;
  }
};

/**
 * Fonction pour récupérer la liste des classes
 */
export const fetchClasses = async (): Promise<Classe[]> => {
  return await get<Classe[]>('/classes/');
};

/**
 * Fonction pour récupérer une classe par son ID
 */
export const fetchClassById = async (id: number): Promise<Classe> => {
  return await get<Classe>(`/classes/${id}/`);
};

/**
 * Fonction pour récupérer les étudiants d'une classe
 */
export const fetchStudentsByClass = async (classId: number): Promise<Student[]> => {
  return await get<Student[]>(`/classes/${classId}/etudiants/`);
};

/**
 * Fonction pour créer un parent
 */
export const createParent = async (parent: Parent): Promise<Parent> => {
  return await post<Parent>('/parents/', parent);
};

/**
 * Fonction pour mettre à jour un parent
 */
export const updateParent = async (id: number, parent: Parent): Promise<Parent> => {
  return await put<Parent>(`/parents/${id}/`, parent);
};

/**
 * Fonction pour supprimer un parent
 */
export const deleteParent = async (id: number): Promise<void> => {
  return await del(`/parents/${id}/`);
};
