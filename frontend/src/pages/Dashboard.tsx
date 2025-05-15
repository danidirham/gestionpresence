import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Percent, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Composants
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import AttendanceByClassChart from '../components/dashboard/AttendanceByClassChart';
import AttendanceByDayChart from '../components/dashboard/AttendanceByDayChart';
import RecentAttendanceTable from '../components/dashboard/RecentAttendanceTable';

// Services
import {
  fetchDashboardData,
  DashboardData,
  formatAttendanceByDay
} from '../services/dashboardService';
import { ExportService, ExportFormat } from '../services/exportService';
import { getPresenceCountByDate } from '../services/statisticsService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshingAttendanceByDay, setRefreshingAttendanceByDay] = useState(false);

  // Fonctions d'exportation
  const exportPresencesByClass = (format: ExportFormat) => {
    try {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);

      const startDate = oneMonthAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      ExportService.exportPresenceCountByClass(startDate, endDate, format);
      toast.success(`Exportation des présences par classe en ${format.toUpperCase()} démarrée`);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Erreur lors de l\'exportation');
    }
  };

  const exportPresencesByDay = (format: ExportFormat) => {
    try {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);

      const startDate = oneMonthAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      ExportService.exportPresenceCountByDate(startDate, endDate, undefined, format);
      toast.success(`Exportation des présences par jour en ${format.toUpperCase()} démarrée`);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Erreur lors de l\'exportation');
    }
  };

  const exportAttendanceRates = (format: ExportFormat) => {
    try {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);

      const startDate = oneMonthAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      ExportService.exportAttendanceRateByStudent(startDate, endDate, undefined, format);
      toast.success(`Exportation des taux de présence en ${format.toUpperCase()} démarrée`);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Erreur lors de l\'exportation');
    }
  };

  // Fonction pour rafraîchir les données du graphique des présences par jour
  const refreshAttendanceByDay = async () => {
    if (!dashboardData || refreshingAttendanceByDay) return;

    try {
      setRefreshingAttendanceByDay(true);

      // Récupérer les présences de la semaine
      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);

      const startDate = oneWeekAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      // Récupérer les nouvelles données
      const weeklyPresences = await getPresenceCountByDate(startDate, endDate);

      // Mettre à jour uniquement le graphique des présences par jour
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          attendanceByDay: formatAttendanceByDay(weeklyPresences)
        });
      }

      toast.success('Données des présences par jour mises à jour');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      toast.error('Erreur lors du rafraîchissement des données');
    } finally {
      setRefreshingAttendanceByDay(false);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des données du tableau de bord:', err);
        setError('Impossible de charger les données du tableau de bord. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Tableau de bord">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Tableau de bord">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout title="Tableau de bord">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Aucune donnée disponible pour le moment.
        </div>
      </DashboardLayout>
    );
  }

  const { stats, attendanceByClass, attendanceByDay, recentAttendance } = dashboardData;

  return (
    <DashboardLayout title="Tableau de bord">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total des étudiants"
          value={stats.totalStudents}
          icon={<Users size={24} />}
          color="blue"
        />

        <StatCard
          title="Présents aujourd'hui"
          value={stats.presentToday}
          icon={<UserCheck size={24} />}
          color="green"
        />

        <StatCard
          title="Absents aujourd'hui"
          value={stats.absentToday}
          icon={<UserX size={24} />}
          color="red"
        />

        <StatCard
          title="Taux de présence"
          value={`${stats.attendanceRate}%`}
          icon={<Percent size={24} />}
          color="purple"
          change={{
            value: stats.weeklyChange,
            isPositive: stats.weeklyChange >= 0
          }}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title="Taux de présence par classe"
          onExport={exportPresencesByClass}
        >
          <AttendanceByClassChart data={attendanceByClass} />
        </ChartCard>

        <ChartCard
          title="Présences par jour (cette semaine)"
          onExport={exportPresencesByDay}
          onRefresh={refreshAttendanceByDay}
          isLoading={refreshingAttendanceByDay}
        >
          <AttendanceByDayChart data={attendanceByDay} />
        </ChartCard>
      </div>

      {/* Tableau des dernières présences */}
      <div className="mb-8">
        <RecentAttendanceTable
          attendances={recentAttendance}
          onExport={exportAttendanceRates}
        />
      </div>
    </DashboardLayout>
  );
}

export default Dashboard
