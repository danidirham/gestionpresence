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
  // États
  const [messages, setMessages] = useState<Message[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [messageType, setMessageType] = useState<'sms' | 'email'>('email');
  const [isGroupMessage, setIsGroupMessage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [form] = Form.useForm();

  // Charger les données au chargement du composant
  useEffect(() => {
    loadData();
  }, []);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      const [messagesData, classesData, parentsData] = await Promise.all([
        fetchMessages(),
        fetchClasses(),
        fetchParents()
      ]);
      setMessages(messagesData);
      setClasses(classesData);
      setParents(parentsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      antMessage.error('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les messages selon l'onglet actif
  const getFilteredMessages = () => {
    switch (activeTab) {
      case 'sent':
        return messages.filter(m => m.statut === 'envoye');
      case 'scheduled':
        return messages.filter(m => m.statut === 'programme');
      case 'draft':
        return messages.filter(m => m.statut === 'brouillon');
      case 'failed':
        return messages.filter(m => m.statut === 'echec');
      case 'sms':
        return messages.filter(m => m.type === 'sms');
      case 'email':
        return messages.filter(m => m.type === 'email');
      default:
        return messages;
    }
  };

  // Ouvrir le modal pour créer un nouveau message
  const handleNewMessage = (type: 'sms' | 'email') => {
    setMessageType(type);
    setCurrentMessage(null);
    setIsGroupMessage(false);
    setScheduledDate(null);
    setAttachments([]);
    setViewMode(false);
    form.resetFields();
    form.setFieldsValue({
      type,
      est_message_groupe: false,
      statut: 'brouillon'
    });
    setModalVisible(true);
  };

  // Ouvrir le modal pour éditer un message existant
  const handleEditMessage = async (id: number) => {
    try {
      setLoading(true);
      const message = await fetchMessageById(id);
      setCurrentMessage(message);
      setMessageType(message.type);
      setIsGroupMessage(message.est_message_groupe);
      setScheduledDate(message.date_programmee ? new Date(message.date_programmee) : null);
      setAttachments(message.attachments || []);
      setViewMode(false);

      form.setFieldsValue({
        ...message,
        parent: message.parent,
        classe: message.classe
      });

      setModalVisible(true);
    } catch (error) {
      console.error('Erreur lors du chargement du message:', error);
      antMessage.error('Impossible de charger le message');
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal pour voir un message
  const handleViewMessage = async (id: number) => {
    try {
      setLoading(true);
      const messageData = await fetchMessageById(id);
      setCurrentMessage(messageData);
      setMessageType(messageData.type);
      setIsGroupMessage(messageData.est_message_groupe);
      setScheduledDate(messageData.date_programmee ? new Date(messageData.date_programmee) : null);
      setAttachments(messageData.attachments || []);
      setViewMode(true);

      form.setFieldsValue({
        ...messageData,
        parent: messageData.parent,
        classe: messageData.classe
      });

      // Marquer le message comme lu s'il ne l'est pas déjà
      if (messageData.type === 'email' && !messageData.est_lu) {
        await markMessageAsRead(id);
      }

      setModalVisible(true);
    } catch (error) {
      console.error('Erreur lors du chargement du message:', error);
      antMessage.error('Impossible de charger le message');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un message
  const handleDeleteMessage = async (id: number) => {
    try {
      await deleteMessage(id);
      antMessage.success('Message supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      antMessage.error('Impossible de supprimer le message');
    }
  };

  // Envoyer un message immédiatement
  const handleSendNow = async (id: number) => {
    try {
      setLoading(true);
      const result = await sendMessageNow(id);
      if (result.success) {
        antMessage.success('Message envoyé avec succès');
      } else {
        antMessage.error(`Erreur lors de l'envoi: ${result.message}`);
      }
      loadData();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      antMessage.error('Impossible d\'envoyer le message');
    } finally {
      setLoading(false);
    }
  };

  // Traiter les messages programmés
  const handleProcessScheduled = async () => {
    try {
      setLoading(true);
      const result = await processScheduledMessages();
      antMessage.success(`${result.success} messages traités avec succès`);
      loadData();
    } catch (error) {
      console.error('Erreur lors du traitement des messages programmés:', error);
      antMessage.error('Impossible de traiter les messages programmés');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection d'un modèle
  const handleSelectTemplate = (template: MessageTemplate) => {
    form.setFieldsValue({
      sujet: template.sujet,
      contenu: template.contenu
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Préparer les données du message
      const messageData: Message = {
        ...values,
        date_programmee: scheduledDate ? scheduledDate.toISOString() : null,
        statut: scheduledDate ? 'programme' : 'brouillon'
      };

      let result;

      if (currentMessage?.id) {
        // Mettre à jour un message existant
        result = await updateMessage(currentMessage.id, messageData);
        antMessage.success('Message mis à jour avec succès');
      } else {
        // Créer un nouveau message
        result = await createMessage(messageData);
        antMessage.success('Message créé avec succès');
      }

      setModalVisible(false);
      loadData();

      // Si le message est programmé pour maintenant ou est en mode brouillon, demander si l'utilisateur veut l'envoyer
      if (!scheduledDate && values.statut !== 'programme') {
        Modal.confirm({
          title: 'Envoyer le message maintenant ?',
          content: 'Voulez-vous envoyer ce message immédiatement ?',
          onOk: async () => {
            await handleSendNow(result.id);
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du message:', error);
      antMessage.error('Impossible d\'enregistrer le message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Messagerie">
      <div className="messages-page">
        <Card
          title="Gestion des messages"
          extra={
            <Space>
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => setStatsVisible(true)}
              >
                Statistiques
              </Button>
              <Button
                type="primary"
                icon={<MailOutlined />}
                onClick={() => handleNewMessage('email')}
              >
                Nouvel email
              </Button>
              <Button
                icon={<MessageOutlined />}
                onClick={() => handleNewMessage('sms')}
              >
                Nouveau SMS
              </Button>
              {messages.some(m => m.statut === 'programme') && (
                <Button
                  icon={<ClockCircleOutlined />}
                  onClick={handleProcessScheduled}
                >
                  Traiter les messages programmés
                </Button>
              )}
            </Space>
          }
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Tous les messages" key="all" />
            <TabPane tab="Envoyés" key="sent" />
            <TabPane tab="Programmés" key="scheduled" />
            <TabPane tab="Brouillons" key="draft" />
            <TabPane tab="Échecs" key="failed" />
            <TabPane tab="SMS" key="sms" />
            <TabPane tab="Emails" key="email" />
          </Tabs>

          <Table
            columns={[
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                render: (type: string) => (
                  <Tag color={type === 'email' ? 'blue' : 'green'} icon={type === 'email' ? <MailOutlined /> : <MessageOutlined />}>
                    {type === 'email' ? 'Email' : 'SMS'}
                  </Tag>
                ),
                filters: [
                  { text: 'Email', value: 'email' },
                  { text: 'SMS', value: 'sms' }
                ],
                onFilter: (value: string, record: Message) => record.type === value
              },
              {
                title: 'Destinataire',
                key: 'destinataire',
                render: (text: string, record: Message) => {
                  if (record.est_message_groupe) {
                    const classe = classes.find(c => c.id === record.classe);
                    return (
                      <span>
                        <TeamOutlined /> {classe ? `Classe: ${classe.nom}` : 'Tous les parents'}
                      </span>
                    );
                  } else {
                    const parent = parents.find(p => p.id === record.parent);
                    return (
                      <span>
                        <UserOutlined /> {parent ? `${parent.prenom} ${parent.nom}` : `Parent #${record.parent}`}
                      </span>
                    );
                  }
                }
              },
              {
                title: 'Sujet/Contenu',
                key: 'contenu',
                render: (text: string, record: Message) => (
                  <div>
                    {record.sujet && <strong>{record.sujet}</strong>}
                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.contenu}
                    </div>
                  </div>
                )
              },
              {
                title: 'Statut',
                dataIndex: 'statut',
                key: 'statut',
                render: (statut: string, record: Message) => {
                  let color = '';
                  let icon = null;

                  switch (statut) {
                    case 'envoye':
                      color = 'success';
                      icon = <CheckCircleOutlined />;
                      break;
                    case 'echec':
                      color = 'error';
                      icon = <CloseCircleOutlined />;
                      break;
                    case 'programme':
                      color = 'processing';
                      icon = <ClockCircleOutlined />;
                      break;
                    case 'en_attente':
                      color = 'warning';
                      icon = <ClockCircleOutlined />;
                      break;
                    default:
                      color = 'default';
                  }

                  return (
                    <Badge
                      status={color as any}
                      text={
                        <span>
                          {icon} {statut.charAt(0).toUpperCase() + statut.slice(1)}
                          {record.type === 'email' && record.est_lu && (
                            <Tooltip title="Lu">
                              <EyeOutlined style={{ marginLeft: '5px', color: '#722ed1' }} />
                            </Tooltip>
                          )}
                        </span>
                      }
                    />
                  );
                },
                filters: [
                  { text: 'Envoyé', value: 'envoye' },
                  { text: 'Échec', value: 'echec' },
                  { text: 'Programmé', value: 'programme' },
                  { text: 'En attente', value: 'en_attente' },
                  { text: 'Brouillon', value: 'brouillon' }
                ],
                onFilter: (value: string, record: Message) => record.statut === value
              },
              {
                title: 'Date',
                key: 'date',
                render: (text: string, record: Message) => {
                  if (record.statut === 'programme' && record.date_programmee) {
                    return (
                      <Tooltip title={dayjs(record.date_programmee).format('DD/MM/YYYY HH:mm')}>
                        <span>Programmé pour {dayjs(record.date_programmee).fromNow()}</span>
                      </Tooltip>
                    );
                  } else if (record.date_envoi) {
                    return (
                      <Tooltip title={dayjs(record.date_envoi).format('DD/MM/YYYY HH:mm')}>
                        <span>{dayjs(record.date_envoi).fromNow()}</span>
                      </Tooltip>
                    );
                  }
                  return '-';
                },
                sorter: (a: Message, b: Message) => {
                  const dateA = a.statut === 'programme' ? a.date_programmee : a.date_envoi;
                  const dateB = b.statut === 'programme' ? b.date_programmee : b.date_envoi;

                  if (!dateA && !dateB) return 0;
                  if (!dateA) return -1;
                  if (!dateB) return 1;

                  return new Date(dateA).getTime() - new Date(dateB).getTime();
                }
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (text: string, record: Message) => (
                  <Space size="small">
                    <Tooltip title="Voir">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewMessage(record.id!)}
                      />
                    </Tooltip>

                    {record.statut !== 'envoye' && (
                      <Tooltip title="Modifier">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditMessage(record.id!)}
                        />
                      </Tooltip>
                    )}

                    {(record.statut === 'brouillon' || record.statut === 'programme') && (
                      <Tooltip title="Envoyer maintenant">
                        <Button
                          type="text"
                          icon={<SendOutlined />}
                          onClick={() => handleSendNow(record.id!)}
                        />
                      </Tooltip>
                    )}

                    <Tooltip title="Supprimer">
                      <Popconfirm
                        title="Êtes-vous sûr de vouloir supprimer ce message ?"
                        onConfirm={() => handleDeleteMessage(record.id!)}
                        okText="Oui"
                        cancelText="Non"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </Tooltip>
                  </Space>
                )
              }
            ]}
            dataSource={getFilteredMessages().map(m => ({ ...m, key: m.id }))}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Modal pour créer/éditer un message */}
        <Modal
          title={
            viewMode
              ? 'Détails du message'
              : currentMessage
                ? 'Modifier le message'
                : 'Nouveau message'
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={viewMode ? [
            <Button key="close" onClick={() => setModalVisible(false)}>
              Fermer
            </Button>
          ] : null}
          width={800}
          destroyOnClose
        >
          <Spin spinning={loading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={viewMode}
            >
              <Form.Item name="type" hidden>
                <Input />
              </Form.Item>

              <Form.Item name="statut" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="est_message_groupe"
                label="Type de destinataire"
                initialValue={false}
              >
                <Select
                  onChange={(value) => setIsGroupMessage(value)}
                  disabled={viewMode || !!currentMessage}
                >
                  <Option value={false}>Destinataire individuel</Option>
                  <Option value={true}>Groupe de destinataires</Option>
                </Select>
              </Form.Item>

              {!isGroupMessage ? (
                <Form.Item
                  name="parent"
                  label="Destinataire"
                  rules={[{ required: true, message: 'Veuillez sélectionner un destinataire' }]}
                >
                  <Select
                    showSearch
                    placeholder="Sélectionner un parent"
                    optionFilterProp="children"
                    disabled={viewMode}
                    filterOption={(input, option) =>
                      (option?.children as unknown as string).toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {parents.map(parent => (
                      <Option key={parent.id} value={parent.id}>
                        {parent.prenom} {parent.nom} ({parent.telephone})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item
                  name="classe"
                  label="Classe"
                  rules={[{ required: false, message: 'Veuillez sélectionner une classe ou "Tous les parents"' }]}
                >
                  <Select
                    placeholder="Sélectionner une classe ou tous les parents"
                    disabled={viewMode}
                  >
                    <Option value={null}>Tous les parents</Option>
                    {classes.map(classe => (
                      <Option key={classe.id} value={classe.id}>
                        {classe.nom}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              {messageType === 'email' && (
                <Form.Item
                  name="sujet"
                  label="Sujet"
                  rules={[{ required: true, message: 'Veuillez saisir un sujet' }]}
                >
                  <Input placeholder="Sujet de l'email" disabled={viewMode} />
                </Form.Item>
              )}

              {messageType === 'email' && (
                <Form.Item label="Modèle">
                  <TemplateSelector
                    type="email"
                    onSelectTemplate={handleSelectTemplate}
                  />
                </Form.Item>
              )}

              {messageType === 'sms' && (
                <Form.Item label="Modèle">
                  <TemplateSelector
                    type="sms"
                    onSelectTemplate={handleSelectTemplate}
                  />
                </Form.Item>
              )}

              <Form.Item
                name="contenu"
                label="Contenu"
                rules={[{ required: true, message: 'Veuillez saisir le contenu du message' }]}
              >
                {messageType === 'email' ? (
                  <RichTextEditor
                    value={form.getFieldValue('contenu') || ''}
                    onChange={value => form.setFieldsValue({ contenu: value })}
                    height="300px"
                    disabled={viewMode}
                  />
                ) : (
                  <Input.TextArea
                    rows={6}
                    placeholder="Contenu du SMS"
                    disabled={viewMode}
                    maxLength={160}
                    showCount
                  />
                )}
              </Form.Item>

              {messageType === 'email' && (
                <Form.Item label="Pièces jointes">
                  <AttachmentManager
                    messageId={currentMessage?.id}
                    attachments={attachments}
                    onAttachmentsChange={setAttachments}
                    disabled={viewMode || !currentMessage?.id}
                  />
                </Form.Item>
              )}

              {!viewMode && (
                <Form.Item label="Programmation">
                  <MessageScheduler
                    value={scheduledDate}
                    onChange={setScheduledDate}
                    disabled={viewMode}
                  />
                </Form.Item>
              )}

              {!viewMode && (
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    {currentMessage ? 'Mettre à jour' : 'Enregistrer'}
                  </Button>
                  <Button style={{ marginLeft: 8 }} onClick={() => setModalVisible(false)}>
                    Annuler
                  </Button>
                </Form.Item>
              )}
            </Form>

            {viewMode && currentMessage?.details_erreur && (
              <div style={{ marginTop: '16px' }}>
                <Divider />
                <Title level={5} style={{ color: '#cf1322' }}>
                  <InfoCircleOutlined /> Détails de l'erreur
                </Title>
                <Text type="danger">{currentMessage.details_erreur}</Text>
              </div>
            )}
          </Spin>
        </Modal>

        {/* Drawer pour les statistiques */}
        <Drawer
          title="Statistiques des messages"
          placement="right"
          onClose={() => setStatsVisible(false)}
          open={statsVisible}
          width={800}
        >
          <MessageStats messages={messages} />
        </Drawer>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
