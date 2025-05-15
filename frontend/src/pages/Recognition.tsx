import { useState, useEffect, useRef } from 'react'
import {
  Camera,
  Video,
  VideoOff,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Users,
  History,
  Loader2,
  LogIn,
  LogOut
} from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../components/layout/DashboardLayout'
import { recognizeFace, fetchRecentPresences, RecognitionResult, PresenceRecord } from '../services/recognitionService'
import { speak, generateWelcomeMessage, generateGoodbyeMessage, isSpeechSynthesisAvailable } from '../services/speechService'

const Recognition = () => {
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentHistory, setRecentHistory] = useState<Array<{
    name: string;
    time: string;
    photo?: string;
    class?: string;
    mode?: 'arrivee' | 'depart';
  }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [mode, setMode] = useState<'arrivee' | 'depart'>('arrivee'); // Mode de pointage (arrivée par défaut)
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true); // Activation de la synthèse vocale
  const [isSpeechAvailable, setIsSpeechAvailable] = useState<boolean>(false); // Disponibilité de la synthèse vocale
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      setRecognitionResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      setIsActive(true);

      // Attendre que la vidéo soit chargée avant de démarrer la reconnaissance
      videoRef.current?.addEventListener('loadeddata', () => {
        // Attendre un court délai pour que la caméra se stabilise
        setTimeout(() => {
          startRecognitionProcess();
        }, 1500);
      });
    } catch (err) {
      console.error('Erreur lors de l\'accès à la caméra:', err);
      setError('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setIsProcessing(false);
    setRecognitionResult(null);
  };

  const startRecognitionProcess = async () => {
    // Commencer le traitement
    setIsProcessing(true);
    setError(null);

    try {
      // Capturer l'image de la caméra
      if (!videoRef.current || !streamRef.current) {
        throw new Error('La caméra n\'est pas active');
      }

      // Créer un canvas temporaire pour capturer l'image
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Impossible de créer le contexte canvas');
      }

      // Dessiner l'image de la vidéo sur le canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convertir le canvas en base64
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      try {
        // Envoyer l'image pour reconnaissance avec le mode actuel
        const result = await recognizeFace(imageData, mode);

        console.log('Résultat de la reconnaissance:', result, 'Mode:', mode);

        // Mettre à jour le résultat
        setRecognitionResult(result);

        // Si la reconnaissance a réussi, ajouter à l'historique
        if (result.recognized && result.student) {
          const studentName = `${result.student.prenom} ${result.student.nom}`;
          const studentClass = result.student.classe_nom || '';
          const studentPhoto = result.student.photo || '';

          // Ajouter au début de l'historique
          setRecentHistory(prev => [
            {
              name: studentName,
              time: result.timestamp || new Date().toLocaleTimeString('fr-FR'),
              photo: studentPhoto,
              class: studentClass,
              mode: result.mode || mode
            },
            ...prev.slice(0, 2) // Garder seulement les 3 derniers
          ]);

          // Afficher une notification avec le mode et le statut
          const actionText = result.mode === 'depart' ? 'Départ' : 'Arrivée';

          if (result.already_present) {
            // Notification d'avertissement si déjà pointé
            toast.warning(`${studentName} a déjà pointé son ${actionText.toLowerCase()} aujourd'hui`);
          } else {
            // Notification de succès
            toast.success(`${actionText} enregistré(e) pour ${studentName}`);
          }

          // Synthèse vocale si activée
          if (speechEnabled && isSpeechAvailable) {
            try {
              let speechMessage = '';

              if (result.already_present) {
                // Message pour un pointage déjà effectué
                speechMessage = result.mode === 'depart'
                  ? `${studentName}, vous avez déjà pointé votre départ aujourd'hui.`
                  : `${studentName}, vous avez déjà pointé votre arrivée aujourd'hui.`;
              } else {
                // Message de bienvenue ou au revoir normal
                speechMessage = result.mode === 'depart'
                  ? generateGoodbyeMessage(studentName)
                  : generateWelcomeMessage(studentName);
              }

              // Prononcer le message
              speak(speechMessage);
            } catch (err) {
              console.error('Erreur lors de la synthèse vocale:', err);
            }
          }
        } else {
          // Afficher une notification d'erreur
          toast.error(result.message || 'Échec de la reconnaissance faciale');
        }
      } catch (apiError) {
        console.error('Erreur lors de l\'appel à l\'API de reconnaissance:', apiError);

        // Vérifier si c'est une erreur de connexion au serveur
        if (apiError instanceof Error &&
            (apiError.message.includes('Failed to fetch') ||
             apiError.message.includes('Connection refused') ||
             apiError.message.includes('Erreur de connexion au serveur'))) {

          setError('Impossible de se connecter au serveur. Veuillez vérifier que le serveur backend est en cours d\'exécution.');

          toast.error('Impossible de se connecter au serveur. Veuillez vérifier que le serveur backend est en cours d\'exécution.', {
            duration: 5000,
            position: 'top-center'
          });
        } else {
          // Pour les autres types d'erreurs
          setError(apiError instanceof Error ? apiError.message : 'Erreur inconnue lors de la reconnaissance faciale');
          toast.error('Erreur lors de la reconnaissance faciale');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la reconnaissance faciale:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue lors de la reconnaissance faciale');
      toast.error('Erreur lors de la reconnaissance faciale');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour charger l'historique des présences récentes
  const loadRecentHistory = async () => {
    try {
      setIsLoadingHistory(true);

      // Vérifier si le serveur backend est accessible
      try {
        const recentPresences = await fetchRecentPresences(5);

        // Vérifier si nous avons des présences
        if (recentPresences.length === 0) {
          console.log('Aucune présence récente trouvée');
          setRecentHistory([]);
          return;
        }

        // Convertir les présences en format d'historique
        const historyItems = recentPresences.map(presence => {
          // Vérifier si les données nécessaires existent
          if (!presence) return null;

          try {
            return {
              name: `${presence.etudiant_prenom || ''} ${presence.etudiant_nom || ''}`,
              time: `${new Date(presence.date).toLocaleDateString('fr-FR')}, ${presence.heure_arrivee || 'N/A'}`,
              photo: presence.etudiant_photo,
              class: presence.classe_nom,
              mode: presence.heure_depart ? 'depart' : 'arrivee' // Déterminer le mode en fonction de la présence d'une heure de départ
            };
          } catch (error) {
            console.error('Erreur lors de la conversion d\'une présence:', error, presence);
            return null;
          }
        }).filter(item => item !== null); // Filtrer les éléments null

        setRecentHistory(historyItems);
      } catch (fetchError) {
        console.error('Erreur lors de la récupération des présences:', fetchError);

        // Vérifier si c'est une erreur de connexion
        if (fetchError instanceof Error &&
            (fetchError.message.includes('Failed to fetch') ||
             fetchError.message.includes('Connection refused') ||
             fetchError.message.includes('Erreur de connexion au serveur'))) {

          // Afficher un message d'erreur plus spécifique
          toast.error('Impossible de se connecter au serveur. Veuillez vérifier que le serveur backend est en cours d\'exécution.', {
            duration: 5000,
            position: 'top-center'
          });

          // Définir un historique vide
          setRecentHistory([]);
        } else {
          // Pour les autres types d'erreurs
          toast.error('Impossible de charger l\'historique des présences');
          setRecentHistory([]);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      toast.error('Impossible de charger l\'historique des présences');
      // En cas d'erreur, définir un historique vide
      setRecentHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Charger l'historique au chargement de la page
  useEffect(() => {
    loadRecentHistory();
  }, []);

  // Vérifier la disponibilité de la synthèse vocale
  useEffect(() => {
    setIsSpeechAvailable(isSpeechSynthesisAvailable());
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <DashboardLayout title="Reconnaissance Faciale">
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <Camera className="mr-2 text-blue-600 dark:text-blue-400" size={22} />
                  Reconnaissance Faciale
                </h2>
                <div className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                  {isActive ? 'Caméra active' : 'Caméra inactive'}
                </div>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden aspect-video m-6 shadow-inner">
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 text-center">
                    <AlertCircle size={40} className="mb-2" />
                    <div className="font-medium">{error}</div>
                  </div>
                )}

                {!isActive && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    <Video size={48} className="mb-3 text-gray-400 dark:text-gray-500" />
                    <div className="font-medium">Cliquez sur "Démarrer" pour activer la caméra</div>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`}
                ></video>

                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
                      <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mr-2" size={24} />
                      <span className="font-medium text-gray-900 dark:text-white">Analyse en cours...</span>
                    </div>
                  </div>
                )}

                {recognitionResult && !isProcessing && recognitionResult.recognized && recognitionResult.student && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-4">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-400 mr-2" size={20} />
                      <div>
                        <div className="font-bold text-lg">{recognitionResult.student.prenom} {recognitionResult.student.nom}</div>
                        <div className="flex items-center text-sm">
                          <Users className="mr-1" size={14} />
                          Classe: {recognitionResult.student.classe_nom}
                        </div>
                        {recognitionResult.confidence && (
                          <div className="text-xs text-green-300">
                            Confiance: {recognitionResult.confidence.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {recognitionResult && !isProcessing && !recognitionResult.recognized && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-900 to-transparent text-white p-4">
                    <div className="flex items-center">
                      <AlertCircle className="text-red-400 mr-2" size={20} />
                      <div>
                        <div className="font-bold text-lg">Non reconnu</div>
                        <div className="text-sm">{recognitionResult.message}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sélecteur de mode (arrivée/départ) */}
              <div className="flex justify-center p-6 pb-2">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setMode('arrivee')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg flex items-center ${
                      mode === 'arrivee'
                        ? 'bg-blue-600 text-white dark:bg-blue-700 dark:text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600'
                    }`}
                    disabled={isProcessing}
                  >
                    <LogIn className="mr-2" size={16} />
                    Arrivée
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('depart')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-lg flex items-center ${
                      mode === 'depart'
                        ? 'bg-blue-600 text-white dark:bg-blue-700 dark:text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600'
                    }`}
                    disabled={isProcessing}
                  >
                    <LogOut className="mr-2" size={16} />
                    Départ
                  </button>
                </div>
              </div>

              {/* Boutons de contrôle de la caméra */}
              <div className="flex flex-col items-center p-6 pt-0">
                <div className="flex justify-center space-x-4 mb-4">
                  {!isActive ? (
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md flex items-center"
                    >
                      <Video className="mr-2" size={18} />
                      Démarrer la caméra
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="px-6 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-md flex items-center"
                      disabled={isProcessing}
                    >
                      <VideoOff className="mr-2" size={18} />
                      Arrêter la caméra
                    </button>
                  )}
                </div>

                {/* Interrupteur pour la synthèse vocale */}
                {isSpeechAvailable && (
                  <div className="flex items-center mt-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={speechEnabled}
                        onChange={() => setSpeechEnabled(!speechEnabled)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                        Synthèse vocale
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <BarChart3 className="mr-2 text-blue-600 dark:text-blue-400" size={22} />
                  Résultat
                </h2>
                {recognitionResult && (
                  <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <CheckCircle size={14} className="mr-1" />
                    Présence enregistrée
                  </div>
                )}
              </div>

              <div className="p-6">
                {recognitionResult ? (
                  <div className="space-y-6">
                    {recognitionResult.already_present ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded-r-md">
                        <div className="flex items-center">
                          <AlertCircle className="text-yellow-600 dark:text-yellow-400 mr-2" size={20} />
                          <div>
                            <div className="text-yellow-800 dark:text-yellow-300 font-semibold">
                              {recognitionResult.mode === 'depart' ? 'Départ déjà enregistré' : 'Arrivée déjà enregistrée'}
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                              {recognitionResult.message}
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center mt-1">
                              <Clock size={14} className="mr-1" />
                              {recognitionResult.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 dark:border-green-600 p-4 rounded-r-md">
                        <div className="flex items-center">
                          <CheckCircle className="text-green-600 dark:text-green-400 mr-2" size={20} />
                          <div>
                            <div className="text-green-800 dark:text-green-300 font-semibold">
                              {recognitionResult.mode === 'depart' ? 'Départ enregistré avec succès !' : 'Arrivée enregistrée avec succès !'}
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                              {recognitionResult.message}
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-400 flex items-center mt-1">
                              <Clock size={14} className="mr-1" />
                              {recognitionResult.timestamp}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                    <AlertCircle size={40} className="text-gray-400 dark:text-gray-500 mb-3" />
                    <div className="font-medium">Aucune reconnaissance en cours</div>
                    <p className="text-sm mt-2 max-w-md">
                      Démarrez la caméra et positionnez un étudiant devant celle-ci pour lancer la reconnaissance faciale.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden mt-6">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <History className="mr-2 text-blue-600 dark:text-blue-400" size={22} />
                  Historique récent
                </h2>
                <button
                  onClick={loadRecentHistory}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs flex items-center"
                >
                  <Loader2 className={`mr-1 ${isLoadingHistory ? 'animate-spin' : 'hidden'}`} size={12} />
                  Rafraîchir
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="animate-spin text-blue-500 dark:text-blue-400" size={24} />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Chargement de l'historique...</span>
                </div>
              ) : recentHistory.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentHistory.map((entry, index) => (
                    <div key={index} className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 overflow-hidden">
                        {entry.photo ? (
                          <img
                            src={entry.photo.startsWith('http') ? entry.photo : `${process.env.REACT_APP_API_URL}${entry.photo}`}
                            alt={entry.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '';
                              e.currentTarget.onerror = null;
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="h-full w-full flex items-center justify-center text-blue-500 dark:text-blue-300 font-bold">${entry.name.split(' ').map(n => n[0]).join('')}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-blue-500 dark:text-blue-300 font-bold">
                            {entry.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-grow">
                        <div className="text-sm font-medium text-gray-800 dark:text-white">{entry.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {entry.time}
                        </div>
                        {entry.class && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Users size={10} className="mr-1" />
                            {entry.class}
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
                        entry.mode === 'depart'
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                      }`}>
                        {entry.mode === 'depart' ? (
                          <>
                            <LogOut size={10} className="mr-1" />
                            Départ
                          </>
                        ) : (
                          <>
                            <LogIn size={10} className="mr-1" />
                            Arrivée
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                  <AlertCircle size={40} className="text-gray-400 dark:text-gray-500 mb-3" />
                  <div className="font-medium">Aucune présence enregistrée</div>
                  <p className="text-sm mt-2 max-w-md">
                    Les présences enregistrées apparaîtront ici.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Recognition;
