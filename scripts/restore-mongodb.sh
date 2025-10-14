#!/bin/bash

# Script de restauration MongoDB pour le projet AI
# Ce script restaure un backup MongoDB précédemment créé

set -e  # Arrêter le script en cas d'erreur

# Configuration
BACKUP_DIR="./backups"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Script de restauration MongoDB${NC}"
echo -e "${BLUE}===============================${NC}"

# Vérifier si le dossier de backup existe
if [[ ! -d "$BACKUP_DIR" ]]; then
    echo -e "${RED}❌ Dossier de backup non trouvé: ${BACKUP_DIR}${NC}"
    exit 1
fi

# Lister les backups disponibles
echo -e "${YELLOW}📋 Backups disponibles:${NC}"
ls -la "$BACKUP_DIR" | grep "mongodb_backup_" | awk '{print $9}' | nl

echo -e "${YELLOW}❓ Veuillez entrer le numéro du backup à restaurer:${NC}"
read -p "Numéro du backup: " BACKUP_NUMBER

# Récupérer le nom du backup sélectionné
BACKUP_NAME=$(ls "$BACKUP_DIR" | grep "mongodb_backup_" | sed -n "${BACKUP_NUMBER}p")

if [[ -z "$BACKUP_NAME" ]]; then
    echo -e "${RED}❌ Backup non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backup sélectionné: ${BACKUP_NAME}${NC}"

# Vérifier le contenu du backup
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
if [[ ! -d "$BACKUP_PATH" ]]; then
    echo -e "${RED}❌ Dossier de backup non trouvé: ${BACKUP_PATH}${NC}"
    exit 1
fi

# Afficher les informations du backup
if [[ -f "$BACKUP_PATH/metadata.txt" ]]; then
    echo -e "${YELLOW}📄 Informations du backup:${NC}"
    cat "$BACKUP_PATH/metadata.txt"
fi

# Trouver la base de données dans le backup
DATABASE_DIR=$(find "$BACKUP_PATH" -maxdepth 1 -type d -name "*" | grep -v "$BACKUP_PATH$" | head -1)
DATABASE_NAME=$(basename "$DATABASE_DIR")

if [[ -z "$DATABASE_NAME" ]]; then
    echo -e "${RED}❌ Base de données non trouvée dans le backup${NC}"
    exit 1
fi

echo -e "${GREEN}📊 Base de données détectée: ${DATABASE_NAME}${NC}"

# Afficher les collections disponibles
echo -e "${YELLOW}📋 Collections dans le backup:${NC}"
ls -la "$DATABASE_DIR" | grep -v "^total" | awk '{print $9}' | grep -v "^$"

# Demander confirmation
echo -e "${RED}⚠️  ATTENTION: Cette opération va écraser la base de données actuelle!${NC}"
echo -e "${YELLOW}❓ Voulez-vous continuer? (oui/non):${NC}"
read -p "Confirmation: " CONFIRMATION

if [[ "$CONFIRMATION" != "oui" ]]; then
    echo -e "${YELLOW}❌ Restauration annulée${NC}"
    exit 0
fi

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

RESTORE_SUCCESS=false

# Méthode 1: Utiliser la variable d'environnement DATABASE_URL
if [[ -n "$DATABASE_URL" ]]; then
    echo -e "${YELLOW}🔍 Méthode 1: Variable d'environnement DATABASE_URL${NC}"
    extract_mongo_info "$DATABASE_URL"
    
    if [[ -n "$USERNAME" && -n "$PASSWORD" ]]; then
        mongorestore --host "$HOST:$PORT" --username "$USERNAME" --password "$PASSWORD" --db "$DATABASE" --drop "$BACKUP_PATH/$DATABASE_NAME"
    else
        mongorestore --host "$HOST:$PORT" --db "$DATABASE" --drop "$BACKUP_PATH/$DATABASE_NAME"
    fi
    RESTORE_SUCCESS=true

# Méthode 2: Utiliser un fichier .env.local
elif [[ -f ".env.local" ]]; then
    echo -e "${YELLOW}🔍 Méthode 2: Fichier .env.local${NC}"
    DATABASE_URL=$(grep "DATABASE_URL" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    
    if [[ -n "$DATABASE_URL" ]]; then
        extract_mongo_info "$DATABASE_URL"
        
        if [[ -n "$USERNAME" && -n "$PASSWORD" ]]; then
            mongorestore --host "$HOST:$PORT" --username "$USERNAME" --password "$PASSWORD" --db "$DATABASE" --drop "$BACKUP_PATH/$DATABASE_NAME"
        else
            mongorestore --host "$HOST:$PORT" --db "$DATABASE" --drop "$BACKUP_PATH/$DATABASE_NAME"
        fi
        RESTORE_SUCCESS=true
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
        
        echo -e "${YELLOW}❓ Nom de la base de données de destination (ou appuyez sur Entrée pour utiliser ${DATABASE_NAME}):${NC}"
        read -p "Database name: " TARGET_DATABASE
        
        if [[ -z "$TARGET_DATABASE" ]]; then
            TARGET_DATABASE="$DATABASE_NAME"
        fi
        
        mongorestore --db "$TARGET_DATABASE" --drop "$BACKUP_PATH/$DATABASE_NAME"
        RESTORE_SUCCESS=true
    else
        echo -e "${RED}❌ MongoDB local non détecté${NC}"
    fi
fi

# Vérifier le succès de la restauration
if [[ "$RESTORE_SUCCESS" == true ]]; then
    echo -e "${GREEN}✅ Restauration terminée avec succès!${NC}"
    echo -e "${GREEN}📊 Base de données restaurée: ${TARGET_DATABASE:-$DATABASE}${NC}"
    
    # Afficher les collections restaurées
    echo -e "${GREEN}📋 Collections restaurées:${NC}"
    if [[ -n "$TARGET_DATABASE" ]]; then
        mongo "$TARGET_DATABASE" --eval "db.getCollectionNames()" --quiet 2>/dev/null || echo "Impossible de lister les collections"
    fi
    
else
    echo -e "${RED}❌ Échec de la restauration${NC}"
    echo -e "${YELLOW}💡 Suggestions:${NC}"
    echo -e "   1. Vérifiez que MongoDB est en cours d'exécution"
    echo -e "   2. Vérifiez les informations de connexion"
    echo -e "   3. Vérifiez les permissions d'accès"
    echo -e "   4. Vérifiez que le backup n'est pas corrompu"
    exit 1
fi

echo -e "${BLUE}🎉 Script terminé avec succès!${NC}"
