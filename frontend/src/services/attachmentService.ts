/**
 * Service pour la gestion des pièces jointes des messages
 */
import { get, post, del } from './apiService';

/**
 * Types pour les pièces jointes
 */
export interface MessageAttachment {
  id?: number;
  message: number;
  fichier: string;
  nom_fichier: string;
  type_mime: string;
  taille: number;
  date_ajout?: string;
}

/**
 * Fonction pour ajouter une pièce jointe à un message
 * @param messageId ID du message
 * @param file Fichier à joindre
 * @param fileName Nom du fichier (optionnel, par défaut le nom du fichier)
 */
export const addAttachment = async (
  messageId: number,
  file: File,
  fileName?: string
): Promise<MessageAttachment> => {
  const formData = new FormData();
  formData.append('message_id', messageId.toString());
  formData.append('fichier', file);
  if (fileName) {
    formData.append('nom_fichier', fileName);
  }

  // Utiliser fetch directement pour envoyer le FormData
  const response = await fetch(`/api/messages/${messageId}/add_attachment/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de l'ajout de la pièce jointe: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Fonction pour récupérer les pièces jointes d'un message
 */
export const getMessageAttachments = async (messageId: number): Promise<MessageAttachment[]> => {
  return await get<MessageAttachment[]>(`/messages/${messageId}/attachments/`);
};

/**
 * Fonction pour supprimer une pièce jointe
 */
export const deleteAttachment = async (attachmentId: number): Promise<void> => {
  return await del(`/attachments/${attachmentId}/`);
};
