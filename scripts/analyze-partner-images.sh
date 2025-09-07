#!/bin/bash

echo "🔍 ANALYSE DES IMAGES PARTENAIRES"
echo "=================================================="

# Configuration
API_URL="http://localhost:3000/api"
DB_URL="mongodb://localhost:27017"

echo "📊 Vérification des partenaires avec images..."

# 1. Compter les partenaires avec images dans l'array
echo "🤝 Partenaires avec images array:"
curl -s "$API_URL/partners" | jq '.partners | map(select(.images | length > 0)) | length' 2>/dev/null || echo "Erreur API"

# 2. Compter les partenaires avec médias
echo "📷 Partenaires avec médias:"
curl -s "$API_URL/partners" | jq '.partners | map(select(.storefronts[].media | length > 0)) | length' 2>/dev/null || echo "Erreur API"

# 3. Analyser un exemple de partenaire
echo ""
echo "📋 Exemple de partenaire avec images:"
curl -s "$API_URL/partners" | jq '.partners | map(select(.images | length > 0)) | .[0] | {id, companyName, images: (.images | length), storefronts: (.storefronts | length)}' 2>/dev/null || echo "Erreur API"

# 4. Compter total images dans array
echo ""
echo "🖼️ Total images dans arrays partenaires:"
curl -s "$API_URL/partners" | jq '.partners | map(.images | length) | add' 2>/dev/null || echo "Erreur API"

# 5. Compter total médias
echo "📷 Total médias partenaires:"
curl -s "$API_URL/partners" | jq '.partners | map(.storefronts[].media | length) | add' 2>/dev/null || echo "Erreur API"

echo ""
echo "✅ Analyse terminée"


