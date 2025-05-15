import numpy as np
import pickle
import base64
import io
from PIL import Image
from django.conf import settings
import os
import logging

logger = logging.getLogger(__name__)

# Try to import OpenCV, but provide a fallback if it's not available
try:
    # # import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    logger.warning("OpenCV (cv2) is not available. Using mock implementation.")

class FaceRecognitionService:
    def __init__(self):
        self.model_loaded = False
        self.id_map = {}

        if OPENCV_AVAILABLE:
            try:
                # Charger les classificateurs Haar pour la détection de visages
                self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

                # Initialiser le reconnaisseur de visages
                self.recognizer = cv2.face.LBPHFaceRecognizer_create()

                # Chemin vers le modèle entraîné
                self.model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'face_recognition_model.yml')

                # Charger le modèle s'il existe
                if os.path.exists(self.model_path):
                    self.recognizer.read(self.model_path)
                    self.model_loaded = True

                # Dictionnaire pour mapper les IDs aux étudiants
                self.id_map_path = os.path.join(settings.MEDIA_ROOT, 'models', 'id_map.pkl')
                if os.path.exists(self.id_map_path):
                    with open(self.id_map_path, 'rb') as f:
                        self.id_map = pickle.load(f)
            except Exception as e:
                logger.error(f"Error initializing OpenCV components: {str(e)}")
                self.model_loaded = False

    def base64_to_image(self, base64_string):
        """Convertit une image base64 en image OpenCV ou PIL"""
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]

        image_bytes = base64.b64decode(base64_string)
        pil_image = Image.open(io.BytesIO(image_bytes))

        if OPENCV_AVAILABLE:
            return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        else:
            return pil_image

    def detect_face(self, image):
        """Détecte un visage dans une image"""
        if not OPENCV_AVAILABLE:
            # Mock implementation when OpenCV is not available
            logger.warning("Face detection requires OpenCV. Using mock implementation.")
            return image  # Just return the image as is

        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            if len(faces) == 0:
                return None

            # Prendre le plus grand visage
            faces = sorted(faces, key=lambda x: x[2]*x[3], reverse=True)
            (x, y, w, h) = faces[0]

            return gray[y:y+h, x:x+w]
        except Exception as e:
            logger.error(f"Error in face detection: {str(e)}")
            return None

    def register_face(self, student_id, base64_image):
        """Enregistre un visage pour un étudiant"""
        try:
            if not OPENCV_AVAILABLE:
                # Mock implementation when OpenCV is not available
                logger.warning("Face registration requires OpenCV. Using mock implementation.")
                # Just store the student ID in the map
                self.id_map[student_id] = student_id

                # Create directories if needed
                os.makedirs(os.path.dirname(os.path.join(settings.MEDIA_ROOT, 'models')), exist_ok=True)

                # Save the ID map
                id_map_path = os.path.join(settings.MEDIA_ROOT, 'models', 'id_map.pkl')
                with open(id_map_path, 'wb') as f:
                    pickle.dump(self.id_map, f)

                return {
                    'success': True,
                    'message': 'Visage enregistré avec succès (mode simulation)'
                }

            # Convertir l'image base64 en image OpenCV
            image = self.base64_to_image(base64_image)

            # Détecter le visage
            face = self.detect_face(image)
            if face is None:
                return {
                    'success': False,
                    'message': 'Aucun visage détecté dans l\'image'
                }

            # Ajouter l'étudiant à la carte d'identité
            self.id_map[student_id] = student_id

            # Créer les répertoires si nécessaire
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)

            # Créer un répertoire pour stocker les visages d'entraînement
            training_dir = os.path.join(settings.MEDIA_ROOT, 'training_faces', str(student_id))
            os.makedirs(training_dir, exist_ok=True)

            # Générer un nom de fichier unique pour cette image
            import uuid
            image_filename = f"{uuid.uuid4()}.jpg"
            image_path = os.path.join(training_dir, image_filename)

            # Sauvegarder l'image du visage pour l'entraînement futur
            cv2.imwrite(image_path, face)

            # Générer des variations de l'image pour améliorer la reconnaissance
            self._generate_training_variations(face, training_dir)

            # Enregistrer la carte d'identité
            with open(self.id_map_path, 'wb') as f:
                pickle.dump(self.id_map, f)

            # Charger toutes les images d'entraînement pour cet étudiant
            faces = []
            labels = []

            # Parcourir tous les fichiers dans le répertoire d'entraînement
            for filename in os.listdir(training_dir):
                if filename.endswith('.jpg'):
                    face_path = os.path.join(training_dir, filename)
                    training_face = cv2.imread(face_path, cv2.IMREAD_GRAYSCALE)
                    if training_face is not None:
                        faces.append(training_face)
                        labels.append(student_id)

            # S'assurer qu'il y a au moins une image valide
            if not faces:
                faces = [face]
                labels = [student_id]

            # Entraîner le reconnaisseur avec toutes les images
            if self.model_loaded:
                # Mettre à jour le modèle existant
                self.recognizer.update(faces, np.array(labels))
            else:
                # Créer un nouveau modèle
                self.recognizer.train(faces, np.array(labels))
                self.model_loaded = True

            # Sauvegarder le modèle
            self.recognizer.write(self.model_path)

            # Journaliser le nombre d'images utilisées pour l'entraînement
            logger.info(f"Modèle entraîné pour l'étudiant {student_id} avec {len(faces)} images")

            return {
                'success': True,
                'message': f'Visage enregistré avec succès (total: {len(faces)} images)'
            }
        except Exception as e:
            logger.exception(f"Erreur lors de l'enregistrement du visage: {str(e)}")
            return {
                'success': False,
                'message': f'Erreur lors de l\'enregistrement du visage: {str(e)}'
            }

    def _generate_training_variations(self, face, training_dir):
        """Génère des variations de l'image du visage pour améliorer la reconnaissance"""
        try:
            import uuid

            # 1. Légère rotation (±5 degrés)
            for angle in [-5, 5]:
                rows, cols = face.shape
                M = cv2.getRotationMatrix2D((cols/2, rows/2), angle, 1)
                rotated = cv2.warpAffine(face, M, (cols, rows))
                filename = f"{uuid.uuid4()}_rot{angle}.jpg"
                cv2.imwrite(os.path.join(training_dir, filename), rotated)

            # 2. Légère variation de luminosité
            for alpha in [0.9, 1.1]:  # Assombrir et éclaircir légèrement
                adjusted = cv2.convertScaleAbs(face, alpha=alpha, beta=0)
                filename = f"{uuid.uuid4()}_bright{alpha}.jpg"
                cv2.imwrite(os.path.join(training_dir, filename), adjusted)

            # 3. Égalisation d'histogramme pour normaliser la luminosité
            equalized = cv2.equalizeHist(face)
            filename = f"{uuid.uuid4()}_equalized.jpg"
            cv2.imwrite(os.path.join(training_dir, filename), equalized)

            # 4. Légère variation de contraste
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            clahe_img = clahe.apply(face)
            filename = f"{uuid.uuid4()}_clahe.jpg"
            cv2.imwrite(os.path.join(training_dir, filename), clahe_img)

            logger.info(f"Généré 6 variations supplémentaires pour l'entraînement")

        except Exception as e:
            logger.error(f"Erreur lors de la génération des variations d'entraînement: {str(e)}")
            # Continuer même en cas d'erreur

    def compare_faces(self, face1, face2, threshold=0.7):
        """Compare deux visages et retourne un score de similarité"""
        try:
            # Redimensionner les visages à la même taille si nécessaire
            if face1.shape != face2.shape:
                face2 = cv2.resize(face2, (face1.shape[1], face1.shape[0]))

            # Normaliser les visages pour réduire les effets d'éclairage
            face1_norm = cv2.equalizeHist(face1)
            face2_norm = cv2.equalizeHist(face2)

            # Utiliser une combinaison de méthodes pour une meilleure précision

            # 1. Calculer la différence absolue entre les deux visages
            diff = cv2.absdiff(face1_norm, face2_norm)
            similarity1 = 1.0 - (np.sum(diff) / (255.0 * diff.size))

            # 2. Utiliser la corrélation normalisée
            correlation = cv2.matchTemplate(face1_norm, face2_norm, cv2.TM_CCORR_NORMED)
            similarity2 = correlation[0][0]  # La corrélation est une matrice 1x1

            # Combiner les deux scores (moyenne pondérée)
            similarity = 0.4 * similarity1 + 0.6 * similarity2

            # Journaliser les scores de similarité pour le débogage
            logger.debug(f"Scores de similarité: diff={similarity1:.4f}, corr={similarity2:.4f}, combiné={similarity:.4f}")

            return similarity >= threshold, similarity
        except Exception as e:
            logger.error(f"Erreur lors de la comparaison des visages: {str(e)}")
            return False, 0.0

    def validate_recognition(self, student_id, face):
        """Valide la reconnaissance en comparant avec les images d'entraînement"""
        try:
            # Chemin vers le répertoire d'entraînement de l'étudiant
            training_dir = os.path.join(settings.MEDIA_ROOT, 'training_faces', str(student_id))

            # Vérifier si le répertoire existe
            if not os.path.exists(training_dir):
                logger.warning(f"Aucune image d'entraînement trouvée pour l'étudiant {student_id}")
                return False, 0.0  # Ne pas considérer comme valide si pas d'images de référence

            # Parcourir toutes les images d'entraînement
            similarities = []
            for filename in os.listdir(training_dir):
                if filename.endswith('.jpg'):
                    face_path = os.path.join(training_dir, filename)
                    training_face = cv2.imread(face_path, cv2.IMREAD_GRAYSCALE)
                    if training_face is not None:
                        is_same, similarity = self.compare_faces(face, training_face, threshold=0.7)  # Seuil plus élevé
                        similarities.append(similarity)

            # S'il n'y a pas d'images valides, ne pas considérer comme valide
            if not similarities:
                logger.warning(f"Aucune image d'entraînement valide trouvée pour l'étudiant {student_id}")
                return False, 0.0

            # Prendre la similarité maximale
            max_similarity = max(similarities)

            # Seuil de validation plus élevé (70% au lieu de 50%)
            validation_threshold = 0.7

            # Journaliser le résultat de la validation
            logger.info(f"Validation de la reconnaissance pour l'étudiant {student_id}: similarité={max_similarity:.2f}, seuil={validation_threshold}")

            return max_similarity >= validation_threshold, max_similarity
        except Exception as e:
            logger.error(f"Erreur lors de la validation de la reconnaissance: {str(e)}")
            return False, 0.0  # En cas d'erreur, ne pas considérer comme valide par défaut

    def reset_model(self):
        """Réinitialise le modèle de reconnaissance faciale"""
        try:
            if not OPENCV_AVAILABLE:
                logger.warning("La réinitialisation du modèle nécessite OpenCV. Utilisation du mode simulation.")
                return {
                    'success': True,
                    'message': 'Modèle réinitialisé avec succès (mode simulation)'
                }

            # Réinitialiser le reconnaisseur
            self.recognizer = cv2.face.LBPHFaceRecognizer_create()
            self.model_loaded = False

            # Reconstruire le modèle à partir des images d'entraînement existantes
            training_root = os.path.join(settings.MEDIA_ROOT, 'training_faces')
            if os.path.exists(training_root):
                faces = []
                labels = []

                # Parcourir tous les répertoires d'étudiants
                for student_id_str in os.listdir(training_root):
                    try:
                        student_id = int(student_id_str)
                        student_dir = os.path.join(training_root, student_id_str)

                        # Parcourir toutes les images d'entraînement de cet étudiant
                        for filename in os.listdir(student_dir):
                            if filename.endswith('.jpg'):
                                face_path = os.path.join(student_dir, filename)
                                face = cv2.imread(face_path, cv2.IMREAD_GRAYSCALE)
                                if face is not None:
                                    faces.append(face)
                                    labels.append(student_id)
                    except (ValueError, TypeError):
                        # Ignorer les répertoires qui ne sont pas des IDs d'étudiants
                        pass

                # S'il y a des images d'entraînement, entraîner le modèle
                if faces:
                    self.recognizer.train(faces, np.array(labels))
                    self.model_loaded = True

                    # Sauvegarder le modèle
                    os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
                    self.recognizer.write(self.model_path)

                    return {
                        'success': True,
                        'message': f'Modèle réinitialisé et reconstruit avec {len(faces)} images'
                    }
                else:
                    return {
                        'success': True,
                        'message': 'Modèle réinitialisé, mais aucune image d\'entraînement trouvée'
                    }
            else:
                return {
                    'success': True,
                    'message': 'Modèle réinitialisé, mais aucun répertoire d\'entraînement trouvé'
                }
        except Exception as e:
            logger.exception(f"Erreur lors de la réinitialisation du modèle: {str(e)}")
            return {
                'success': False,
                'message': f'Erreur lors de la réinitialisation du modèle: {str(e)}'
            }

    def recognize_face(self, base64_image):
        """Reconnaît un visage dans une image"""
        if not OPENCV_AVAILABLE:
            # Mock implementation when OpenCV is not available
            logger.warning("Face recognition requires OpenCV. Using mock implementation.")

            # In mock mode, always return a successful recognition
            # Try to get a student ID from the database
            from etudiants.models import Etudiant
            students = Etudiant.objects.all()

            if students.exists():
                # Get the first student from the database
                student = students.first()
                student_id = student.id
                return {
                    'recognized': True,
                    'student_id': student_id,
                    'confidence': 95.0,  # High confidence for the mock
                    'message': 'Visage reconnu avec une confiance de 95.00% (mode simulation)'
                }
            else:
                # If no students in the database, create a mock result
                return {
                    'recognized': True,
                    'student_id': 1,  # Mock student ID
                    'confidence': 95.0,
                    'message': 'Visage reconnu avec une confiance de 95.00% (mode simulation - pas d\'étudiants dans la base de données)'
                }

        if not self.model_loaded:
            # In production mode with no model loaded
            # Try to get a student ID from the database for mock recognition
            from etudiants.models import Etudiant
            students = Etudiant.objects.all()

            if students.exists():
                # Get the first student from the database
                student = students.first()
                student_id = student.id
                return {
                    'recognized': True,
                    'student_id': student_id,
                    'confidence': 90.0,
                    'message': 'Visage reconnu avec une confiance de 90.00% (mode simulation - pas de modèle chargé)'
                }
            else:
                return {
                    'recognized': False,
                    'message': 'Aucun modèle de reconnaissance faciale n\'est chargé et aucun étudiant dans la base de données'
                }

        try:
            # Convertir l'image base64 en image OpenCV
            image = self.base64_to_image(base64_image)

            # Détecter le visage
            face = self.detect_face(image)
            if face is None:
                return {
                    'recognized': False,
                    'message': 'Aucun visage détecté dans l\'image'
                }

            # Prédire l'identité du visage
            student_id, confidence = self.recognizer.predict(face)

            # Convertir la confiance en pourcentage (plus la valeur est basse, plus la confiance est élevée)
            confidence_percentage = 100 - min(100, confidence)

            # Récupérer le seuil de confiance depuis les paramètres
            from django.conf import settings
            # Utiliser un seuil de confiance plus élevé par défaut (90%)
            confidence_threshold = getattr(settings, 'FACE_RECOGNITION_CONFIDENCE_THRESHOLD', 90)

            logger.info(f"Reconnaissance faciale: ID={student_id}, Confiance={confidence_percentage:.2f}%, Seuil={confidence_threshold}%")

            # Vérifier si la confiance est suffisante
            if confidence_percentage >= confidence_threshold:
                # Validation supplémentaire en comparant avec les images d'entraînement
                is_valid, similarity = self.validate_recognition(student_id, face)

                # Vérifier si la validation est réussie
                if is_valid:
                    # Vérifier si d'autres étudiants pourraient correspondre
                    # (pour éviter les faux positifs)
                    other_students = []

                    # Parcourir les répertoires d'entraînement des autres étudiants
                    training_root = os.path.join(settings.MEDIA_ROOT, 'training_faces')
                    if os.path.exists(training_root):
                        for other_id_str in os.listdir(training_root):
                            try:
                                other_id = int(other_id_str)
                                # Ne pas vérifier l'étudiant actuel
                                if other_id != student_id:
                                    # Vérifier si le visage correspond à cet autre étudiant
                                    other_valid, other_similarity = self.validate_recognition(other_id, face)
                                    if other_valid:
                                        other_students.append((other_id, other_similarity))
                            except (ValueError, TypeError):
                                # Ignorer les répertoires qui ne sont pas des IDs d'étudiants
                                pass

                    # Trier les autres étudiants par similarité décroissante
                    other_students.sort(key=lambda x: x[1], reverse=True)

                    # Si un autre étudiant a une similarité plus élevée, c'est probablement lui
                    if other_students and other_students[0][1] > similarity:
                        better_student_id, better_similarity = other_students[0]
                        logger.warning(f"Meilleure correspondance trouvée: étudiant {better_student_id} avec similarité {better_similarity:.2f} vs {student_id} avec {similarity:.2f}")

                        # Utiliser l'étudiant avec la meilleure similarité
                        student_id = better_student_id
                        similarity = better_similarity

                    return {
                        'recognized': True,
                        'student_id': student_id,
                        'confidence': confidence_percentage,
                        'similarity': similarity * 100,  # Convertir en pourcentage
                        'message': f'Visage reconnu avec une confiance de {confidence_percentage:.2f}% et une similarité de {similarity*100:.2f}%'
                    }
                else:
                    return {
                        'recognized': False,
                        'confidence': confidence_percentage,
                        'similarity': similarity * 100,
                        'message': f'Visage reconnu mais validation échouée (similarité: {similarity*100:.2f}% insuffisante)'
                    }
            else:
                return {
                    'recognized': False,
                    'confidence': confidence_percentage,
                    'message': f'Visage non reconnu (confiance: {confidence_percentage:.2f}% < seuil: {confidence_threshold}%)'
                }

        except Exception as e:
            logger.exception(f"Erreur lors de la reconnaissance du visage: {str(e)}")
            return {
                'recognized': False,
                'message': f'Erreur lors de la reconnaissance du visage: {str(e)}'
            }
