#!/bin/bash

# Script de backup MongoDB pour le projet AI
# Ce script crée un backup complet de la base de données MongoDB

set -e  # Arrêter le script en cas d'erreur

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="mongodb_backup_${TIMESTAMP}"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  Script de backup MongoDB${NC}"
echo -e "${BLUE}============================${NC}"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📁 Dossier de backup: ${BACKUP_DIR}${NC}"
echo -e "${YELLOW}📅 Timestamp: ${TIMESTAMP}${NC}"

# Fonction pour extraire les informations de connexion depuis l'URL MongoDB
extract_mongo_info() {
    local url="$1"
    
    # Extraire le host et le port
    if [[ $url =~ mongodb://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        USERNAME="${BASH_REMATCH[1]}"
        PASSWORD="${BASH_REMATCH[2]}"
        HOST="${BASH_REMATCH[3]}"
        PORT="${BASH_REMATCH[4]}"
        DATABASE="${BASH_REMATCH[5]}"
    elif [[ $url =~ mongodb://([^:]+):([^/]+)/(.+) ]]; then
        HOST="${BASH_REMATCH[1]}"
        PORT="${BASH_REMATCH[2]}"
        DATABASE="${BASH_REMATCH[3]}"
    elif [[ $url =~ mongodb\+srv://([^:]+):([^@]+)@([^/]+)/(.+) ]]; then
        USERNAME="${BASH_REMATCH[1]}"
        PASSWORD="${BASH_REMATCH[2]}"
        HOST="${BASH_REMATCH[3]}"
        PORT="27017"
        DATABASE="${BASH_REMATCH[4]}"
    elif [[ $url =~ mongodb\+srv://([^/]+)/(.+) ]]; then
        HOST="${BASH_REMATCH[1]}"
        PORT="27017"
        DATABASE="${BASH_REMATCH[2]}"
    else
        echo -e "${RED}❌ Format d'URL MongoDB non reconnu${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Informations de connexion extraites:${NC}"
    echo -e "   Host: ${HOST}"
    echo -e "   Port: ${PORT}"
    echo -e "   Database: ${DATABASE}"
    if [[ -n "$USERNAME" ]]; then
        echo -e "   Username: ${USERNAME}"
    fi
}

# Méthode 1: Utiliser la variable d'environnement DATABASE_URL
if [[ -n "$DATABASE_URL" ]]; then
    echo -e "${YELLOW}🔍 Méthode 1: Variable d'environnement DATABASE_URL${NC}"
    extract_mongo_info "$DATABASE_URL"
    
    if [[ -n "$USERNAME" && -n "$PASSWORD" ]]; then
        mongodump --uri "$DATABASE_URL" --out "$BACKUP_DIR/$BACKUP_NAME"
    else
        mongodump --host "$HOST:$PORT" --db "$DATABASE" --out "$BACKUP_DIR/$BACKUP_NAME"
    fi
    BACKUP_SUCCESS=true

# Méthode 2: Utiliser un fichier .env.local
elif [[ -f ".env.local" ]]; then
    echo -e "${YELLOW}🔍 Méthode 2: Fichier .env.local${NC}"
    DATABASE_URL=$(grep "DATABASE_URL" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [[ -n "$DATABASE_URL" ]]; then
        extract_mongo_info "$DATABASE_URL"
        
        if [[ -n "$USERNAME" && -n "$PASSWORD" ]]; then
            mongodump --uri "$DATABASE_URL" --out "$BACKUP_DIR/$BACKUP_NAME"
        else
            mongodump --host "$HOST:$PORT" --db "$DATABASE" --out "$BACKUP_DIR/$BACKUP_NAME"
        fi
        BACKUP_SUCCESS=true
    else
        echo -e "${RED}❌ DATABASE_URL non trouvé dans .env.local${NC}"
    fi

# Méthode 3: Connexion locale MongoDB
else
    echo -e "${YELLOW}🔍 Méthode 3: Connexion locale MongoDB${NC}"
    echo -e "${YELLOW}⚠️  Tentative de connexion à MongoDB local (localhost:27017)${NC}"
    
    # Vérifier si MongoDB est en cours d'exécution
    if pgrep -x "mongod" > /dev/null; then
        echo -e "${GREEN}✅ MongoDB local détecté${NC}"
        
        # Lister les bases de données disponibles
        echo -e "${YELLOW}📋 Bases de données disponibles:${NC}"
        mongo --eval "db.adminCommand('listDatabases').databases.forEach(function(d) { print(d.name) })" --quiet
        
        echo -e "${YELLOW}❓ Veuillez entrer le nom de la base de données à sauvegarder:${NC}"
        read -p "Database name: " DATABASE
        
        if [[ -n "$DATABASE" ]]; then
            mongodump --db "$DATABASE" --out "$BACKUP_DIR/$BACKUP_NAME"
            BACKUP_SUCCESS=true
        else
            echo -e "${RED}❌ Nom de base de données non fourni${NC}"
        fi
    else
        echo -e "${RED}❌ MongoDB local non détecté${NC}"
    fi
fi

# Vérifier le succès du backup
if [[ "$BACKUP_SUCCESS" == true ]]; then
    echo -e "${GREEN}✅ Backup créé avec succès!${NC}"
    echo -e "${GREEN}📁 Emplacement: ${BACKUP_DIR}/${BACKUP_NAME}${NC}"
    
    # Afficher la taille du backup
    BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
    echo -e "${GREEN}📊 Taille du backup: ${BACKUP_SIZE}${NC}"
    
    # Lister les collections sauvegardées
    echo -e "${GREEN}📋 Collections sauvegardées:${NC}"
    ls -la "$BACKUP_DIR/$BACKUP_NAME/$DATABASE" 2>/dev/null || ls -la "$BACKUP_DIR/$BACKUP_NAME"/*/
    
    # Créer un fichier de métadonnées
    cat > "$BACKUP_DIR/$BACKUP_NAME/metadata.txt" << EOF
Backup créé le: $(date)
Base de données: ${DATABASE:-"Non spécifiée"}
Host: ${HOST:-"localhost"}
Port: ${PORT:-"27017"}
Taille: ${BACKUP_SIZE}
Collections: $(ls "$BACKUP_DIR/$BACKUP_NAME/$DATABASE" 2>/dev/null | wc -l || echo "N/A")
EOF
    
    echo -e "${GREEN}📄 Métadonnées sauvegardées dans metadata.txt${NC}"
    
else
    echo -e "${RED}❌ Échec du backup${NC}"
    echo -e "${YELLOW}💡 Suggestions:${NC}"
    echo -e "   1. Vérifiez que MongoDB est en cours d'exécution"
    echo -e "   2. Vérifiez les informations de connexion"
    echo -e "   3. Vérifiez les permissions d'accès"
    echo -e "   4. Créez un fichier .env.local avec DATABASE_URL"
    exit 1
fi

echo -e "${BLUE}🎉 Script terminé avec succès!${NC}"
