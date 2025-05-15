import { get } from './apiService';

// Types pour les statistiques
export interface PresenceByDate {
  day: string;
  count: number;
}

export interface PresenceByClass {
  classe_nom: string;
  count: number;
}

export interface StudentAttendance {
  etudiant_id: number;
  etudiant_nom: string;
  etudiant_prenom: string;
  classe_nom: string | null;
  presence_count: number;
  working_days: number;
  attendance_rate: number;
}

export interface AbsenceAlert extends StudentAttendance {}

export interface ClassPresence {
  classe_nom: string;
  count: number;
}

export interface TodayPresenceSummary {
  date: string;
  total_students: number;
  present_students: number;
  absent_students: number;
  attendance_rate: number;
  class_presence: ClassPresence[];
}

/**
 * Récupère le nombre de présences par jour dans une période donnée
 * @param startDate Date de début (format YYYY-MM-DD)
 * @param endDate Date de fin (format YYYY-MM-DD)
 * @param classeId ID de la classe (optionnel)
 * @returns Liste des présences par jour
 */
export const getPresenceCountByDate = async (
  startDate?: string,
  endDate?: string,
  classeId?: number
): Promise<PresenceByDate[]> => {
  let url = '/statistiques/presences/jour/';
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (classeId) params.append('classe_id', classeId.toString());
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return await get<PresenceByDate[]>(url);
};

/**
 * Récupère le nombre de présences par classe dans une période donnée
 * @param startDate Date de début (format YYYY-MM-DD)
 * @param endDate Date de fin (format YYYY-MM-DD)
 * @returns Liste des présences par classe
 */
export const getPresenceCountByClass = async (
  startDate?: string,
  endDate?: string
): Promise<PresenceByClass[]> => {
  let url = '/statistiques/presences/classe/';
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return await get<PresenceByClass[]>(url);
};

/**
 * Calcule le taux de présence par étudiant dans une période donnée
 * @param startDate Date de début (format YYYY-MM-DD)
 * @param endDate Date de fin (format YYYY-MM-DD)
 * @param classeId ID de la classe (optionnel)
 * @returns Liste des taux de présence par étudiant
 */
export const getAttendanceRateByStudent = async (
  startDate?: string,
  endDate?: string,
  classeId?: number
): Promise<StudentAttendance[]> => {
  let url = '/statistiques/assiduite/etudiants/';
  const params = new URLSearchParams();
  
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (classeId) params.append('classe_id', classeId.toString());
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return await get<StudentAttendance[]>(url);
};

/**
 * Identifie les étudiants dont le taux de présence est inférieur au seuil donné
 * @param threshold Seuil de présence (en pourcentage)
 * @param days Nombre de jours à considérer
 * @returns Liste des étudiants avec un taux de présence inférieur au seuil
 */
export const getAbsenceAlerts = async (
  threshold: number = 70,
  days: number = 30
): Promise<AbsenceAlert[]> => {
  const url = `/statistiques/alertes/absences/?threshold=${threshold}&days=${days}`;
  return await get<AbsenceAlert[]>(url);
};

/**
 * Récupère un résumé des présences du jour
 * @returns Résumé des présences du jour
 */
export const getTodayPresenceSummary = async (): Promise<TodayPresenceSummary> => {
  return await get<TodayPresenceSummary>('/statistiques/presences/aujourd-hui/');
};
