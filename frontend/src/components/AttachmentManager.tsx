import React, { useState } from 'react';
import { 
  Upload, 
  Button, 
  List, 
  Typography, 
  Tooltip, 
  message, 
  Popconfirm 
} from 'antd';
import { 
  UploadOutlined, 
  FileOutlined, 
  FilePdfOutlined, 
  FileImageOutlined, 
  FileExcelOutlined, 
  FileWordOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { UploadFile } from 'antd/lib/upload/interface';
import { MessageAttachment, addAttachment, deleteAttachment } from '../services/attachmentService';

const { Text } = Typography;

interface AttachmentManagerProps {
  messageId?: number;
  attachments: MessageAttachment[];
  onAttachmentsChange: (attachments: MessageAttachment[]) => void;
  disabled?: boolean;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  messageId,
  attachments,
  onAttachmentsChange,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Fonction pour obtenir l'icône en fonction du type de fichier
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImageOutlined style={{ color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ color: '#2f54eb' }} />;
      default:
        return <FileOutlined />;
    }
  };

  // Fonction pour formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Gérer le téléchargement de fichier
  const handleUpload = async () => {
    if (!messageId) {
      message.error('Veuillez d\'abord enregistrer le message');
      return;
    }

    if (fileList.length === 0) {
      message.warning('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);

    try {
      const newAttachments: MessageAttachment[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const attachment = await addAttachment(messageId, file.originFileObj as File);
        newAttachments.push(attachment);
      }

      setFileList([]);
      onAttachmentsChange([...attachments, ...newAttachments]);
      message.success('Pièces jointes ajoutées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout des pièces jointes:', error);
      message.error('Impossible d\'ajouter les pièces jointes');
    } finally {
      setUploading(false);
    }
  };

  // Gérer la suppression d'une pièce jointe
  const handleRemoveAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId);
      const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
      onAttachmentsChange(updatedAttachments);
      message.success('Pièce jointe supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de la pièce jointe:', error);
      message.error('Impossible de supprimer la pièce jointe');
    }
  };

  return (
    <div className="attachment-manager">
      <div style={{ marginBottom: '16px' }}>
        <Upload
          multiple
          listType="text"
          fileList={fileList}
          beforeUpload={(file) => {
            setFileList(prev => [...prev, file]);
            return false;
          }}
          onRemove={(file) => {
            setFileList(prev => prev.filter(f => f.uid !== file.uid));
          }}
          disabled={disabled || uploading}
        >
          <Button 
            icon={<UploadOutlined />} 
            loading={uploading}
            disabled={disabled}
          >
            Sélectionner des fichiers
          </Button>
        </Upload>
        {fileList.length > 0 && (
          <Button
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            style={{ marginTop: '8px' }}
            disabled={disabled}
          >
            {uploading ? 'Téléchargement...' : 'Télécharger'}
          </Button>
        )}
      </div>

      {attachments.length > 0 && (
        <List
          size="small"
          bordered
          dataSource={attachments}
          renderItem={item => (
            <List.Item
              actions={[
                !disabled && (
                  <Popconfirm
                    title="Êtes-vous sûr de vouloir supprimer cette pièce jointe ?"
                    onConfirm={() => handleRemoveAttachment(item.id!)}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      disabled={disabled}
                    />
                  </Popconfirm>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getFileIcon(item.nom_fichier)}
                title={
                  <a 
                    href={item.fichier} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {item.nom_fichier}
                  </a>
                }
                description={
                  <Text type="secondary">
                    {item.type_mime} - {formatFileSize(item.taille)}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default AttachmentManager;
