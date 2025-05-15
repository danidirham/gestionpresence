/**
 * Service pour l'envoi de messages (email, SMS, notifications)
 */
import { get, post, put, del } from './apiService';

/**
 * Types pour les messages
 */
export interface MessageResponse {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Interface pour un message
 */
export interface Message {
  id?: number;
  parent: number;
  type: 'sms' | 'email';
  contenu: string;
  contenu_html?: string;
  date_creation?: string;
  date_envoi?: string;
  date_programmee?: string;
  statut: 'brouillon' | 'programme' | 'en_attente' | 'envoye' | 'echec';
  details_erreur?: string;
  est_message_groupe: boolean;
  classe?: number;
  sujet?: string;
  template?: number;
  est_lu?: boolean;
  date_lecture?: string;
  tracking_id?: string;
  attachments?: any[];
}

/**
 * Envoie un email à un parent
 * @param parentId ID du parent
 * @param subject Sujet de l'email
 * @param message Contenu de l'email
 * @returns Réponse de l'API
 */
export const sendEmail = async (
  parentId: number,
  subject: string,
  message: string
): Promise<MessageResponse> => {
  try {
    const response = await post<MessageResponse>(`/parents/${parentId}/send_email/`, {
      subject,
      message
    });
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

/**
 * Envoie un SMS à un parent
 * @param parentId ID du parent
 * @param message Contenu du SMS
 * @returns Réponse de l'API
 */
export const sendSMS = async (
  parentId: number,
  message: string
): Promise<MessageResponse> => {
  try {
    const response = await post<MessageResponse>(`/parents/${parentId}/send_sms/`, {
      message
    });
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    throw error;
  }
};

/**
 * Envoie un SMS à plusieurs parents
 * @param classId ID de la classe (optionnel)
 * @param subject Sujet du message (optionnel)
 * @param message Contenu du SMS
 * @param allParents Envoyer à tous les parents (true) ou seulement à ceux d'une classe (false)
 * @returns Réponse de l'API
 */
export const sendBulkSMS = async (
  message: string,
  subject: string = '',
  classId?: number,
  allParents: boolean = false
): Promise<MessageResponse> => {
  try {
    const payload = {
      type: 'sms',
      sujet: subject,
      contenu: message,
      classe_id: classId,
      tous_parents: allParents
    };

    const response = await post<MessageResponse>('/parents/send_bulk_sms/', payload);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi des SMS en masse:', error);
    throw error;
  }
};

/**
 * Envoie un email à plusieurs parents
 * @param subject Sujet de l'email
 * @param message Contenu de l'email
 * @param classId ID de la classe (optionnel)
 * @param allParents Envoyer à tous les parents (true) ou seulement à ceux d'une classe (false)
 * @returns Réponse de l'API
 */
export const sendBulkEmail = async (
  subject: string,
  message: string,
  classId?: number,
  allParents: boolean = false
): Promise<MessageResponse> => {
  try {
    const payload = {
      type: 'email',
      sujet: subject,
      contenu: message,
      classe_id: classId,
      tous_parents: allParents
    };

    const response = await post<MessageResponse>('/parents/send_bulk_email/', payload);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi des emails en masse:', error);
    throw error;
  }
};

/**
 * Récupère tous les messages
 */
export const fetchMessages = async (): Promise<Message[]> => {
  return await get<Message[]>('/messages/');
};

/**
 * Récupère un message par son ID
 */
export const fetchMessageById = async (id: number): Promise<Message> => {
  return await get<Message>(`/messages/${id}/`);
};

/**
 * Récupère les messages d'un parent
 */
export const fetchMessagesByParent = async (parentId: number): Promise<Message[]> => {
  return await get<Message[]>(`/messages/by_parent/?parent_id=${parentId}`);
};

/**
 * Récupère les messages d'une classe
 */
export const fetchMessagesByClass = async (classId: number): Promise<Message[]> => {
  return await get<Message[]>(`/messages/by_classe/?classe_id=${classId}`);
};

/**
 * Récupère les messages de groupe
 */
export const fetchBulkMessages = async (): Promise<Message[]> => {
  return await get<Message[]>('/messages/bulk_messages/');
};

/**
 * Crée un nouveau message
 */
export const createMessage = async (message: Message): Promise<Message> => {
  return await post<Message>('/messages/', message);
};

/**
 * Met à jour un message existant
 */
export const updateMessage = async (id: number, message: Message): Promise<Message> => {
  return await put<Message>(`/messages/${id}/`, message);
};

/**
 * Supprime un message
 */
export const deleteMessage = async (id: number): Promise<void> => {
  return await del(`/messages/${id}/`);
};

/**
 * Marque un message comme lu
 */
export const markMessageAsRead = async (id: number): Promise<MessageResponse> => {
  return await post<MessageResponse>(`/messages/${id}/mark_as_read/`, {});
};

/**
 * Envoie immédiatement un message programmé ou en brouillon
 */
export const sendMessageNow = async (id: number): Promise<MessageResponse> => {
  return await post<MessageResponse>(`/messages/${id}/send_now/`, {});
};

/**
 * Récupère les messages programmés
 */
export const fetchScheduledMessages = async (): Promise<Message[]> => {
  return await get<Message[]>('/messages/scheduled/');
};

/**
 * Traite les messages programmés dont la date d'envoi est passée
 */
export const processScheduledMessages = async (): Promise<MessageResponse> => {
  return await post<MessageResponse>('/messages/process_scheduled/', {});
};

/**
 * Envoie un message interne à un parent
 * @param parentId ID du parent
 * @param subject Sujet du message
 * @param message Contenu du message
 * @returns Réponse de l'API
 */
export const sendMessage = async (
  parentId: number,
  subject: string,
  message: string
): Promise<MessageResponse> => {
  try {
    const response = await post<MessageResponse>(`/messages/`, {
      parent: parentId,
      sujet: subject,
      contenu: message,
      type: 'message'
    });
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
};

/**
 * Envoie une notification d'absence à un parent
 * @param studentId ID de l'étudiant
 * @param parentId ID du parent
 * @param messageType Type de message ('email', 'sms', 'message')
 * @returns Réponse de l'API
 */
export const sendAbsenceNotification = async (
  studentId: number,
  parentId: number,
  messageType: 'email' | 'sms' | 'message'
): Promise<MessageResponse> => {
  try {
    // Créer un message approprié selon le type
    const subject = 'Alerte d\'absentéisme';
    const message = `Nous souhaitons vous informer que votre enfant présente un taux d'absentéisme élevé. Veuillez contacter l'établissement pour plus d'informations.`;

    // Envoyer le message selon le type
    if (messageType === 'email') {
      return await sendEmail(parentId, subject, message);
    } else if (messageType === 'sms') {
      return await sendSMS(parentId, message);
    } else {
      return await sendMessage(parentId, subject, message);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification d\'absence:', error);
    throw error;
  }
};

/**
 * Envoie une notification d'absence à tous les parents d'une classe
 * @param classId ID de la classe
 * @param messageType Type de message ('email', 'sms')
 * @returns Réponse de l'API
 */
export const sendBulkAbsenceNotification = async (
  classId: number,
  messageType: 'email' | 'sms'
): Promise<MessageResponse> => {
  try {
    const subject = 'Alerte d\'absentéisme';
    const message = `Nous souhaitons vous informer que votre enfant présente un taux d'absentéisme élevé. Veuillez contacter l'établissement pour plus d'informations.`;

    if (messageType === 'email') {
      return await sendBulkEmail(subject, message, classId);
    } else {
      return await sendBulkSMS(message, subject, classId);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications d\'absence en masse:', error);
    throw error;
  }
};
