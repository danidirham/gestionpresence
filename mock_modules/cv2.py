
# Mock module for cv2
class CascadeClassifier:
    def __init__(self, *args, **kwargs):
        pass

    def detectMultiScale(self, *args, **kwargs):
        return []

class face:
    @staticmethod
    def LBPHFaceRecognizer_create():
        return FaceRecognizer()

class FaceRecognizer:
    def __init__(self):
        pass

    def read(self, *args, **kwargs):
        pass

    def write(self, *args, **kwargs):
        pass

    def train(self, *args, **kwargs):
        pass

    def update(self, *args, **kwargs):
        pass

    def predict(self, *args, **kwargs):
        return 0, 0

# Mock data
data = type('obj', (object,), {
    'haarcascades': 'mock_cascades/'
})
