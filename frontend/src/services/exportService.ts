import { getApiUrl } from './apiService';

/**
 * Types d'exportation disponibles
 */
export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

/**
 * Service pour l'exportation des données
 */
export const ExportService = {
  /**
   * Exporte le nombre de présences par jour dans une période donnée
   * @param startDate Date de début (format YYYY-MM-DD)
   * @param endDate Date de fin (format YYYY-MM-DD)
   * @param classeId ID de la classe (optionnel)
   * @param format Format d'exportation (xlsx, csv, pdf)
   */
  exportPresenceCountByDate: (
    startDate?: string,
    endDate?: string,
    classeId?: number,
    format: ExportFormat = 'xlsx'
  ): void => {
    let url = `${getApiUrl()}/export/presences/jour/?format=${format}`;
    
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    if (classeId) url += `&classe_id=${classeId}`;
    
    // Ouvrir l'URL dans un nouvel onglet pour télécharger le fichier
    window.open(url, '_blank');
  },
  
  /**
   * Exporte le nombre de présences par classe dans une période donnée
   * @param startDate Date de début (format YYYY-MM-DD)
   * @param endDate Date de fin (format YYYY-MM-DD)
   * @param format Format d'exportation (xlsx, csv, pdf)
   */
  exportPresenceCountByClass: (
    startDate?: string,
    endDate?: string,
    format: ExportFormat = 'xlsx'
  ): void => {
    let url = `${getApiUrl()}/export/presences/classe/?format=${format}`;
    
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    
    // Ouvrir l'URL dans un nouvel onglet pour télécharger le fichier
    window.open(url, '_blank');
  },
  
  /**
   * Exporte le taux de présence par étudiant dans une période donnée
   * @param startDate Date de début (format YYYY-MM-DD)
   * @param endDate Date de fin (format YYYY-MM-DD)
   * @param classeId ID de la classe (optionnel)
   * @param format Format d'exportation (xlsx, csv, pdf)
   */
  exportAttendanceRateByStudent: (
    startDate?: string,
    endDate?: string,
    classeId?: number,
    format: ExportFormat = 'xlsx'
  ): void => {
    let url = `${getApiUrl()}/export/assiduite/etudiants/?format=${format}`;
    
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    if (classeId) url += `&classe_id=${classeId}`;
    
    // Ouvrir l'URL dans un nouvel onglet pour télécharger le fichier
    window.open(url, '_blank');
  },
  
  /**
   * Exporte les alertes d'absence
   * @param threshold Seuil de présence (en pourcentage)
   * @param days Nombre de jours à considérer
   * @param format Format d'exportation (xlsx, csv, pdf)
   */
  exportAbsenceAlerts: (
    threshold: number = 70,
    days: number = 30,
    format: ExportFormat = 'xlsx'
  ): void => {
    const url = `${getApiUrl()}/export/alertes/absences/?threshold=${threshold}&days=${days}&format=${format}`;
    
    // Ouvrir l'URL dans un nouvel onglet pour télécharger le fichier
    window.open(url, '_blank');
  }
};
