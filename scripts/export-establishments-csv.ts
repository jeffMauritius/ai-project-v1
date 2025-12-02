import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface EstablishmentData {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
}

function escapeCsvField(field: string | null): string {
  if (!field) return '';
  
  // Échapper les guillemets et entourer de guillemets si nécessaire
  const escaped = field.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
    return `"${escaped}"`;
  }
  return escaped;
}

async function exportEstablishmentsToCsv() {
  try {
    console.log('🔄 Extraction des établissements depuis MongoDB...');
    
    // Récupérer tous les établissements
    const establishments = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        region: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ ${establishments.length} établissements trouvés`);

    // Créer le contenu CSV
    const csvHeader = 'name,address,city,region,email\n';
    
    const csvRows = establishments.map(establishment => {
      const name = escapeCsvField(establishment.name);
      const address = escapeCsvField(establishment.address);
      const city = escapeCsvField(establishment.city);
      const region = escapeCsvField(establishment.region);
      const email = `${establishment.id}@monmariage.ai`;
      
      return `${name},${address},${city},${region},${email}`;
    });

    const csvContent = csvHeader + csvRows.join('\n');

    // Créer le nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `establishments-export-${timestamp}.csv`;
    const filepath = path.join(process.cwd(), filename);

    // Écrire le fichier CSV
    fs.writeFileSync(filepath, csvContent, 'utf8');

    console.log(`✅ Fichier CSV créé : ${filename}`);
    console.log(`📁 Chemin : ${filepath}`);
    console.log(`📊 Nombre d'établissements exportés : ${establishments.length}`);
    
    // Afficher quelques exemples
    console.log('\n📋 Exemples d\'établissements exportés :');
    establishments.slice(0, 3).forEach(est => {
      console.log(`   • ${est.name} (${est.city}) -> ${est.id}@monmariage.ai`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'export :', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
exportEstablishmentsToCsv();
