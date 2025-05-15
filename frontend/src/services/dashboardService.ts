/**
 * Service pour la gestion des données du tableau de bord
 * Ce service gère les appels API liés au tableau de bord
 */

import { get } from './apiService';
import { Student } from './studentService';
import { isDemoMode } from '../utils/authUtils';

// Types
export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  weeklyChange: number;
}

export interface AttendanceByClass {
  name: string;
  value: number;
  color: string;
}

export interface AttendanceByDay {
  day: string;
  present: number;
  absent: number;
}

export interface RecentAttendance {
  id: number;
  name: string;
  class: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
  avatar?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  attendanceByClass: AttendanceByClass[];
  attendanceByDay: AttendanceByDay[];
  recentAttendance: RecentAttendance[];
}

// Couleurs pour les classes
const classColors = [
  '#4ade80', // vert
  '#60a5fa', // bleu
  '#f59e0b', // orange
  '#8b5cf6', // violet
  '#ec4899', // rose
  '#10b981', // vert foncé
  '#3b82f6', // bleu clair
  '#ef4444', // rouge
  '#a855f7', // violet clair
  '#14b8a6', // turquoise
];

// Importer les services de statistiques
import {
  getTodayPresenceSummary,
  getPresenceCountByDate,
  getPresenceCountByClass,
  getAbsenceAlerts
} from './statisticsService';

/**
 * Fonction pour récupérer les données du tableau de bord
 */
export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    // Récupérer les données depuis les nouvelles API de statistiques
    const todaySummary = await getTodayPresenceSummary();

    // Récupérer les présences de la semaine
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);

    const startDate = oneWeekAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const weeklyPresences = await getPresenceCountByDate(startDate, endDate);
    const classePresences = await getPresenceCountByClass(startDate, endDate);

    // Récupérer les présences récentes
    // Utiliser l'API standard des présences et limiter les résultats côté client
    const allPresences = await get<any[]>('/presences/');
    // Trier par date et heure (les plus récentes d'abord)
    const sortedPresences = allPresences.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.heure_arrivee || '00:00:00'}`);
      const dateB = new Date(`${b.date}T${b.heure_arrivee || '00:00:00'}`);
      return dateB.getTime() - dateA.getTime();
    });
    // Prendre les 10 premières
    const recentPresences = sortedPresences.slice(0, 10);

    // Calculer la variation hebdomadaire
    const weeklyChange = calculateWeeklyChange(weeklyPresences);

    // Formater les données pour les graphiques
    const attendanceByClass = classePresences.map((classe, index) => {
      return {
        name: classe.classe_nom,
        value: todaySummary.total_students > 0
          ? Math.round((classe.count / todaySummary.total_students) * 100)
          : 0,
        color: classColors[index % classColors.length]
      };
    });

    // Formater les données pour le graphique par jour
    const attendanceByDay = formatAttendanceByDay(weeklyPresences);

    // Formater les présences récentes
    const recentAttendance = recentPresences.map(presence => {
      // Vérifier si les données de l'étudiant sont disponibles
      const hasStudentData = presence.etudiant_nom && presence.etudiant_prenom;

      // Construire le nom complet de l'étudiant
      const studentName = hasStudentData
        ? `${presence.etudiant_prenom} ${presence.etudiant_nom}`
        : 'Inconnu';

      // Formater la date et l'heure
      const formattedTimestamp = presence.heure_arrivee
        ? `${presence.date} ${presence.heure_arrivee}`
        : presence.date;

      // Convertir le statut pour l'affichage
      let status: 'present' | 'absent' | 'late' = 'present';
      if (presence.statut === 'absent') status = 'absent';
      if (presence.statut === 'retard') status = 'late';

      return {
        id: presence.id,
        name: studentName,
        class: presence.classe_nom || 'Inconnue',
        timestamp: formattedTimestamp,
        status: status,
        avatar: presence.etudiant_photo || null
      };
    });

    return {
      stats: {
        totalStudents: todaySummary.total_students,
        presentToday: todaySummary.present_students,
        absentToday: todaySummary.absent_students,
        attendanceRate: todaySummary.attendance_rate,
        weeklyChange
      },
      attendanceByClass,
      attendanceByDay,
      recentAttendance
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    throw error;
  }
};

/**
 * Calcule la variation hebdomadaire du taux de présence
 */
const calculateWeeklyChange = (weeklyPresences: any[]): number => {
  if (weeklyPresences.length < 2) {
    return 0;
  }

  // Calculer la moyenne des 3 premiers jours et des 3 derniers jours
  const firstDays = weeklyPresences.slice(0, 3);
  const lastDays = weeklyPresences.slice(-3);

  const firstAvg = firstDays.reduce((sum, day) => sum + day.count, 0) / firstDays.length;
  const lastAvg = lastDays.reduce((sum, day) => sum + day.count, 0) / lastDays.length;

  // Calculer la variation en pourcentage
  if (firstAvg === 0) return 0;

  const change = ((lastAvg - firstAvg) / firstAvg) * 100;
  return Math.round(change * 10) / 10; // Arrondir à 1 décimale
};

/**
 * Formate les données de présence par jour pour le graphique
 * Exporté pour permettre le rafraîchissement des données
 */
export const formatAttendanceByDay = (weeklyPresences: any[]): AttendanceByDay[] => {
  // Créer un tableau pour les 5 derniers jours ouvrables
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
  const result: AttendanceByDay[] = [];

  // Initialiser le tableau avec tous les jours de la semaine
  for (const day of days) {
    result.push({ day, present: 0, absent: 0 });
  }

  // Récupérer le nombre total d'étudiants pour calculer les absences
  let totalStudents = 0;

  // Essayer de récupérer le nombre total d'étudiants à partir des données
  try {
    // Utiliser la première entrée qui a un total_students
    const entryWithTotal = weeklyPresences.find(p => p.total_students !== undefined);
    if (entryWithTotal) {
      totalStudents = entryWithTotal.total_students;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre total d\'étudiants:', error);
    // Utiliser une valeur par défaut si nécessaire
    totalStudents = 0;
  }

  // Parcourir les présences et les regrouper par jour
  for (const presence of weeklyPresences) {
    if (!presence.day) continue;

    const date = new Date(presence.day);
    const dayOfWeek = date.getDay(); // 0 = dimanche, 1 = lundi, etc.

    // Ignorer les weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dayName = days[dayOfWeek - 1]; // -1 car les jours commencent à 1 (lundi)

    // Trouver le jour dans le résultat
    const dayEntry = result.find(d => d.day === dayName);
    if (dayEntry) {
      // Mettre à jour le nombre de présents
      dayEntry.present = presence.count || 0;

      // Calculer le nombre d'absents si le nombre total d'étudiants est disponible
      if (totalStudents > 0) {
        dayEntry.absent = Math.max(0, totalStudents - dayEntry.present);
      } else if (presence.absent_count !== undefined) {
        // Si les données d'absence sont disponibles directement
        dayEntry.absent = presence.absent_count;
      }
    }
  }

  // Trier les jours dans l'ordre de la semaine
  result.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));

  return result;
};


