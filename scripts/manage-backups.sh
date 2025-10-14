#!/bin/bash

# Script de gestion des backups MongoDB
# Ce script permet de lister, nettoyer et gérer les backups

set -e

# Configuration
BACKUP_DIR="./backups"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📁 Gestionnaire de backups MongoDB${NC}"
echo -e "${BLUE}=================================${NC}"

# Fonction pour lister les backups
list_backups() {
    echo -e "${YELLOW}📋 Backups disponibles:${NC}"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        echo -e "${RED}❌ Aucun dossier de backup trouvé${NC}"
        return
    fi
    
    local count=0
    for backup in "$BACKUP_DIR"/mongodb_backup_*; do
        if [[ -d "$backup" ]]; then
            count=$((count + 1))
            local backup_name=$(basename "$backup")
            local backup_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1-2)
            local backup_size=$(du -sh "$backup" | cut -f1)
            
            echo -e "${GREEN}${count}. ${backup_name}${NC}"
            echo -e "   📅 Date: ${backup_date}"
            echo -e "   💾 Taille: ${backup_size}"
            
            if [[ -f "$backup/metadata.txt" ]]; then
                echo -e "   📄 Métadonnées: Oui"
            fi
            echo ""
        fi
    done
    
    if [[ $count -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  Aucun backup trouvé${NC}"
    else
        echo -e "${GREEN}Total: ${count} backup(s)${NC}"
    fi
}

# Fonction pour nettoyer les anciens backups
cleanup_backups() {
    echo -e "${YELLOW}🧹 Nettoyage des anciens backups...${NC}"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        echo -e "${RED}❌ Aucun dossier de backup trouvé${NC}"
        return
    fi
    
    # Garder seulement les 5 derniers backups
    local backups=($(ls -t "$BACKUP_DIR"/mongodb_backup_* 2>/dev/null | head -5))
    local all_backups=($(ls -t "$BACKUP_DIR"/mongodb_backup_* 2>/dev/null))
    
    if [[ ${#all_backups[@]} -le 5 ]]; then
        echo -e "${GREEN}✅ Moins de 5 backups, aucun nettoyage nécessaire${NC}"
        return
    fi
    
    echo -e "${YELLOW}📋 Backups à conserver (5 derniers):${NC}"
    for backup in "${backups[@]}"; do
        echo -e "   ✅ $(basename "$backup")"
    done
    
    echo -e "${YELLOW}📋 Backups à supprimer:${NC}"
    local to_delete=()
    for backup in "${all_backups[@]}"; do
        local keep=false
        for keep_backup in "${backups[@]}"; do
            if [[ "$backup" == "$keep_backup" ]]; then
                keep=true
                break
            fi
        done
        if [[ "$keep" == false ]]; then
            to_delete+=("$backup")
            echo -e "   ❌ $(basename "$backup")"
        fi
    done
    
    if [[ ${#to_delete[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ Aucun backup à supprimer${NC}"
        return
    fi
    
    echo -e "${RED}⚠️  Voulez-vous supprimer ${#to_delete[@]} backup(s) ancien(s)? (oui/non):${NC}"
    read -p "Confirmation: " CONFIRMATION
    
    if [[ "$CONFIRMATION" == "oui" ]]; then
        local freed_space=0
        for backup in "${to_delete[@]}"; do
            local size=$(du -sk "$backup" | cut -f1)
            freed_space=$((freed_space + size))
            rm -rf "$backup"
            echo -e "${GREEN}✅ Supprimé: $(basename "$backup")${NC}"
        done
        
        echo -e "${GREEN}🎉 Nettoyage terminé!${NC}"
        echo -e "${GREEN}💾 Espace libéré: $((freed_space / 1024)) MB${NC}"
    else
        echo -e "${YELLOW}❌ Nettoyage annulé${NC}"
    fi
}

# Fonction pour afficher les statistiques
show_stats() {
    echo -e "${YELLOW}📊 Statistiques des backups:${NC}"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        echo -e "${RED}❌ Aucun dossier de backup trouvé${NC}"
        return
    fi
    
    local total_backups=$(ls -1 "$BACKUP_DIR"/mongodb_backup_* 2>/dev/null | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    local oldest_backup=$(ls -t "$BACKUP_DIR"/mongodb_backup_* 2>/dev/null | tail -1)
    local newest_backup=$(ls -t "$BACKUP_DIR"/mongodb_backup_* 2>/dev/null | head -1)
    
    echo -e "   📦 Total de backups: ${total_backups}"
    echo -e "   💾 Taille totale: ${total_size}"
    
    if [[ -n "$oldest_backup" ]]; then
        local oldest_date=$(stat -f "%Sm" -t "%Y-%m-%d" "$oldest_backup" 2>/dev/null || stat -c "%y" "$oldest_backup" 2>/dev/null | cut -d' ' -f1)
        echo -e "   📅 Plus ancien: $(basename "$oldest_backup") (${oldest_date})"
    fi
    
    if [[ -n "$newest_backup" ]]; then
        local newest_date=$(stat -f "%Sm" -t "%Y-%m-%d" "$newest_backup" 2>/dev/null || stat -c "%y" "$newest_backup" 2>/dev/null | cut -d' ' -f1)
        echo -e "   📅 Plus récent: $(basename "$newest_backup") (${newest_date})"
    fi
}

# Menu principal
show_menu() {
    echo -e "${YELLOW}Que voulez-vous faire?${NC}"
    echo -e "1. 📋 Lister les backups"
    echo -e "2. 🧹 Nettoyer les anciens backups"
    echo -e "3. 📊 Afficher les statistiques"
    echo -e "4. 🗄️  Créer un nouveau backup"
    echo -e "5. 🔄 Restaurer un backup"
    echo -e "6. ❌ Quitter"
    echo ""
    read -p "Votre choix (1-6): " CHOICE
    
    case $CHOICE in
        1)
            list_backups
            ;;
        2)
            cleanup_backups
            ;;
        3)
            show_stats
            ;;
        4)
            echo -e "${YELLOW}🚀 Lancement du script de backup...${NC}"
            ./scripts/backup-mongodb.sh
            ;;
        5)
            echo -e "${YELLOW}🔄 Lancement du script de restauration...${NC}"
            ./scripts/restore-mongodb.sh
            ;;
        6)
            echo -e "${GREEN}👋 Au revoir!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Choix invalide${NC}"
            ;;
    esac
}

# Point d'entrée
if [[ $# -eq 0 ]]; then
    show_menu
else
    case $1 in
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_backups
            ;;
        "stats")
            show_stats
            ;;
        "backup")
            ./scripts/backup-mongodb.sh
            ;;
        "restore")
            ./scripts/restore-mongodb.sh
            ;;
        *)
            echo -e "${RED}Usage: $0 [list|cleanup|stats|backup|restore]${NC}"
            echo -e "Ou lancez sans argument pour le menu interactif"
            ;;
    esac
fi
