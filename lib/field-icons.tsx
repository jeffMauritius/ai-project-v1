import { 
  Users, 
  Square, 
  Home, 
  Car, 
  Music, 
  Camera, 
  Utensils, 
  Palette, 
  Tent, 
  Gift, 
  Calendar, 
  Clock, 
  Euro, 
  Wifi, 
  ParkingCircle, 
  TreePine, 
  Building, 
  Accessibility, 
  Sun, 
  Moon, 
  Coffee, 
  Wine, 
  Cake, 
  Heart, 
  Sparkles, 
  Mic, 
  Volume2, 
  Video, 
  Image, 
  FileText, 
  Mail, 
  Phone, 
  Globe, 
  Map, 
  Navigation, 
  Route, 
  Bus, 
  Truck, 
  Flower2, 
  Crown, 
  Ring, 
  Plane, 
  Bed, 
  Shower, 
  Waves, 
  Mountain, 
  Umbrella, 
  Thermometer, 
  Wind, 
  Droplets, 
  Lightbulb, 
  Zap, 
  Shield, 
  Lock, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  HelpCircle, 
  Settings, 
  Wrench, 
  Hammer, 
  Scissors, 
  Paintbrush, 
  Brush, 
  PenTool, 
  Type, 
  List, 
  Grid3X3, 
  Columns, 
  Rows, 
  Layout, 
  Layers, 
  Copy, 
  Move, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Desktop, 
  Server, 
  Database, 
  HardDrive, 
  Folder, 
  File, 
  Archive, 
  Download, 
  Upload, 
  Share, 
  Link, 
  ExternalLink, 
  Bookmark, 
  Tag, 
  Tags, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Trash2, 
  Edit, 
  Save, 
  RefreshCw, 
  Play, 
  Pause, 
  Stop, 
  SkipBack, 
  SkipForward, 
  VolumeX, 
  Volume1, 
  Headphones, 
  Radio, 
  Tv, 
  Film, 
  Clapperboard, 
  MessageCircle, 
  MessageSquare, 
  Send, 
  Inbox, 
  Outbox, 
  Trash, 
  FolderOpen, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  FileCode, 
  FileSpreadsheet, 
  FilePdf, 
  FileWord, 
  FileExcel, 
  FilePowerpoint, 
  FileZip, 
  FileCheck, 
  FileX, 
  FilePlus, 
  FileMinus, 
  FileEdit, 
  FileSearch, 
  FileSlash, 
  FileQuestion, 
  FileWarning, 
  FileInfo, 
  FileHeart, 
  FileClock, 
  FileUp, 
  FileDown, 
  FileLeft, 
  FileRight, 
  FileSymlink, 
  FileBinary, 
  FileType, 
  FileType2, 
  FileJson, 
  FileJs, 
  FileTs, 
  FileJsx, 
  FileTsx, 
  FileVue, 
  FileSvelte, 
  FileHtml, 
  FileCss, 
  FileScss, 
  FileLess, 
  FileSass, 
  FileStylus, 
  FileMarkdown, 
  FileYaml, 
  FileToml, 
  FileIni, 
  FileEnv, 
  FileGit, 
  FileGitignore, 
  FileDocker, 
  FileKubernetes, 
  FileTerraform, 
  FileAnsible, 
  FileJenkins, 
  FileTravis, 
  FileCircleci, 
  FileGithub, 
  FileGitlab, 
  FileBitbucket, 
  FileAzure, 
  FileAws, 
  FileGcp, 
  FileDigitalocean, 
  FileHeroku, 
  FileVercel, 
  FileNetlify, 
  FileSurge, 
  FileFirebase, 
  FileSupabase, 
  FilePlanetscale, 
  FileMongodb, 
  FilePostgres, 
  FileMysql, 
  FileRedis, 
  FileElasticsearch, 
  FileKibana, 
  FileLogstash, 
  FileBeats
} from 'lucide-react'

// Mapping des champs aux icônes appropriées
export const getFieldIcon = (fieldId: string, fieldQuestion: string) => {
  const id = fieldId.toLowerCase()
  const question = fieldQuestion.toLowerCase()

  // Mapping par ID de champ
  const iconMap: { [key: string]: any } = {
    // Espaces et capacités
    'nom': Building,
    'description': FileText,
    'surface': Square,
    'capacite_assise': Users,
    'capacite_debout': Users,
    'piste_danse': Music,
    'acces_pmr': Accessibility,
    'acces_direct_exterieur': Sun,
    
    // Durée et tarifs
    'duree_location': Clock,
    'tarif': Euro,
    
    // Équipements et services
    'parking': ParkingCircle,
    'terrasse': Sun,
    'cuisine': Utensils,
    'hebergement': Bed,
    'wifi': Wifi,
    'climatisation': Thermometer,
    'chauffage': Thermometer,
    'sonorisation': Volume2,
    'eclairage': Lightbulb,
    'electricite': Zap,
    
    // Types de prestations
    'type_cuisine': Utensils,
    'specialites': Cake,
    'menu': List,
    'boissons': Wine,
    'service': Settings,
    
    // Photographie et vidéo
    'style_photo': Camera,
    'duree_tournage': Clock,
    'livrables': FileImage,
    'equipement': Camera,
    
    // Musique et animation
    'style_musique': Music,
    'repertoire': List,
    'equipement_son': Volume2,
    'animation': Sparkles,
    
    // Transport
    'type_vehicule': Car,
    'capacite_passagers': Users,
    'equipements': Settings,
    
    // Décoration et fleurs
    'style_decoration': Palette,
    'types_fleurs': Flower2,
    'couleurs': Palette,
    
    // Autres services
    'type_service': Settings,
    'intervention': Wrench,
    'zone_intervention': Map,
    'deplacement': Navigation,
  }

  // Recherche par ID exact
  if (iconMap[id]) {
    return iconMap[id]
  }

  // Recherche par mots-clés dans l'ID
  if (id.includes('capacite') || id.includes('personnes') || id.includes('invites')) {
    return Users
  }
  if (id.includes('surface') || id.includes('m2') || id.includes('metre')) {
    return Square
  }
  if (id.includes('tarif') || id.includes('prix') || id.includes('cout')) {
    return Euro
  }
  if (id.includes('duree') || id.includes('temps') || id.includes('heure')) {
    return Clock
  }
  if (id.includes('parking') || id.includes('stationnement')) {
    return ParkingCircle
  }
  if (id.includes('terrasse') || id.includes('exterieur') || id.includes('jardin')) {
    return Sun
  }
  if (id.includes('cuisine') || id.includes('repas') || id.includes('menu')) {
    return Utensils
  }
  if (id.includes('hebergement') || id.includes('chambre') || id.includes('lit')) {
    return Bed
  }
  if (id.includes('wifi') || id.includes('internet')) {
    return Wifi
  }
  if (id.includes('son') || id.includes('musique') || id.includes('audio')) {
    return Volume2
  }
  if (id.includes('photo') || id.includes('image') || id.includes('camera')) {
    return Camera
  }
  if (id.includes('video') || id.includes('film') || id.includes('tournage')) {
    return Video
  }
  if (id.includes('decoration') || id.includes('style') || id.includes('design')) {
    return Palette
  }
  if (id.includes('fleur') || id.includes('bouquet') || id.includes('floral')) {
    return Flower2
  }
  if (id.includes('transport') || id.includes('vehicule') || id.includes('voiture')) {
    return Car
  }
  if (id.includes('animation') || id.includes('spectacle') || id.includes('divertissement')) {
    return Sparkles
  }
  if (id.includes('accessibilite') || id.includes('pmr') || id.includes('handicap')) {
    return Accessibility
  }
  if (id.includes('electricite') || id.includes('electric') || id.includes('courant')) {
    return Zap
  }
  if (id.includes('eclairage') || id.includes('lumiere') || id.includes('lamp')) {
    return Lightbulb
  }
  if (id.includes('climatisation') || id.includes('chauffage') || id.includes('temperature')) {
    return Thermometer
  }

  // Recherche par mots-clés dans la question
  if (question.includes('capacité') || question.includes('personnes') || question.includes('invités')) {
    return Users
  }
  if (question.includes('surface') || question.includes('m²') || question.includes('mètre')) {
    return Square
  }
  if (question.includes('tarif') || question.includes('prix') || question.includes('coût')) {
    return Euro
  }
  if (question.includes('durée') || question.includes('temps') || question.includes('heure')) {
    return Clock
  }
  if (question.includes('parking') || question.includes('stationnement')) {
    return ParkingCircle
  }
  if (question.includes('terrasse') || question.includes('extérieur') || question.includes('jardin')) {
    return Sun
  }
  if (question.includes('cuisine') || question.includes('repas') || question.includes('menu')) {
    return Utensils
  }
  if (question.includes('hébergement') || question.includes('chambre') || question.includes('lit')) {
    return Bed
  }
  if (question.includes('wifi') || question.includes('internet')) {
    return Wifi
  }
  if (question.includes('son') || question.includes('musique') || question.includes('audio')) {
    return Volume2
  }
  if (question.includes('photo') || question.includes('image') || question.includes('caméra')) {
    return Camera
  }
  if (question.includes('vidéo') || question.includes('film') || question.includes('tournage')) {
    return Video
  }
  if (question.includes('décoration') || question.includes('style') || question.includes('design')) {
    return Palette
  }
  if (question.includes('fleur') || question.includes('bouquet') || question.includes('floral')) {
    return Flower2
  }
  if (question.includes('transport') || question.includes('véhicule') || question.includes('voiture')) {
    return Car
  }
  if (question.includes('animation') || question.includes('spectacle') || question.includes('divertissement')) {
    return Sparkles
  }
  if (question.includes('accessibilité') || question.includes('pmr') || question.includes('handicap')) {
    return Accessibility
  }
  if (question.includes('électricité') || question.includes('électrique') || question.includes('courant')) {
    return Zap
  }
  if (question.includes('éclairage') || question.includes('lumière') || question.includes('lampe')) {
    return Lightbulb
  }
  if (question.includes('climatisation') || question.includes('chauffage') || question.includes('température')) {
    return Thermometer
  }

  // Icône par défaut
  return Settings
}

// Mapping des titres de sections aux icônes appropriées
export const getSectionIcon = (sectionTitle: string) => {
  const title = sectionTitle.toLowerCase()

  // Mapping par titre de section
  const sectionIconMap: { [key: string]: any } = {
    'vos espaces de réceptions': Building,
    'espaces de réception': Building,
    'réception': Building,
    'lieu': Building,
    'espace': Building,
    'durée de location': Clock,
    'location': Clock,
    'tarif': Euro,
    'prix': Euro,
    'coût': Euro,
    'équipements': Settings,
    'services': Settings,
    'prestations': Settings,
    'cuisine': Utensils,
    'repas': Utensils,
    'menu': Utensils,
    'boissons': Wine,
    'bar': Wine,
    'photographie': Camera,
    'photo': Camera,
    'images': Camera,
    'vidéo': Video,
    'film': Video,
    'tournage': Video,
    'musique': Music,
    'son': Music,
    'audio': Music,
    'animation': Sparkles,
    'spectacle': Sparkles,
    'divertissement': Sparkles,
    'transport': Car,
    'véhicule': Car,
    'voiture': Car,
    'décoration': Palette,
    'style': Palette,
    'design': Palette,
    'fleurs': Flower2,
    'bouquet': Flower2,
    'floral': Flower2,
    'chapiteau': Tent,
    'tente': Tent,
    'marquise': Tent,
    'accessibilité': Accessibility,
    'pmr': Accessibility,
    'handicap': Accessibility,
    'parking': ParkingCircle,
    'stationnement': ParkingCircle,
    'terrasse': Sun,
    'extérieur': Sun,
    'jardin': Sun,
    'hébergement': Bed,
    'chambre': Bed,
    'lit': Bed,
    'wifi': Wifi,
    'internet': Wifi,
    'électricité': Zap,
    'électrique': Zap,
    'courant': Zap,
    'éclairage': Lightbulb,
    'lumière': Lightbulb,
    'lampe': Lightbulb,
    'climatisation': Thermometer,
    'chauffage': Thermometer,
    'température': Thermometer,
    'capacité': Users,
    'personnes': Users,
    'invités': Users,
    'surface': Square,
    'm²': Square,
    'mètre': Square,
    'durée': Clock,
    'temps': Clock,
    'heure': Clock,
    'tarif': Euro,
    'prix': Euro,
    'coût': Euro,
  }

  // Recherche par titre exact
  if (sectionIconMap[title]) {
    return sectionIconMap[title]
  }

  // Recherche par mots-clés dans le titre
  if (title.includes('espace') || title.includes('réception') || title.includes('lieu')) {
    return Building
  }
  if (title.includes('durée') || title.includes('temps') || title.includes('heure') || title.includes('location')) {
    return Clock
  }
  if (title.includes('tarif') || title.includes('prix') || title.includes('coût')) {
    return Euro
  }
  if (title.includes('équipement') || title.includes('service') || title.includes('prestation')) {
    return Settings
  }
  if (title.includes('cuisine') || title.includes('repas') || title.includes('menu')) {
    return Utensils
  }
  if (title.includes('boisson') || title.includes('bar') || title.includes('vin')) {
    return Wine
  }
  if (title.includes('photo') || title.includes('image') || title.includes('caméra')) {
    return Camera
  }
  if (title.includes('vidéo') || title.includes('film') || title.includes('tournage')) {
    return Video
  }
  if (title.includes('musique') || title.includes('son') || title.includes('audio')) {
    return Music
  }
  if (title.includes('animation') || title.includes('spectacle') || title.includes('divertissement')) {
    return Sparkles
  }
  if (title.includes('transport') || title.includes('véhicule') || title.includes('voiture')) {
    return Car
  }
  if (title.includes('décoration') || title.includes('style') || title.includes('design')) {
    return Palette
  }
  if (title.includes('fleur') || title.includes('bouquet') || title.includes('floral')) {
    return Flower2
  }
  if (title.includes('chapiteau') || title.includes('tente') || title.includes('marquise')) {
    return Tent
  }
  if (title.includes('accessibilité') || title.includes('pmr') || title.includes('handicap')) {
    return Accessibility
  }
  if (title.includes('parking') || title.includes('stationnement')) {
    return ParkingCircle
  }
  if (title.includes('terrasse') || title.includes('extérieur') || title.includes('jardin')) {
    return Sun
  }
  if (title.includes('hébergement') || title.includes('chambre') || title.includes('lit')) {
    return Bed
  }
  if (title.includes('wifi') || title.includes('internet')) {
    return Wifi
  }
  if (title.includes('électricité') || title.includes('électrique') || title.includes('courant')) {
    return Zap
  }
  if (title.includes('éclairage') || title.includes('lumière') || title.includes('lampe')) {
    return Lightbulb
  }
  if (title.includes('climatisation') || title.includes('chauffage') || title.includes('température')) {
    return Thermometer
  }
  if (title.includes('capacité') || title.includes('personnes') || title.includes('invités')) {
    return Users
  }
  if (title.includes('surface') || title.includes('m²') || title.includes('mètre')) {
    return Square
  }

  // Icône par défaut
  return Settings
}
