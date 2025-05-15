import React, { useState, useEffect } from 'react';
import {
  Send,
  Clock,
  Users,
  User,
  Mail,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  PenTool,
  History,
  BarChart,
  MessageSquare
} from 'lucide-react';
import {
  Tabs,
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message as antMessage,
  Tooltip,
  Popconfirm,
  Badge,
  Drawer,
  Spin,
  Typography,
  Divider
} from 'antd';
import {
  SendOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MailOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import DashboardLayout from '../components/layout/DashboardLayout';

// Services
import {
  Message,
  MessageResponse,
  fetchMessages,
  fetchMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  sendMessageNow,
  markMessageAsRead,
  processScheduledMessages,
  sendEmail,
  sendSMS,
  sendBulkEmail,
  sendBulkSMS
} from '../services/messageService';
import { fetchClasses, Classe } from '../services/studentService';
import { fetchParents, Parent } from '../services/parentService';
import { MessageTemplate } from '../services/messageTemplateService';

// Composants
import RichTextEditor from '../components/RichTextEditor';
import TemplateSelector from '../components/TemplateSelector';
import AttachmentManager from '../components/AttachmentManager';
import MessageScheduler from '../components/MessageScheduler';
import MessageStats from '../components/MessageStats';

// Configuration de dayjs
dayjs.locale('fr');
dayjs.extend(relativeTime);

const { TabPane } = Tabs;
const { Option } = Select;
const { Text, Title } = Typography;

const Messages: React.FC = () => {
  // State for messages
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('compose');
  const [sendStatus, setSendStatus] = useState<'sending' | 'success' | 'error' | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [formData, setFormData] = useState({
    recipientType: 'classe',
    recipient: 'CM2',
    subject: '',
    content: '',
    sendToAll: false
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendStatus('sending');

    try {
      // Préparer les données du message
      const messageData = {
        ...formData,
        date_programmee: scheduledDate ? scheduledDate.toISOString() : null,
        statut: scheduledDate ? 'programme' : 'brouillon'
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Sending message:', messageData);

      // Ajouter le message à l'historique
      const newMessage = {
        id: Date.now(), // Simuler un ID unique
        subject: formData.subject,
        content: formData.content,
        recipientType: formData.recipientType,
        recipient: formData.recipient,
        sentAt: scheduledDate || new Date(),
        status: scheduledDate ? 'programme' : 'envoye',
        details: {
          total: formData.recipientType === 'classe' ? 25 : formData.recipientType === 'all' ? 150 : 1,
          success: formData.recipientType === 'classe' ? 24 : formData.recipientType === 'all' ? 145 : 1,
          failed: formData.recipientType === 'classe' ? 1 : formData.recipientType === 'all' ? 5 : 0
        }
      };

      setMessages(prevMessages => [newMessage, ...prevMessages]);

      // Simulate success
      setTimeout(() => {
        setSendStatus('success');

        // Reset form after success
        setTimeout(() => {
          setSendStatus(null);
          setFormData({
            recipientType: 'classe',
            recipient: 'CM2',
            subject: '',
            content: '',
            sendToAll: false
          });
          setScheduledDate(null);
          setActiveTab('history');
        }, 2000);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setSendStatus('error');
    }
  };

  // Helper function to get class ID from class name (simulated)
  const getClasseId = (className: string): number => {
    const classMap: {[key: string]: number} = {
      'CP1': 1,
      'CP2': 2,
      'CE1': 3,
      'CE2': 4,
      'CM1': 5,
      'CM2': 6
    };
    return classMap[className] || 1;
  };

  // Générer des messages de démonstration pour les statistiques
  const generateDemoMessages = () => {
    const demoMessages = [];
    const classes = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
    const subjects = [
      'Information importante',
      'Réunion parents-professeurs',
      'Sortie scolaire',
      'Rappel vaccinations',
      'Fermeture exceptionnelle',
      'Changement d\'horaires',
      'Activités périscolaires',
      'Cantine scolaire'
    ];
    const statuts = ['envoye', 'echec', 'programme', 'en_attente', 'brouillon'];
    const types = ['email', 'sms'];

    // Générer 50 messages aléatoires
    for (let i = 1; i <= 50; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const statut = statuts[Math.floor(Math.random() * statuts.length)];
      const classe = classes[Math.floor(Math.random() * classes.length)];
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const est_message_groupe = Math.random() > 0.3;
      const est_lu = type === 'email' && statut === 'envoye' ? Math.random() > 0.4 : false;

      // Date d'envoi ou de programmation
      const now = new Date();
      const randomDays = Math.floor(Math.random() * 30) - 15; // Entre -15 et +15 jours
      const date = new Date(now.getTime() + randomDays * 24 * 60 * 60 * 1000);

      demoMessages.push({
        id: i,
        type,
        statut,
        sujet: subject,
        contenu: `Contenu du message ${i} concernant ${subject.toLowerCase()}.`,
        est_message_groupe,
        est_lu,
        classe: est_message_groupe ? getClasseId(classe) : null,
        parent: est_message_groupe ? null : Math.floor(Math.random() * 100) + 1,
        date_envoi: statut === 'envoye' ? date.toISOString() : null,
        date_programmee: statut === 'programme' ? date.toISOString() : null,
        details_erreur: statut === 'echec' ? 'Erreur de connexion au serveur SMTP' : null,
        subject, // Pour la compatibilité avec l'interface existante
        recipientType: est_message_groupe ? 'classe' : 'parent',
        recipient: est_message_groupe ? classe : `Parent ${Math.floor(Math.random() * 100) + 1}`,
        sentAt: date,
        status: statut,
        details: {
          total: est_message_groupe ? Math.floor(Math.random() * 20) + 5 : 1,
          success: 0,
          failed: 0
        }
      });
    }

    // Calculer les succès et échecs
    demoMessages.forEach(msg => {
      if (msg.statut === 'envoye') {
        msg.details.success = msg.details.total - Math.floor(Math.random() * 3);
        msg.details.failed = msg.details.total - msg.details.success;
      } else if (msg.statut === 'echec') {
        msg.details.failed = msg.details.total;
      }
    });

    return demoMessages;
  };

  // Charger les messages au chargement de la page
  useEffect(() => {
    // Dans un environnement réel, nous ferions un appel API ici
    // fetchMessages().then(data => setMessages(data));

    // Pour la démonstration, nous utilisons des données générées
    setMessages(generateDemoMessages());
  }, []);

  return (
    <DashboardLayout title="Messages">
      <div>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setStatsVisible(true)}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm flex items-center"
          >
            <BarChart className="mr-2" size={18} />
            Voir les statistiques détaillées
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              <button
                className={`px-6 py-4 text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'compose'
                    ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('compose')}
              >
                <PenTool size={18} className={`mr-2 ${activeTab === 'compose' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                Composer un message
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('history')}
              >
                <History size={18} className={`mr-2 ${activeTab === 'history' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                Historique des messages
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium flex items-center transition-colors ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('stats')}
              >
                <BarChart size={18} className={`mr-2 ${activeTab === 'stats' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                Statistiques
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'stats' ? (
              <div>
                <div className="flex items-center mb-6">
                  <BarChart className="text-blue-600 dark:text-blue-400 mr-2" size={24} />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Statistiques des messages</h2>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden p-6">
                  <MessageStats messages={messages} />
                </div>
              </div>
            ) : activeTab === 'compose' ? (
              <div>
                <div className="flex items-center mb-6">
                  <Mail className="text-blue-600 dark:text-blue-400 mr-2" size={24} />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Envoyer un nouveau message</h2>
                </div>

                {sendStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 dark:border-green-600 rounded-r-md flex items-start">
                    <CheckCircle className="text-green-600 dark:text-green-400 mr-3 mt-0.5" size={20} />
                    <div>
                      {scheduledDate ? (
                        <>
                          <p className="font-medium text-green-800 dark:text-green-300">Message programmé avec succès !</p>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            Votre message sera envoyé le {scheduledDate.toLocaleDateString('fr-FR')} à {scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-green-800 dark:text-green-300">Message envoyé avec succès !</p>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">Votre message a été envoyé et apparaîtra dans l'historique.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {sendStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 rounded-r-md flex items-start">
                    <AlertCircle className="text-red-600 dark:text-red-400 mr-3 mt-0.5" size={20} />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300">Erreur lors de l'envoi du message</p>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">Veuillez vérifier votre connexion et réessayer.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type de destinataire</label>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                          <label className="flex items-center p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="recipientType"
                              value="classe"
                              checked={formData.recipientType === 'classe'}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                            <div className="ml-3">
                              <span className="flex items-center font-medium text-gray-800 dark:text-white">
                                <Users size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                                Classe
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Envoyer à tous les parents d'une classe</span>
                            </div>
                          </label>
                          <label className="flex items-center p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="recipientType"
                              value="all"
                              checked={formData.recipientType === 'all'}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                            <div className="ml-3">
                              <span className="flex items-center font-medium text-gray-800 dark:text-white">
                                <Users size={16} className="mr-2 text-green-600 dark:text-green-400" />
                                Tous les parents
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Envoyer à tous les parents de l'école</span>
                            </div>
                          </label>
                          <label className="flex items-center p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="recipientType"
                              value="parent"
                              checked={formData.recipientType === 'parent'}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                            <div className="ml-3">
                              <span className="flex items-center font-medium text-gray-800 dark:text-white">
                                <User size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                                Parent spécifique
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Envoyer à un parent individuel</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {formData.recipientType === 'classe'
                            ? 'Sélectionner une classe'
                            : formData.recipientType === 'parent'
                              ? 'Sélectionner un parent'
                              : 'Tous les parents de l\'école'}
                        </label>
                        <div className="relative">
                          {formData.recipientType === 'classe' ? (
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Users size={16} className="text-gray-400 dark:text-gray-500" />
                              </div>
                              <select
                                name="recipient"
                                value={formData.recipient}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white"
                                required
                              >
                                <option value="CP1">CP1</option>
                                <option value="CP2">CP2</option>
                                <option value="CE1">CE1</option>
                                <option value="CE2">CE2</option>
                                <option value="CM1">CM1</option>
                                <option value="CM2">CM2</option>
                              </select>
                            </div>
                          ) : formData.recipientType === 'parent' ? (
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={16} className="text-gray-400 dark:text-gray-500" />
                              </div>
                              <input
                                type="text"
                                name="recipient"
                                value={formData.recipient}
                                onChange={handleInputChange}
                                placeholder="Nom du parent"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white dark:placeholder-gray-400"
                                required
                              />
                            </div>
                          ) : (
                            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 flex items-center">
                              <Users size={18} className="text-green-600 dark:text-green-400 mr-2" />
                              <div>
                                <p className="font-medium">Message à tous les parents</p>
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">Le message sera envoyé à tous les parents enregistrés dans la base de données.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sujet du message</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText size={16} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="Saisissez le sujet de votre message"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white dark:placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contenu du message</label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Saisissez votre message ici..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white dark:placeholder-gray-400"
                        required
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Programmation</label>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <MessageScheduler
                          value={scheduledDate}
                          onChange={setScheduledDate}
                          disabled={false}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
                    <button
                      type="submit"
                      disabled={sendStatus === 'sending'}
                      className="px-5 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm flex items-center"
                    >
                      {sendStatus === 'sending' ? (
                        <>
                          <Loader className="animate-spin mr-2" size={18} />
                          Envoi en cours...
                        </>
                      ) : scheduledDate ? (
                        <>
                          <Clock className="mr-2" size={18} />
                          Programmer le message
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={18} />
                          Envoyer le message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <History className="text-blue-600 dark:text-blue-400 mr-2" size={24} />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Historique des messages</h2>
                  </div>

                  <div className="relative max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Rechercher un message..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-900 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {messages.length} message{messages.length > 1 ? 's' : ''} envoyé{messages.length > 1 ? 's' : ''}
                    </div>
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                      <RefreshCw size={14} className="mr-1" />
                      Actualiser
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {messages.map((message) => (
                      <div key={message.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white text-lg">{message.subject}</h3>
                            <div className="flex items-center mt-1">
                              <span className={`flex items-center text-sm ${
                                message.recipientType === 'classe' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                              }`}>
                                {message.recipientType === 'classe' ? (
                                  <Users size={14} className="mr-1" />
                                ) : (
                                  <User size={14} className="mr-1" />
                                )}
                                {message.recipient}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <Clock size={12} className="mr-1" />
                              {message.status === 'programme' ? 'Programmé pour le' : 'Envoyé le'} {new Date(message.sentAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              {message.status === 'programme' ? 'à' : ''} {new Date(message.sentAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-3">
                          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">{message.content}</p>
                        </div>

                        {message.details && (
                          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700 mb-3">
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Détails de l'envoi</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-700">
                                <span className="block text-gray-500 dark:text-gray-400">Total</span>
                                <span className="font-medium text-gray-800 dark:text-white">{message.details.total} parents</span>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-100 dark:border-green-700">
                                <span className="block text-gray-500 dark:text-gray-400">Réussis</span>
                                <span className="font-medium text-green-600 dark:text-green-400">{message.details.success} messages</span>
                              </div>
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-red-100 dark:border-red-700">
                                <span className="block text-gray-500 dark:text-gray-400">Échoués</span>
                                <span className="font-medium text-red-600 dark:text-red-400">{message.details.failed} messages</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          {message.status === 'programme' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                              <Clock size={12} className="mr-1" />
                              Programmé
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                              <CheckCircle size={12} className="mr-1" />
                              Envoyé
                            </span>
                          )}
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm flex items-center">
                              <RefreshCw size={14} className="mr-1" />
                              Renvoyer
                            </button>
                            <button className="px-3 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-sm flex items-center">
                              <PenTool size={14} className="mr-1" />
                              Modifier
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {messages.length === 0 && (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Mail size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="font-medium">Aucun message envoyé</p>
                        <p className="text-sm mt-1">Les messages que vous envoyez apparaîtront ici.</p>
                        <button
                          onClick={() => setActiveTab('compose')}
                          className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors inline-flex items-center"
                        >
                          <PenTool size={16} className="mr-2" />
                          Composer un message
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer pour les statistiques détaillées */}
      <Drawer
        title="Statistiques détaillées des messages"
        placement="right"
        onClose={() => setStatsVisible(false)}
        open={statsVisible}
        width={800}
      >
        <div className="p-4">
          <MessageStats messages={messages} />

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Analyse des messages</h3>

            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700 mb-6">
              <h4 className="text-md font-medium text-blue-800 dark:text-blue-300 mb-2">Conseils pour améliorer vos communications</h4>
              <ul className="list-disc pl-5 text-blue-700 dark:text-blue-400 space-y-1">
                <li>Les messages envoyés entre 18h et 20h ont un meilleur taux de lecture</li>
                <li>Les messages courts (moins de 300 caractères) sont plus souvent lus</li>
                <li>Incluez le nom de l'élève dans le sujet pour augmenter l'engagement</li>
                <li>Programmez vos messages importants à l'avance pour assurer leur envoi</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">Messages par classe</h4>
                <div className="space-y-2">
                  {['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'].map(classe => {
                    const count = messages.filter(m =>
                      m.recipientType === 'classe' && m.recipient === classe
                    ).length;
                    const percent = messages.length > 0 ? (count / messages.length * 100).toFixed(1) : 0;
                    return (
                      <div key={classe} className="flex items-center">
                        <span className="w-16 text-gray-700 dark:text-gray-300">{classe}</span>
                        <div className="flex-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{count} ({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">Taux de lecture par jour</h4>
                <div className="space-y-2">
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => {
                    const percent = Math.floor(Math.random() * 40) + 60; // Simulé pour la démo
                    return (
                      <div key={day} className="flex items-center">
                        <span className="w-20 text-gray-700 dark:text-gray-300">{day}</span>
                        <div className="flex-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </DashboardLayout>
  );
};

export default Messages;
