/**
 * Service pour la gestion des modèles de messages
 */
import { get, post, put, del } from './apiService';

/**
 * Types pour les modèles de messages
 */
export interface MessageTemplate {
  id?: number;
  nom: string;
  type: 'sms' | 'email';
  sujet?: string;
  contenu: string;
  est_html: boolean;
  date_creation?: string;
  date_modification?: string;
}

/**
 * Fonction pour récupérer tous les modèles de messages
 */
export const fetchMessageTemplates = async (): Promise<MessageTemplate[]> => {
  return await get<MessageTemplate[]>('/message-templates/');
};

/**
 * Fonction pour récupérer un modèle de message par son ID
 */
export const fetchMessageTemplateById = async (id: number): Promise<MessageTemplate> => {
  return await get<MessageTemplate>(`/message-templates/${id}/`);
};

/**
 * Fonction pour récupérer les modèles de messages par type (SMS ou Email)
 */
export const fetchMessageTemplatesByType = async (type: 'sms' | 'email'): Promise<MessageTemplate[]> => {
  return await get<MessageTemplate[]>(`/message-templates/by_type/?type=${type}`);
};

/**
 * Fonction pour créer un nouveau modèle de message
 */
export const createMessageTemplate = async (template: MessageTemplate): Promise<MessageTemplate> => {
  return await post<MessageTemplate>('/message-templates/', template);
};

/**
 * Fonction pour mettre à jour un modèle de message existant
 */
export const updateMessageTemplate = async (id: number, template: MessageTemplate): Promise<MessageTemplate> => {
  return await put<MessageTemplate>(`/message-templates/${id}/`, template);
};

/**
 * Fonction pour supprimer un modèle de message
 */
export const deleteMessageTemplate = async (id: number): Promise<void> => {
  return await del(`/message-templates/${id}/`);
};
