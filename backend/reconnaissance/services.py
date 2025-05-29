import face_recognition
import numpy as np
import pickle
import base64
import io
from PIL import Image
from django.conf import settings
import os
import logging

logger = logging.getLogger(__name__)


class FaceRecognitionService:
    def __init__(self):
        self.model_loaded = False
        self.id_map = {}

        # Paths for model files
        self.model_path = os.path.join(settings.MEDIA_ROOT, 'models', 'face_encodings.pkl')
        self.id_map_path = os.path.join(settings.MEDIA_ROOT, 'models', 'id_map.pkl')

        # Load model if it exists
        if os.path.exists(self.model_path):
            with open(self.model_path, 'rb') as f:
                self.face_encodings = pickle.load(f)
            self.model_loaded = True
        else:
            self.face_encodings = []

        # Load ID map if it exists
        if os.path.exists(self.id_map_path):
            with open(self.id_map_path, 'rb') as f:
                self.id_map = pickle.load(f)

    def base64_to_image(self, base64_string):
        """Convert base64 string to PIL image"""
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        image_bytes = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(image_bytes))

    def image_mem_to_np(self, image_mem):
        """Convert Django InMemoryUploadedFile to numpy array"""
        image_mem.seek(0)
        pil_image = Image.open(io.BytesIO(image_mem.read()))
        return np.array(pil_image)

    def register_face(self, student_id, base64_image):
        """Register a student's face"""
        try:
            pil_image = self.base64_to_image(base64_image)
            image_np = np.array(pil_image)

            encodings = face_recognition.face_encodings(image_np)
            if not encodings:
                return {'success': False, 'message': 'No face detected in the image'}

            encoding = encodings[0]

            self.id_map[student_id] = student_id
            self.face_encodings.append((student_id, encoding))

            # Save updated model
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.face_encodings, f)
            with open(self.id_map_path, 'wb') as f:
                pickle.dump(self.id_map, f)

            return {'success': True, 'message': 'Face registered successfully'}

        except Exception as e:
            logger.exception(f"Error registering face: {str(e)}")
            return {'success': False, 'message': f'Error registering face: {str(e)}'}

    def recognize_face(self, base64_image, threshold=0.6):
        """Recognize a face using registered data"""
        try:
            if not self.model_loaded:
                return {'recognized': False, 'message': 'No face recognition model loaded'}

            pil_image = self.base64_to_image(base64_image)
            image_np = np.array(pil_image)

            encodings = face_recognition.face_encodings(image_np)
            if not encodings:
                return {'recognized': False, 'message': 'No face detected in the image'}

            encoding = encodings[0]

            known_encodings = [item[1] for item in self.face_encodings]
            matches = face_recognition.compare_faces(known_encodings, encoding, tolerance=threshold)
            distances = face_recognition.face_distance(known_encodings, encoding)

            if not any(matches):
                return {'recognized': False, 'message': 'Face not recognized'}

            best_match_index = np.argmin(distances)
            student_id = self.face_encodings[best_match_index][0]
            confidence = (1 - distances[best_match_index]) * 100

            return {
                'recognized': True,
                'student_id': student_id,
                'confidence': confidence,
                'message': f'Face recognized with {confidence:.2f}% confidence'
            }

        except Exception as e:
            logger.exception(f"Error recognizing face: {str(e)}")
            return {'recognized': False, 'message': f'Error recognizing face: {str(e)}'}

    def reset_model(self):
        """Reset the model and delete all stored face data"""
        try:
            self.face_encodings = []
            self.id_map = {}
            self.model_loaded = False

            if os.path.exists(self.model_path):
                os.remove(self.model_path)
            if os.path.exists(self.id_map_path):
                os.remove(self.id_map_path)

            return {'success': True, 'message': 'Model reset successfully'}

        except Exception as e:
            logger.exception(f"Error resetting model: {str(e)}")
            return {'success': False, 'message': f'Error resetting model: {str(e)}'}
