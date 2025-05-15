/**
 * Service pour la gestion des parents
 * Ce service gère les appels API liés aux parents
 */

import { get, post, put, del } from './apiService';

// Types pour les parents
export interface Parent {
  id?: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  relation: string;
  notifications_sms: boolean;
  notifications_email: boolean;
  etudiant: number;
}

/**
 * Fonction pour récupérer la liste des parents
 */
export const fetchParents = async (): Promise<Parent[]> => {
  return await get<Parent[]>('/parents/');
};

/**
 * Fonction pour récupérer un parent par son ID
 */
export const fetchParentById = async (id: number): Promise<Parent> => {
  return await get<Parent>(`/parents/${id}/`);
};

/**
 * Fonction pour récupérer les parents d'un étudiant
 */
export const fetchParentsByStudent = async (studentId: number): Promise<Parent[]> => {
  return await get<Parent[]>(`/etudiants/${studentId}/parents/`);
};

/**
 * Fonction pour créer un parent
 */
export const createParent = async (parent: Parent): Promise<Parent> => {
  return await post<Parent>('/parents/', parent);
};

/**
 * Fonction pour mettre à jour un parent
 */
export const updateParent = async (id: number, parent: Parent): Promise<Parent> => {
  return await put<Parent>(`/parents/${id}/`, parent);
};

/**
 * Fonction pour supprimer un parent
 */
export const deleteParent = async (id: number): Promise<void> => {
  return await del(`/parents/${id}/`);
};
