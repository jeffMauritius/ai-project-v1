import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface PartnerData {
  id: string;
  companyName: string;
  billingStreet: string | null;
  billingCity: string | null;
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

async function exportPartnersToCsv() {
  try {
    console.log('🔄 Extraction des partenaires depuis MongoDB...');
    
    // Récupérer tous les partenaires
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        companyName: true,
        billingStreet: true,
        billingCity: true,
      },
      orderBy: {
        companyName: 'asc'
      }
    });

    console.log(`✅ ${partners.length} partenaires trouvés`);

    // Créer le contenu CSV
    const csvHeader = 'companyName,billingStreet,billingCity,email\n';
    
    const csvRows = partners.map(partner => {
      const companyName = escapeCsvField(partner.companyName);
      const billingStreet = escapeCsvField(partner.billingStreet);
      const billingCity = escapeCsvField(partner.billingCity);
      const email = `${partner.id}@monmariage.ai`;
      
      return `${companyName},${billingStreet},${billingCity},${email}`;
    });

    const csvContent = csvHeader + csvRows.join('\n');

    // Créer le nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `partners-export-${timestamp}.csv`;
    const filepath = path.join(process.cwd(), filename);

    // Écrire le fichier CSV
    fs.writeFileSync(filepath, csvContent, 'utf8');

    console.log(`✅ Fichier CSV créé : ${filename}`);
    console.log(`📁 Chemin : ${filepath}`);
    console.log(`📊 Nombre de partenaires exportés : ${partners.length}`);
    
    // Afficher quelques exemples
    console.log('\n📋 Exemples de partenaires exportés :');
    partners.slice(0, 3).forEach(partner => {
      console.log(`   • ${partner.companyName} (${partner.billingCity}) -> ${partner.id}@monmariage.ai`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'export :', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
exportPartnersToCsv();
