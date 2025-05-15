import React, { useState, useEffect } from 'react';
import { 
  Select, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Spin, 
  Tooltip, 
  Popconfirm 
} from 'antd';
import { 
  PlusOutlined, 
  SaveOutlined, 
  DeleteOutlined, 
  QuestionCircleOutlined 
} from '@ant-design/icons';
import { 
  MessageTemplate, 
  fetchMessageTemplatesByType, 
  createMessageTemplate, 
  updateMessageTemplate, 
  deleteMessageTemplate 
} from '../services/messageTemplateService';
import RichTextEditor from './RichTextEditor';

interface TemplateSelectorProps {
  type: 'sms' | 'email';
  onSelectTemplate: (template: MessageTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ type, onSelectTemplate }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<MessageTemplate | null>(null);
  const [form] = Form.useForm();

  // Charger les modèles au chargement du composant
  useEffect(() => {
    loadTemplates();
  }, [type]);

  // Charger les modèles depuis l'API
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await fetchMessageTemplatesByType(type);
      setTemplates(data);
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error);
      message.error('Impossible de charger les modèles de messages');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection d'un modèle
  const handleSelectTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  // Ouvrir le modal pour créer un nouveau modèle
  const handleNewTemplate = () => {
    setEditMode(false);
    setCurrentTemplate(null);
    form.resetFields();
    form.setFieldsValue({
      type,
      est_html: type === 'email'
    });
    setModalVisible(true);
  };

  // Ouvrir le modal pour éditer un modèle existant
  const handleEditTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditMode(true);
      setCurrentTemplate(template);
      form.setFieldsValue(template);
      setModalVisible(true);
    }
  };

  // Supprimer un modèle
  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await deleteMessageTemplate(templateId);
      message.success('Modèle supprimé avec succès');
      loadTemplates();
    } catch (error) {
      console.error('Erreur lors de la suppression du modèle:', error);
      message.error('Impossible de supprimer le modèle');
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (values: any) => {
    try {
      if (editMode && currentTemplate?.id) {
        await updateMessageTemplate(currentTemplate.id, values);
        message.success('Modèle mis à jour avec succès');
      } else {
        await createMessageTemplate(values);
        message.success('Modèle créé avec succès');
      }
      setModalVisible(false);
      loadTemplates();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du modèle:', error);
      message.error('Impossible d\'enregistrer le modèle');
    }
  };

  return (
    <div className="template-selector">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Select
          style={{ width: '100%' }}
          placeholder="Sélectionner un modèle"
          loading={loading}
          onChange={handleSelectTemplate}
          optionLabelProp="label"
        >
          {templates.map(template => (
            <Select.Option 
              key={template.id} 
              value={template.id} 
              label={template.nom}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{template.nom}</span>
                <div>
                  <Tooltip title="Modifier">
                    <Button 
                      type="text" 
                      icon={<SaveOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTemplate(template.id!);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <Popconfirm
                      title="Êtes-vous sûr de vouloir supprimer ce modèle ?"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDeleteTemplate(template.id!);
                      }}
                      okText="Oui"
                      cancelText="Non"
                      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    >
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Tooltip>
                </div>
              </div>
            </Select.Option>
          ))}
        </Select>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleNewTemplate}
          style={{ marginLeft: '8px' }}
        >
          Nouveau
        </Button>
      </div>

      <Modal
        title={editMode ? "Modifier le modèle" : "Nouveau modèle"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ type, est_html: type === 'email' }}
          >
            <Form.Item
              name="nom"
              label="Nom du modèle"
              rules={[{ required: true, message: 'Veuillez saisir un nom pour ce modèle' }]}
            >
              <Input placeholder="Nom du modèle" />
            </Form.Item>

            <Form.Item name="type" hidden>
              <Input />
            </Form.Item>

            <Form.Item name="est_html" hidden>
              <Input />
            </Form.Item>

            {type === 'email' && (
              <Form.Item
                name="sujet"
                label="Sujet"
                rules={[{ required: true, message: 'Veuillez saisir un sujet' }]}
              >
                <Input placeholder="Sujet de l'email" />
              </Form.Item>
            )}

            <Form.Item
              name="contenu"
              label="Contenu"
              rules={[{ required: true, message: 'Veuillez saisir le contenu du message' }]}
            >
              {type === 'email' ? (
                <RichTextEditor 
                  value={form.getFieldValue('contenu') || ''} 
                  onChange={value => form.setFieldsValue({ contenu: value })}
                  height="300px"
                />
              ) : (
                <Input.TextArea 
                  rows={6} 
                  placeholder="Contenu du message" 
                />
              )}
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                {editMode ? "Mettre à jour" : "Créer"}
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={() => setModalVisible(false)}>
                Annuler
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default TemplateSelector;
