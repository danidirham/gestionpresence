import numpy as np
import base64
import io
from PIL import Image
import logging

logger = logging.getLogger(__name__)

# Try to import OpenCV, but provide a fallback if it's not available
try:
    # # # # # # # # # # # # # # # # import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    logger.warning("OpenCV (cv2) is not available. Using mock implementation.")

def base64_to_image(base64_string):
    """Convertit une image base64 en image OpenCV ou PIL"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]

    image_bytes = base64.b64decode(base64_string)
    pil_image = Image.open(io.BytesIO(image_bytes))

    if OPENCV_AVAILABLE:
        return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    else:
        return pil_image

def image_to_base64(image):
    """Convertit une image OpenCV ou PIL en base64"""
    if not OPENCV_AVAILABLE:
        # Handle PIL image
        buffer = io.BytesIO()
        if isinstance(image, Image.Image):
            image.save(buffer, format="JPEG")
            image_bytes = buffer.getvalue()
        else:
            # If it's not a PIL image and OpenCV is not available, return None
            return None
    else:
        # Handle OpenCV image
        success, buffer = cv2.imencode('.jpg', image)
        if not success:
            return None
        image_bytes = buffer.tobytes()

    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_string}"

def detect_faces(image):
    """Détecte les visages dans une image"""
    if not OPENCV_AVAILABLE:
        logger.warning("Face detection requires OpenCV. Using mock implementation.")
        # Return a mock face detection result
        return [(0, 0, 100, 100)]  # Mock face coordinates

    try:
        # Charger le classificateur Haar pour la détection de visages
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

        # Convertir l'image en niveaux de gris
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Détecter les visages
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        return faces
    except Exception as e:
        logger.error(f"Error in face detection: {str(e)}")
        return []

def draw_faces(image, faces):
    """Dessine des rectangles autour des visages détectés"""
    if not OPENCV_AVAILABLE:
        logger.warning("Drawing faces requires OpenCV. Using mock implementation.")
        # Return the original image if OpenCV is not available
        return image

    try:
        image_with_faces = image.copy()

        for (x, y, w, h) in faces:
            cv2.rectangle(image_with_faces, (x, y), (x+w, y+h), (0, 255, 0), 2)

        return image_with_faces
    except Exception as e:
        logger.error(f"Error in drawing faces: {str(e)}")
        return image

def preprocess_face(image, face):
    """Prétraite un visage pour la reconnaissance faciale"""
    if not OPENCV_AVAILABLE:
        logger.warning("Face preprocessing requires OpenCV. Using mock implementation.")
        # Return the original image if OpenCV is not available
        return image

    try:
        x, y, w, h = face

        # Extraire le visage
        face_img = image[y:y+h, x:x+w]

        # Convertir en niveaux de gris
        gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)

        # Redimensionner à une taille standard
        resized = cv2.resize(gray, (100, 100))

        # Égalisation d'histogramme pour améliorer le contraste
        equalized = cv2.equalizeHist(resized)

        return equalized
    except Exception as e:
        logger.error(f"Error in face preprocessing: {str(e)}")
        return image
