#!/bin/bash

# Script de backup automatique MongoDB
# Ce script peut être exécuté via cron pour des backups réguliers

set -e

# Configuration
BACKUP_DIR="./backups"
LOG_FILE="./backups/backup.log"

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

log "🚀 Début du backup automatique MongoDB"

# Vérifier si Node.js et tsx sont disponibles
if ! command -v npx &> /dev/null; then
    log_error "npx n'est pas installé"
    exit 1
fi

# Exécuter le backup Prisma
if npx tsx scripts/backup-mongodb-prisma.ts backup; then
    log "✅ Backup terminé avec succès"
    
    # Nettoyer les anciens backups (garder seulement les 7 derniers)
    log "🧹 Nettoyage des anciens backups..."
    
    # Compter les backups existants
    backup_count=$(ls -1 "$BACKUP_DIR"/mongodb_backup_prisma_*.json 2>/dev/null | wc -l)
    
    if [[ $backup_count -gt 7 ]]; then
        # Supprimer les anciens backups
        ls -t "$BACKUP_DIR"/mongodb_backup_prisma_*.json | tail -n +8 | while read -r old_backup; do
            rm -f "$old_backup"
            # Supprimer aussi le fichier de métadonnées correspondant
            metadata_file="${old_backup%.json}.txt"
            metadata_file="${metadata_file/mongodb_backup_prisma_/metadata_}"
            rm -f "$metadata_file"
            log "🗑️  Supprimé: $(basename "$old_backup")"
        done
    else
        log "📊 $backup_count backup(s) existant(s), aucun nettoyage nécessaire"
    fi
    
    # Afficher les statistiques
    total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    log "📊 Taille totale des backups: $total_size"
    
else
    log_error "Échec du backup"
    exit 1
fi

log "🎉 Backup automatique terminé"
