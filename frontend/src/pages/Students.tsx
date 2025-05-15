import { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  Trash2,
  UserPlus,
  Search,
  Check,
  X,
  Camera,
  RefreshCw,
  User,
  Calendar,
  Phone,
  BookOpen,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  fetchStudents,
  fetchClasses,
  createStudent,
  updateStudent,
  deleteStudent,
  registerStudentFace,
  Student,
  Classe
} from '../services/studentService';
import { isDemoMode } from '../utils/authUtils';
import { formatDate, ensureISODate } from '../utils/dateUtils';

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // État pour le formulaire d'ajout d'étudiant
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'M',
    contact_parent: '',
    photo: '',
    donnees_biometriques: '',
    statut: 'actif',
    classe: 1,
    // Informations du parent
    parent_nom: '',
    parent_prenom: '',
    parent_telephone: '',
    parent_email: '',
    parent_relation: 'pere', // pere, mere, tuteur
    notifications_sms: true,
    notifications_email: false
  });

  // État pour les onglets du formulaire
  const [activeTab, setActiveTab] = useState('infos'); // infos, photo, parent

  // État pour la capture de photo
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Gérer les changements dans les checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // Fonction pour démarrer la caméra
  const startCamera = async () => {
    try {
      setPhotoError(null);
      setCameraLoading(true); // Indiquer que la caméra est en cours de chargement
      console.log('Tentative d\'accès à la caméra...');

      // Vérifier si navigator.mediaDevices est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La fonctionnalité getUserMedia n\'est pas prise en charge par votre navigateur');
      }

      // Activer l'affichage de la caméra avant d'accéder au flux
      // Cela garantit que l'élément vidéo est rendu dans le DOM
      setShowCamera(true);

      // Attendre un court instant pour que le DOM soit mis à jour
      await new Promise(resolve => setTimeout(resolve, 100));

      // Vérifier si la référence vidéo existe après le rendu
      if (!videoRef.current) {
        throw new Error('Référence vidéo non disponible. Veuillez rafraîchir la page et réessayer.');
      }

      // Demander l'accès à la caméra avec des contraintes plus souples
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Accès à la caméra accordé, configuration du flux vidéo...');

      // Assigner le flux à l'élément vidéo
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      // Ajouter un gestionnaire d'événements pour s'assurer que la vidéo est chargée
      videoRef.current.onloadedmetadata = () => {
        console.log('Métadonnées vidéo chargées, lecture démarrée');
        if (videoRef.current) {
          videoRef.current.play().catch(e => {
            console.error('Erreur lors de la lecture de la vidéo:', e);
            setPhotoError('Erreur lors de la lecture du flux vidéo. Veuillez réessayer.');
            setCameraLoading(false);
          });
        }
        setCameraLoading(false); // Fin du chargement une fois que les métadonnées sont chargées
      };

      console.log('Caméra activée avec succès');

      // Afficher un toast pour informer l'utilisateur
      toast.success('Caméra activée avec succès');

    } catch (err) {
      console.error('Erreur détaillée lors de l\'accès à la caméra:', err);
      setCameraLoading(false); // Arrêter l'indicateur de chargement en cas d'erreur

      // Message d'erreur plus détaillé
      let errorMessage = 'Impossible d\'accéder à la caméra. ';

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage += 'L\'accès à la caméra a été refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
        } else if (err.name === 'NotFoundError') {
          errorMessage += 'Aucune caméra n\'a été détectée sur votre appareil.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage += 'La caméra est peut-être utilisée par une autre application.';
        } else {
          errorMessage += `Erreur: ${err.message}`;
        }
      } else {
        errorMessage += 'Veuillez vérifier les permissions et réessayer.';
      }

      setPhotoError(errorMessage);
      toast.error(errorMessage);

      // En cas d'erreur, s'assurer que l'interface est réinitialisée
      setShowCamera(false);
    }
  };

  // Fonction pour arrêter la caméra
  const stopCamera = () => {
    console.log('Arrêt de la caméra...');

    // Arrêter tous les tracks du stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`Arrêt du track: ${track.kind}`);
        track.stop();
      });
      streamRef.current = null;
    }

    // Nettoyer la référence vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setShowCamera(false);
    console.log('Caméra arrêtée avec succès');
  };

  // Fonction pour capturer une photo
  const capturePhoto = () => {
    try {
      console.log('Tentative de capture de photo...');

      // Vérifier si les références sont disponibles
      if (!videoRef.current) {
        throw new Error('Référence vidéo non disponible. Veuillez redémarrer la caméra.');
      }

      if (!canvasRef.current) {
        throw new Error('Référence canvas non disponible. Veuillez rafraîchir la page.');
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Vérifier si la vidéo a un flux
      if (!video.srcObject) {
        throw new Error('Aucun flux vidéo disponible. Veuillez redémarrer la caméra.');
      }

      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Impossible d\'obtenir le contexte 2D du canvas');
      }

      // Vérifier si la vidéo est en cours de lecture
      if (video.readyState !== 4) {
        console.warn('La vidéo n\'est pas complètement chargée, tentative de capture quand même...');
      }

      // Définir les dimensions du canvas pour correspondre à la vidéo
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;

      console.log(`Dimensions de la vidéo: ${videoWidth}x${videoHeight}`);

      // S'assurer que le canvas a les bonnes dimensions
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      console.log(`Dimensions du canvas: ${canvas.width}x${canvas.height}`);

      // Dessiner l'image de la vidéo sur le canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir le canvas en URL de données
      const photoUrl = canvas.toDataURL('image/jpeg', 0.9); // Qualité 90%

      if (!photoUrl || photoUrl === 'data:,') {
        throw new Error('Échec de la capture de photo. L\'image est vide.');
      }

      setCapturedPhoto(photoUrl);
      console.log('Photo capturée avec succès');

      // Mettre à jour le formData avec la photo
      setFormData({
        ...formData,
        photo: photoUrl
      });

      // Afficher un toast de succès
      toast.success('Photo capturée avec succès');

      // Arrêter la caméra
      stopCamera();

    } catch (err) {
      console.error('Erreur lors de la capture de photo:', err);
      let errorMessage = 'Erreur lors de la capture de photo. ';

      if (err instanceof Error) {
        errorMessage += err.message;
      }

      setPhotoError(errorMessage);
      toast.error(errorMessage);

      // En cas d'erreur grave, arrêter la caméra et réinitialiser
      if (err instanceof Error &&
          (err.message.includes('vidéo non disponible') ||
           err.message.includes('flux vidéo'))) {
        stopCamera();
      }
    }
  };

  // Fonction pour réinitialiser la photo
  const resetPhoto = () => {
    setCapturedPhoto(null);
    setFormData({
      ...formData,
      photo: ''
    });
  };

  // Fonction pour ouvrir le modal de modification
  const handleEditStudent = (student: Student) => {
    setCurrentStudent(student);

    // Initialiser le formulaire avec les données de l'étudiant
    // S'assurer que toutes les valeurs sont définies (jamais undefined)
    setFormData({
      nom: student.nom || '',
      prenom: student.prenom || '',
      date_naissance: ensureISODate(student.date_naissance) || '', // Ensure ISO format for date input
      sexe: student.sexe || 'M',
      contact_parent: student.contact_parent || '',
      photo: student.photo || '',
      donnees_biometriques: student.donnees_biometriques || '',
      statut: student.statut || 'actif',
      classe: student.classe || 1,
      // Informations du parent (à compléter si nécessaire)
      parent_nom: '',
      parent_prenom: '',
      parent_telephone: '',
      parent_email: '',
      parent_relation: 'pere',
      notifications_sms: true,
      notifications_email: false
    });

    // Si l'étudiant a une photo, la définir comme photo capturée
    if (student.photo) {
      setCapturedPhoto(student.photo);
    } else {
      setCapturedPhoto(null);
    }

    // Ouvrir le modal
    setShowEditModal(true);

    // Définir l'onglet actif sur "infos"
    setActiveTab('infos');
  };

  useEffect(() => {
    // Charger les données depuis l'API
    const fetchData = async () => {
      try {
        setLoading(true);

        // Récupérer les étudiants et les classes depuis l'API
        const [studentsData, classesData] = await Promise.all([
          fetchStudents(),
          fetchClasses()
        ]);

        // Ajouter le nom de la classe à chaque étudiant
        const studentsWithClassNames = studentsData.map(student => {
          const studentClass = classesData.find(c => c.id === student.classe);
          return {
            ...student,
            classe_nom: studentClass?.nom || 'Inconnue'
          };
        });

        setStudents(studentsWithClassNames);
        setClasses(classesData);
        toast.success('Données chargées depuis l\'API');
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données. Veuillez réessayer.');

        // Initialiser avec des tableaux vides en cas d'erreur
        setStudents([]);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrer les étudiants en fonction du terme de recherche
  const filteredStudents = students.filter(student =>
    student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.classe_nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <DashboardLayout title="Gestion des Étudiants">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    </DashboardLayout>;
  }

  return (
    <DashboardLayout title="Gestion des Étudiants">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Liste des étudiants</h2>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Barre de recherche */}
            <div className="relative flex-grow md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Bouton d'ajout */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
            >
              <UserPlus size={18} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        {/* Tableau des étudiants */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date de naissance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 overflow-hidden">
                            {student.photo ? (
                              <img src={student.photo} alt={`${student.prenom} ${student.nom}`} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-blue-500 dark:text-blue-300 font-bold">
                                {student.prenom[0]}{student.nom[0]}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{student.prenom} {student.nom}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{student.sexe === 'M' ? 'Masculin' : 'Féminin'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full">
                          {student.classe_nom}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(student.date_naissance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          student.statut === 'actif'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                        }`}>
                          {student.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="p-1.5 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                            title="Modifier"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="p-1.5 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                            title="Supprimer"
                            onClick={async () => {
                              if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'étudiant ${student.prenom} ${student.nom} ?`)) {
                                try {
                                  if (student.id) {
                                    await deleteStudent(student.id);
                                    setStudents(students.filter(s => s.id !== student.id));
                                    toast.success('Étudiant supprimé avec succès');
                                  }
                                } catch (error) {
                                  console.error('Erreur lors de la suppression:', error);
                                  toast.error('Erreur lors de la suppression de l\'étudiant. Veuillez réessayer.');
                                }
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Aucun étudiant ne correspond à votre recherche' : 'Aucun étudiant enregistré'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      {/* Modal d'ajout d'étudiant */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <UserPlus className="mr-2 text-blue-600 dark:text-blue-400" size={22} />
                Ajouter un nouvel étudiant
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();

              // Validation du formulaire
              if (!formData.nom.trim() || !formData.prenom.trim() || !formData.date_naissance) {
                toast.error('Veuillez remplir tous les champs obligatoires');
                return;
              }

              // Créer un nouvel étudiant via l'API
              const newStudentData: Student = {
                nom: formData.nom,
                prenom: formData.prenom,
                date_naissance: ensureISODate(formData.date_naissance), // Ensure ISO format
                sexe: formData.sexe,
                contact_parent: formData.contact_parent,
                photo: formData.photo,
                donnees_biometriques: formData.donnees_biometriques,
                statut: formData.statut,
                classe: formData.classe
              };

              try {
                // Désactiver les boutons pendant la création
                setLoading(true);

                console.log('Tentative de création d\'un étudiant avec les données:', newStudentData);

                // Appeler l'API pour créer l'étudiant
                const createdStudent = await createStudent(newStudentData);
                console.log('Étudiant créé avec succès:', createdStudent);

                // Ajouter le nom de la classe
                const studentWithClassName = {
                  ...createdStudent,
                  classe_nom: classes.find(c => c.id === createdStudent.classe)?.nom || 'Inconnue'
                };

                // Mettre à jour la liste des étudiants
                setStudents([...students, studentWithClassName]);

                // Vérifier si nous avons une photo à enregistrer
                const photoToRegister = createdStudent._photoData || formData.photo;

                if (photoToRegister && createdStudent.id) {
                  try {
                    console.log('Tentative d\'enregistrement de la photo pour l\'étudiant:', createdStudent.id);
                    await registerStudentFace(createdStudent.id, photoToRegister);
                    console.log('Photo enregistrée avec succès via registerStudentFace');

                    // Mettre à jour l'étudiant dans la liste avec la photo
                    studentWithClassName.photo = 'photo_enregistree';
                    setStudents([...students.filter(s => s.id !== createdStudent.id), studentWithClassName]);

                    toast.success('Photo enregistrée avec succès');
                  } catch (photoError) {
                    console.error('Erreur lors de l\'enregistrement de la photo:', photoError);
                    toast.error('Étudiant créé mais erreur lors de l\'enregistrement de la photo');
                  }
                } else {
                  console.log('Aucune photo à enregistrer pour l\'étudiant');
                }

                // Fermer le modal et réinitialiser le formulaire
                setShowAddModal(false);
                setFormData({
                  nom: '',
                  prenom: '',
                  date_naissance: '',
                  sexe: 'M',
                  contact_parent: '',
                  photo: '',
                  donnees_biometriques: '',
                  statut: 'actif',
                  classe: 1,
                  // Informations du parent
                  parent_nom: '',
                  parent_prenom: '',
                  parent_telephone: '',
                  parent_email: '',
                  parent_relation: 'pere',
                  notifications_sms: true,
                  notifications_email: false
                });

                // Afficher une notification de succès
                toast.success('Étudiant ajouté avec succès');
              } catch (error) {
                console.error('Erreur lors de la création de l\'étudiant:', error);

                // Afficher un message d'erreur plus détaillé
                let errorMessage = 'Erreur lors de la création de l\'étudiant.';

                if (error instanceof Error) {
                  errorMessage += ' ' + error.message;
                }

                toast.error(errorMessage);
              } finally {
                // Réactiver les boutons
                setLoading(false);
              }
            }}>
              {/* Onglets du formulaire */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px">
                  <button
                    type="button"
                    onClick={() => setActiveTab('infos')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                      activeTab === 'infos'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <User className="inline-block mr-2 h-4 w-4" />
                    Informations
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('photo')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                      activeTab === 'photo'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Camera className="inline-block mr-2 h-4 w-4" />
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('parent')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                      activeTab === 'parent'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Phone className="inline-block mr-2 h-4 w-4" />
                    Parent
                  </button>
                </nav>
              </div>

              {/* Contenu des onglets */}
              <div className="p-6 space-y-4">
                {/* Onglet Informations */}
                {activeTab === 'infos' && (
                  <>
                    {/* Nom */}
                    <div>
                      <label htmlFor="nom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="Dupont"
                      />
                    </div>

                    {/* Prénom */}
                    <div>
                      <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        id="prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        required
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="Marie"
                      />
                    </div>

                    {/* Date de naissance */}
                    <div>
                      <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        id="date_naissance"
                        name="date_naissance"
                        value={formData.date_naissance}
                        onChange={handleInputChange}
                        required
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Sexe */}
                    <div>
                      <label htmlFor="sexe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sexe
                      </label>
                      <select
                        id="sexe"
                        name="sexe"
                        value={formData.sexe}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      >
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>

                    {/* Classe */}
                    <div>
                      <label htmlFor="classe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Classe
                      </label>
                      <select
                        id="classe"
                        name="classe"
                        value={formData.classe}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      >
                        {classes.map((classe) => (
                          <option key={classe.id} value={classe.id}>
                            {classe.nom} ({classe.niveau})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Statut */}
                    <div>
                      <label htmlFor="statut" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Statut
                      </label>
                      <select
                        id="statut"
                        name="statut"
                        value={formData.statut}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Onglet Photo */}
                {activeTab === 'photo' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Photo pour la reconnaissance faciale
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Prenez une photo de l'étudiant pour la reconnaissance faciale
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4 text-left">
                        <div className="flex">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Conseils pour une bonne photo :</p>
                            <ul className="text-xs text-blue-600 dark:text-blue-300 mt-1 list-disc list-inside">
                              <li>Assurez-vous que le visage est bien éclairé</li>
                              <li>Le visage doit être centré et visible en entier</li>
                              <li>Évitez les lunettes de soleil et les chapeaux</li>
                              <li>Votre navigateur vous demandera l'autorisation d'accéder à la caméra</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {photoError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          <p className="text-sm text-red-700 dark:text-red-400">{photoError}</p>
                        </div>
                      </div>
                    )}

                    {!showCamera && !capturedPhoto && (
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <Camera className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Aucune photo n'a été prise
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          disabled={cameraLoading}
                          className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${cameraLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {cameraLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 inline-block mr-2 animate-spin" />
                              Activation en cours...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 inline-block mr-2" />
                              Activer la caméra
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {showCamera && (
                      <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          {cameraLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
                              <div className="text-center text-white">
                                <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-2" />
                                <p>Initialisation de la caméra...</p>
                              </div>
                            </div>
                          )}
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-auto"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                        <div className="flex justify-center space-x-3">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={cameraLoading}
                            className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors ${cameraLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <Camera className="h-4 w-4 inline-block mr-2" />
                            Prendre la photo
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                          >
                            <X className="h-4 w-4 inline-block mr-2" />
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

                    {capturedPhoto && (
                      <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <img
                            src={capturedPhoto}
                            alt="Photo capturée"
                            className="w-full h-auto"
                            style={{ maxHeight: '300px' }}
                          />
                          <div className="absolute top-2 right-2">
                            <button
                              type="button"
                              onClick={resetPhoto}
                              className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4">
                            <div className="flex">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <p className="text-sm text-green-700 dark:text-green-400">
                                Photo capturée avec succès
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Canvas caché pour la capture de photo */}
                    <canvas
                      ref={canvasRef}
                      width="640"
                      height="480"
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {/* Onglet Parent */}
                {activeTab === 'parent' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Informations du parent
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Ajoutez les informations du parent ou tuteur de l'étudiant
                      </p>
                    </div>

                    {/* Contact parent */}
                    <div>
                      <label htmlFor="contact_parent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Téléphone du parent
                      </label>
                      <input
                        type="tel"
                        id="contact_parent"
                        name="contact_parent"
                        value={formData.contact_parent}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="+33612345678"
                      />
                    </div>

                    {/* Nom du parent */}
                    <div>
                      <label htmlFor="parent_nom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom du parent
                      </label>
                      <input
                        type="text"
                        id="parent_nom"
                        name="parent_nom"
                        value={formData.parent_nom}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="Dupont"
                      />
                    </div>

                    {/* Prénom du parent */}
                    <div>
                      <label htmlFor="parent_prenom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prénom du parent
                      </label>
                      <input
                        type="text"
                        id="parent_prenom"
                        name="parent_prenom"
                        value={formData.parent_prenom}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="Jean"
                      />
                    </div>

                    {/* Email du parent */}
                    <div>
                      <label htmlFor="parent_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email du parent
                      </label>
                      <input
                        type="email"
                        id="parent_email"
                        name="parent_email"
                        value={formData.parent_email}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="parent@example.com"
                      />
                    </div>

                    {/* Relation avec l'étudiant */}
                    <div>
                      <label htmlFor="parent_relation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Relation avec l'étudiant
                      </label>
                      <select
                        id="parent_relation"
                        name="parent_relation"
                        value={formData.parent_relation}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      >
                        <option value="pere">Père</option>
                        <option value="mere">Mère</option>
                        <option value="tuteur">Tuteur</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    {/* Options de notification */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notifications_sms"
                          name="notifications_sms"
                          checked={formData.notifications_sms}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notifications_sms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Notifications par SMS
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notifications_email"
                          name="notifications_email"
                          checked={formData.notifications_email}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="notifications_email" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Notifications par email
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Ajouter l'étudiant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification d'étudiant */}
      {showEditModal && currentStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <Pencil className="mr-2 text-blue-600 dark:text-blue-400" size={22} />
                Modifier l'étudiant
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();

              // Validation du formulaire
              if (!formData.nom.trim() || !formData.prenom.trim() || !formData.date_naissance) {
                toast.error('Veuillez remplir tous les champs obligatoires');
                return;
              }

              if (!currentStudent.id) {
                toast.error('ID de l\'étudiant manquant');
                return;
              }

              // Créer un objet avec les données mises à jour
              // Ne pas inclure la photo si c'est une chaîne base64 (sera traitée séparément)
              const isBase64Photo = formData.photo && typeof formData.photo === 'string' && formData.photo.length > 1000;

              const updatedStudentData: Student = {
                id: currentStudent.id,
                nom: formData.nom,
                prenom: formData.prenom,
                date_naissance: ensureISODate(formData.date_naissance), // Ensure ISO format
                sexe: formData.sexe,
                contact_parent: formData.contact_parent,
                // Ne pas inclure la photo si c'est une chaîne base64
                ...(isBase64Photo ? {} : { photo: formData.photo }),
                donnees_biometriques: formData.donnees_biometriques,
                statut: formData.statut,
                classe: formData.classe
              };

              try {
                // Désactiver les boutons pendant la mise à jour
                setLoading(true);

                console.log('Tentative de mise à jour de l\'étudiant avec les données:', updatedStudentData);

                // Appeler l'API pour mettre à jour l'étudiant
                const updatedStudent = await updateStudent(currentStudent.id, updatedStudentData);
                console.log('Étudiant mis à jour avec succès:', updatedStudent);

                // Ajouter le nom de la classe
                const studentWithClassName = {
                  ...updatedStudent,
                  classe_nom: classes.find(c => c.id === updatedStudent.classe)?.nom || 'Inconnue'
                };

                // Mettre à jour la liste des étudiants
                setStudents(students.map(s => s.id === updatedStudent.id ? studentWithClassName : s));

                // Vérifier si nous avons une nouvelle photo à enregistrer
                // Utiliser la variable isBase64Photo définie plus haut
                if (isBase64Photo) {
                  try {
                    console.log('Tentative d\'enregistrement de la nouvelle photo pour l\'étudiant:', currentStudent.id);
                    await registerStudentFace(currentStudent.id, formData.photo);
                    console.log('Photo enregistrée avec succès via registerStudentFace');

                    // Mettre à jour l'étudiant dans la liste avec la nouvelle photo
                    studentWithClassName.photo = 'photo_enregistree';
                    setStudents(students.map(s => s.id === updatedStudent.id ? studentWithClassName : s));

                    toast.success('Photo mise à jour avec succès');
                  } catch (photoError) {
                    console.error('Erreur lors de l\'enregistrement de la photo:', photoError);
                    toast.error('Étudiant mis à jour mais erreur lors de l\'enregistrement de la photo');
                  }
                }

                // Fermer le modal
                setShowEditModal(false);
                setCurrentStudent(null);

                // Afficher une notification de succès
                toast.success('Étudiant mis à jour avec succès');
              } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'étudiant:', error);

                // Afficher un message d'erreur plus détaillé
                let errorMessage = 'Erreur lors de la mise à jour de l\'étudiant.';

                if (error instanceof Error) {
                  errorMessage += ' ' + error.message;
                }

                toast.error(errorMessage);
              } finally {
                // Réactiver les boutons
                setLoading(false);
              }
            }}>
              {/* Onglets du formulaire - identiques à ceux du modal d'ajout */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px">
                  <button
                    type="button"
                    onClick={() => setActiveTab('infos')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                      activeTab === 'infos'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <User className="inline-block mr-2 h-4 w-4" />
                    Informations
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('photo')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                      activeTab === 'photo'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Camera className="inline-block mr-2 h-4 w-4" />
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('parent')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                      activeTab === 'parent'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Phone className="inline-block mr-2 h-4 w-4" />
                    Parent
                  </button>
                </nav>
              </div>

              {/* Contenu des onglets - identique à celui du modal d'ajout */}
              <div className="p-6 space-y-4">
                {/* Onglet Informations */}
                {activeTab === 'infos' && (
                  <>
                    {/* Nom */}
                    <div>
                      <label htmlFor="edit_nom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        id="edit_nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="Dupont"
                      />
                    </div>

                    {/* Prénom */}
                    <div>
                      <label htmlFor="edit_prenom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        id="edit_prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        required
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="Marie"
                      />
                    </div>

                    {/* Date de naissance */}
                    <div>
                      <label htmlFor="edit_date_naissance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        id="edit_date_naissance"
                        name="date_naissance"
                        value={formData.date_naissance}
                        onChange={handleInputChange}
                        required
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Sexe */}
                    <div>
                      <label htmlFor="edit_sexe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sexe
                      </label>
                      <select
                        id="edit_sexe"
                        name="sexe"
                        value={formData.sexe}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      >
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>

                    {/* Classe */}
                    <div>
                      <label htmlFor="edit_classe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Classe
                      </label>
                      <select
                        id="edit_classe"
                        name="classe"
                        value={formData.classe}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      >
                        {classes.map((classe) => (
                          <option key={classe.id} value={classe.id}>
                            {classe.nom} ({classe.niveau})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Statut */}
                    <div>
                      <label htmlFor="edit_statut" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Statut
                      </label>
                      <select
                        id="edit_statut"
                        name="statut"
                        value={formData.statut}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Onglet Photo - identique à celui du modal d'ajout */}
                {activeTab === 'photo' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Photo pour la reconnaissance faciale
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Prenez une photo de l'étudiant pour la reconnaissance faciale
                      </p>
                    </div>

                    {photoError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          <p className="text-sm text-red-700 dark:text-red-400">{photoError}</p>
                        </div>
                      </div>
                    )}

                    {!showCamera && !capturedPhoto && (
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <Camera className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Aucune photo n'a été prise
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          disabled={cameraLoading}
                          className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${cameraLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {cameraLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 inline-block mr-2 animate-spin" />
                              Activation en cours...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 inline-block mr-2" />
                              Activer la caméra
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {showCamera && (
                      <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          {cameraLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
                              <div className="text-center text-white">
                                <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-2" />
                                <p>Initialisation de la caméra...</p>
                              </div>
                            </div>
                          )}
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-auto"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                        <div className="flex justify-center space-x-3">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={cameraLoading}
                            className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors ${cameraLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <Camera className="h-4 w-4 inline-block mr-2" />
                            Prendre la photo
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                          >
                            <X className="h-4 w-4 inline-block mr-2" />
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

                    {capturedPhoto && (
                      <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <img
                            src={capturedPhoto}
                            alt="Photo capturée"
                            className="w-full h-auto"
                            style={{ maxHeight: '300px' }}
                          />
                          <div className="absolute top-2 right-2">
                            <button
                              type="button"
                              onClick={resetPhoto}
                              className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4">
                            <div className="flex">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <p className="text-sm text-green-700 dark:text-green-400">
                                Photo capturée avec succès
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Onglet Parent - identique à celui du modal d'ajout */}
                {activeTab === 'parent' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Informations du parent
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Ajoutez les informations du parent ou tuteur de l'étudiant
                      </p>
                    </div>

                    {/* Contact parent */}
                    <div>
                      <label htmlFor="edit_contact_parent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Téléphone du parent
                      </label>
                      <input
                        type="tel"
                        id="edit_contact_parent"
                        name="contact_parent"
                        value={formData.contact_parent}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white"
                        placeholder="+33612345678"
                      />
                    </div>

                    {/* Autres champs du parent - identiques à ceux du modal d'ajout */}
                    {/* ... */}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="inline-block mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    'Mettre à jour'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Students;
