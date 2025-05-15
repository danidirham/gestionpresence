import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Users,
  Search,
  RefreshCw,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  FileSpreadsheet,
  FileText,
  MailWarning,
  PhoneCall
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getAbsenceAlerts, AbsenceAlert } from '../services/statisticsService';
import { ExportService, ExportFormat } from '../services/exportService';
import { sendAbsenceNotification, sendBulkEmail, sendBulkSMS } from '../services/messageService';

const AbsenceAlerts = () => {
  const [alerts, setAlerts] = useState<AbsenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(70);
  const [days, setDays] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{
    type: 'email' | 'sms' | 'message' | 'bulk-email' | 'bulk-sms';
    studentId?: number;
  } | null>(null);

  // Charger les alertes au chargement de la page
  useEffect(() => {
    loadAlerts();
  }, [threshold, days]);

  // Fonction pour charger les alertes
  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAbsenceAlerts(threshold, days);
      setAlerts(data);

      // Extraire les classes uniques
      const uniqueClasses = Array.from(new Set(data.map(alert => alert.classe_nom).filter(Boolean)));
      setClasses(uniqueClasses as string[]);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes d\'absence:', error);
      toast.error('Erreur lors du chargement des alertes d\'absence');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les alertes
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchTerm === '' ||
      `${alert.etudiant_prenom} ${alert.etudiant_nom}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === null || alert.classe_nom === selectedClass;

    return matchesSearch && matchesClass;
  });

  // Trier les alertes par taux de présence croissant
  const sortedAlerts = [...filteredAlerts].sort((a, b) => a.attendance_rate - b.attendance_rate);

  // Fonction pour exporter les alertes
  const exportAlerts = (format: ExportFormat) => {
    try {
      ExportService.exportAbsenceAlerts(threshold, days, format);
      toast.success(`Exportation en ${format.toUpperCase()} démarrée`);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Erreur lors de l\'exportation');
    }
  };

  // Fonction pour envoyer un email d'alerte
  const sendEmailAlert = async (alert: AbsenceAlert) => {
    try {
      setActionLoading({ type: 'email', studentId: alert.etudiant_id });
      const toastId = toast.loading(`Envoi d'un email pour ${alert.etudiant_prenom} ${alert.etudiant_nom}...`);

      // Récupérer les parents de l'étudiant
      // Note: Dans une implémentation réelle, vous devriez récupérer les parents de l'étudiant
      // Pour simplifier, nous utilisons l'ID de l'étudiant comme substitut
      const parentId = alert.etudiant_id;

      const response = await sendAbsenceNotification(alert.etudiant_id, parentId, 'email');

      if (response.success) {
        toast.success(`Email envoyé aux parents de ${alert.etudiant_prenom} ${alert.etudiant_nom}`, { id: toastId });
      } else {
        toast.error(`Échec de l'envoi de l'email: ${response.message}`, { id: toastId });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour envoyer un SMS d'alerte
  const sendSMSAlert = async (alert: AbsenceAlert) => {
    try {
      setActionLoading({ type: 'sms', studentId: alert.etudiant_id });
      const toastId = toast.loading(`Envoi d'un SMS pour ${alert.etudiant_prenom} ${alert.etudiant_nom}...`);

      // Récupérer les parents de l'étudiant
      const parentId = alert.etudiant_id;

      const response = await sendAbsenceNotification(alert.etudiant_id, parentId, 'sms');

      if (response.success) {
        toast.success(`SMS envoyé aux parents de ${alert.etudiant_prenom} ${alert.etudiant_nom}`, { id: toastId });
      } else {
        toast.error(`Échec de l'envoi du SMS: ${response.message}`, { id: toastId });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du SMS:', error);
      toast.error('Erreur lors de l\'envoi du SMS');
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour envoyer un message interne d'alerte
  const sendInternalMessage = async (alert: AbsenceAlert) => {
    try {
      setActionLoading({ type: 'message', studentId: alert.etudiant_id });
      const toastId = toast.loading(`Envoi d'un message pour ${alert.etudiant_prenom} ${alert.etudiant_nom}...`);

      // Récupérer les parents de l'étudiant
      const parentId = alert.etudiant_id;

      const response = await sendAbsenceNotification(alert.etudiant_id, parentId, 'message');

      if (response.success) {
        toast.success(`Message envoyé aux parents de ${alert.etudiant_prenom} ${alert.etudiant_nom}`, { id: toastId });
      } else {
        toast.error(`Échec de l'envoi du message: ${response.message}`, { id: toastId });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour envoyer des emails en masse aux parents des étudiants en alerte
  const sendBulkEmailAlerts = async () => {
    try {
      setActionLoading({ type: 'bulk-email' });
      const toastId = toast.loading(`Envoi d'emails à tous les parents des étudiants en alerte...`);

      // Si une classe est sélectionnée, envoyer seulement aux parents de cette classe
      if (selectedClass) {
        // Trouver l'ID de la classe (dans une implémentation réelle, vous auriez un mapping classe -> ID)
        // Pour simplifier, nous utilisons un ID fictif
        const classId = 1; // ID fictif

        const response = await sendBulkEmail(
          "Alerte d'absentéisme",
          `Nous souhaitons vous informer que votre enfant présente un taux d'absentéisme élevé. Veuillez contacter l'établissement pour plus d'informations.`,
          classId
        );

        if (response.success) {
          toast.success(`Emails envoyés aux parents des étudiants de la classe ${selectedClass}`, { id: toastId });
        } else {
          toast.error(`Échec de l'envoi des emails: ${response.message}`, { id: toastId });
        }
      } else {
        // Envoyer à tous les parents des étudiants en alerte
        const response = await sendBulkEmail(
          "Alerte d'absentéisme",
          `Nous souhaitons vous informer que votre enfant présente un taux d'absentéisme élevé. Veuillez contacter l'établissement pour plus d'informations.`,
          undefined,
          true // tous les parents
        );

        if (response.success) {
          toast.success(`Emails envoyés aux parents de tous les étudiants en alerte`, { id: toastId });
        } else {
          toast.error(`Échec de l'envoi des emails: ${response.message}`, { id: toastId });
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails en masse:', error);
      toast.error('Erreur lors de l\'envoi des emails en masse');
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour envoyer des SMS en masse aux parents des étudiants en alerte
  const sendBulkSMSAlerts = async () => {
    try {
      setActionLoading({ type: 'bulk-sms' });
      const toastId = toast.loading(`Envoi de SMS à tous les parents des étudiants en alerte...`);

      // Si une classe est sélectionnée, envoyer seulement aux parents de cette classe
      if (selectedClass) {
        // Trouver l'ID de la classe (dans une implémentation réelle, vous auriez un mapping classe -> ID)
        // Pour simplifier, nous utilisons un ID fictif
        const classId = 1; // ID fictif

        const response = await sendBulkSMS(
          `Alerte d'absentéisme: Votre enfant présente un taux d'absentéisme élevé. Veuillez contacter l'établissement.`,
          "Alerte d'absentéisme",
          classId
        );

        if (response.success) {
          toast.success(`SMS envoyés aux parents des étudiants de la classe ${selectedClass}`, { id: toastId });
        } else {
          toast.error(`Échec de l'envoi des SMS: ${response.message}`, { id: toastId });
        }
      } else {
        // Envoyer à tous les parents des étudiants en alerte
        const response = await sendBulkSMS(
          `Alerte d'absentéisme: Votre enfant présente un taux d'absentéisme élevé. Veuillez contacter l'établissement.`,
          "Alerte d'absentéisme",
          undefined,
          true // tous les parents
        );

        if (response.success) {
          toast.success(`SMS envoyés aux parents de tous les étudiants en alerte`, { id: toastId });
        } else {
          toast.error(`Échec de l'envoi des SMS: ${response.message}`, { id: toastId });
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des SMS en masse:', error);
      toast.error('Erreur lors de l\'envoi des SMS en masse');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout title="Alertes d'absentéisme">
      <div className="space-y-6">
        {/* En-tête avec titre et boutons */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <AlertTriangle className="mr-2 text-amber-500 dark:text-amber-400" size={24} />
            Alertes d'absentéisme
          </h2>
          <div className="flex space-x-2">
            {/* Boutons d'exportation */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => exportAlerts('xlsx')}
                className="px-3 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center border-r border-gray-300 dark:border-gray-600"
                title="Exporter en Excel"
                disabled={loading}
              >
                <FileSpreadsheet className="text-green-600 dark:text-green-400" size={16} />
              </button>
              <button
                onClick={() => exportAlerts('csv')}
                className="px-3 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center border-r border-gray-300 dark:border-gray-600"
                title="Exporter en CSV"
                disabled={loading}
              >
                <FileText className="text-blue-600 dark:text-blue-400" size={16} />
              </button>
              <button
                onClick={() => exportAlerts('pdf')}
                className="px-3 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center"
                title="Exporter en PDF"
                disabled={loading}
              >
                <FileText className="text-red-600 dark:text-red-400" size={16} />
              </button>
            </div>

            {/* Boutons d'envoi en masse */}
            <div className="flex space-x-2">
              <button
                onClick={sendBulkEmailAlerts}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm flex items-center"
                disabled={loading || actionLoading !== null}
                title="Envoyer des emails à tous les parents des étudiants en alerte"
              >
                {actionLoading?.type === 'bulk-email' ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <MailWarning className="mr-2" size={16} />
                )}
                Emails
              </button>
              <button
                onClick={sendBulkSMSAlerts}
                className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-sm flex items-center"
                disabled={loading || actionLoading !== null}
                title="Envoyer des SMS à tous les parents des étudiants en alerte"
              >
                {actionLoading?.type === 'bulk-sms' ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <PhoneCall className="mr-2" size={16} />
                )}
                SMS
              </button>
            </div>

            {/* Bouton de rafraîchissement */}
            <button
              onClick={loadAlerts}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm flex items-center"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <RefreshCw className="mr-2" size={16} />
              )}
              Rafraîchir
            </button>
          </div>
        </div>

        {/* Filtres et paramètres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Recherche */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rechercher un étudiant
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm pl-10 py-2"
                  placeholder="Nom de l'étudiant"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Filtre par classe */}
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filtrer par classe
              </label>
              <select
                id="class"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(e.target.value === '' ? null : e.target.value)}
              >
                <option value="">Toutes les classes</option>
                {classes.map((classe, index) => (
                  <option key={index} value={classe}>{classe}</option>
                ))}
              </select>
            </div>

            {/* Seuil d'alerte */}
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seuil d'alerte (%)
              </label>
              <input
                type="number"
                id="threshold"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
            </div>

            {/* Période */}
            <div>
              <label htmlFor="days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Période (jours)
              </label>
              <input
                type="number"
                id="days"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Tableau des alertes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
              <Users className="mr-2 text-blue-600 dark:text-blue-400" size={20} />
              Étudiants en alerte
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAlerts.length} étudiant(s) avec un taux de présence inférieur à {threshold}%
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-blue-500 dark:text-blue-400 mr-2" size={24} />
              <span className="text-gray-600 dark:text-gray-300">Chargement des alertes...</span>
            </div>
          ) : sortedAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Étudiant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Classe
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Présences
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Taux
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedAlerts.map((alert, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300">
                            {alert.etudiant_prenom[0]}{alert.etudiant_nom[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {alert.etudiant_prenom} {alert.etudiant_nom}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{alert.classe_nom || 'Non assigné'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{alert.presence_count} / {alert.working_days}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          alert.attendance_rate < 50
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {alert.attendance_rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Envoyer un email"
                            onClick={() => sendEmailAlert(alert)}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading?.type === 'email' && actionLoading?.studentId === alert.etudiant_id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Mail size={18} />
                            )}
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Envoyer un SMS"
                            onClick={() => sendSMSAlert(alert)}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading?.type === 'sms' && actionLoading?.studentId === alert.etudiant_id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Phone size={18} />
                            )}
                          </button>
                          <button
                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                            title="Envoyer un message"
                            onClick={() => sendInternalMessage(alert)}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading?.type === 'message' && actionLoading?.studentId === alert.etudiant_id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <MessageSquare size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Aucune alerte d'absentéisme à signaler
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AbsenceAlerts;
