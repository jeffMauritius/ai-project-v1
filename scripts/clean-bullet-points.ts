import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanBulletPoints() {
  console.log('🧹 Nettoyage des points dans billingStreet et billingCity...');
  console.log('==========================================================');
  
  try {
    // Compter avant nettoyage
    const beforeStreet = await prisma.partner.count({
      where: { billingStreet: { startsWith: '·' } }
    });
    
    const beforeCity = await prisma.partner.count({
      where: { billingCity: { startsWith: '·' } }
    });
    
    console.log(`📊 AVANT NETTOYAGE:`);
    console.log(`   billingStreet avec points: ${beforeStreet}`);
    console.log(`   billingCity avec points: ${beforeCity}`);
    console.log('');
    
    // Traiter par lots
    let offset = 0;
    const BATCH_SIZE = 1000;
    let updatedCount = 0;
    const startTime = new Date();
    
    console.log('🧹 Nettoyage par lots...');
    
    while (true) {
      // Récupérer les partenaires avec des points
      const partners = await prisma.partner.findMany({
        where: {
          OR: [
            { billingStreet: { startsWith: '·' } },
            { billingCity: { startsWith: '·' } }
          ]
        },
        select: {
          id: true,
          billingStreet: true,
          billingCity: true
        },
        skip: offset,
        take: BATCH_SIZE
      });
      
      if (partners.length === 0) {
        break;
      }
      
      console.log(`📦 Lot ${Math.floor(offset / BATCH_SIZE) + 1} - ${partners.length} partenaires`);
      
      // Mettre à jour chaque partenaire
      for (const partner of partners) {
        const updates: any = {};
        
        if (partner.billingStreet?.startsWith('·')) {
          updates.billingStreet = partner.billingStreet.substring(1).trim();
        }
        
        if (partner.billingCity?.startsWith('·')) {
          updates.billingCity = partner.billingCity.substring(1).trim();
        }
        
        if (Object.keys(updates).length > 0) {
          await prisma.partner.update({
            where: { id: partner.id },
            data: updates
          });
          updatedCount++;
        }
      }
      
      offset += BATCH_SIZE;
      
      // Rapport de progrès
      const elapsed = new Date().getTime() - startTime.getTime();
      const elapsedMinutes = Math.floor(elapsed / 60000);
      const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
      
      console.log(`   ✅ ${updatedCount} partenaires nettoyés (${elapsedMinutes}m ${elapsedSeconds}s)`);
      
      // Pause entre les lots
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Compter après nettoyage
    const afterStreet = await prisma.partner.count({
      where: { billingStreet: { startsWith: '·' } }
    });
    
    const afterCity = await prisma.partner.count({
      where: { billingCity: { startsWith: '·' } }
    });
    
    const endTime = new Date();
    const totalTime = endTime.getTime() - startTime.getTime();
    const totalMinutes = Math.floor(totalTime / 60000);
    const totalSeconds = Math.floor((totalTime % 60000) / 1000);
    
    console.log('');
    console.log('📊 APRÈS NETTOYAGE:');
    console.log(`   billingStreet avec points: ${afterStreet}`);
    console.log(`   billingCity avec points: ${afterCity}`);
    console.log('');
    console.log('📈 RÉSULTATS:');
    console.log(`   Total partenaires nettoyés: ${updatedCount}`);
    console.log(`   Points supprimés de billingStreet: ${beforeStreet - afterStreet}`);
    console.log(`   Points supprimés de billingCity: ${beforeCity - afterCity}`);
    console.log(`   Temps total: ${totalMinutes}m ${totalSeconds}s`);
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanBulletPoints();
