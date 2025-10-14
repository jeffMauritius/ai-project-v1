import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanEstablishmentsBulletPoints() {
  console.log('🧹 Nettoyage des points dans la collection establishments...');
  console.log('===========================================================');
  
  try {
    // Compter avant nettoyage
    const beforeAddress = await prisma.establishment.count({
      where: { address: { startsWith: '·' } }
    });
    
    const beforeCity = await prisma.establishment.count({
      where: { city: { startsWith: '·' } }
    });
    
    console.log(`📊 AVANT NETTOYAGE:`);
    console.log(`   address avec points: ${beforeAddress}`);
    console.log(`   city avec points: ${beforeCity}`);
    console.log('');
    
    // Traiter par lots
    let offset = 0;
    const BATCH_SIZE = 1000;
    let updatedCount = 0;
    const startTime = new Date();
    
    console.log('🧹 Nettoyage par lots...');
    
    while (true) {
      // Récupérer les établissements avec des points
      const establishments = await prisma.establishment.findMany({
        where: {
          OR: [
            { address: { startsWith: '·' } },
            { city: { startsWith: '·' } }
          ]
        },
        select: {
          id: true,
          name: true,
          address: true,
          city: true
        },
        skip: offset,
        take: BATCH_SIZE
      });
      
      if (establishments.length === 0) {
        break;
      }
      
      console.log(`📦 Lot ${Math.floor(offset / BATCH_SIZE) + 1} - ${establishments.length} établissements`);
      
      // Mettre à jour chaque établissement
      for (const establishment of establishments) {
        const updates: any = {};
        
        if (establishment.address?.startsWith('·')) {
          updates.address = establishment.address.substring(1).trim();
        }
        
        if (establishment.city?.startsWith('·')) {
          updates.city = establishment.city.substring(1).trim();
        }
        
        if (Object.keys(updates).length > 0) {
          await prisma.establishment.update({
            where: { id: establishment.id },
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
      
      console.log(`   ✅ ${updatedCount} établissements nettoyés (${elapsedMinutes}m ${elapsedSeconds}s)`);
      
      // Pause entre les lots
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Compter après nettoyage
    const afterAddress = await prisma.establishment.count({
      where: { address: { startsWith: '·' } }
    });
    
    const afterCity = await prisma.establishment.count({
      where: { city: { startsWith: '·' } }
    });
    
    const endTime = new Date();
    const totalTime = endTime.getTime() - startTime.getTime();
    const totalMinutes = Math.floor(totalTime / 60000);
    const totalSeconds = Math.floor((totalTime % 60000) / 1000);
    
    console.log('');
    console.log('📊 APRÈS NETTOYAGE:');
    console.log(`   address avec points: ${afterAddress}`);
    console.log(`   city avec points: ${afterCity}`);
    console.log('');
    console.log('📈 RÉSULTATS:');
    console.log(`   Total établissements nettoyés: ${updatedCount}`);
    console.log(`   Points supprimés de address: ${beforeAddress - afterAddress}`);
    console.log(`   Points supprimés de city: ${beforeCity - afterCity}`);
    console.log(`   Temps total: ${totalMinutes}m ${totalSeconds}s`);
    
  } catch (error) {
    console.error('💥 Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanEstablishmentsBulletPoints();
