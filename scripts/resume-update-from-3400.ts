import { PrismaClient } from '@prisma/client';
import { list } from '@vercel/blob';

const prisma = new PrismaClient();

async function resumeUpdateFromOffset3400() {
  console.log('🚀 Reprise de la mise à jour des URLs à partir de l\'offset 3400...');
  console.log('==============================================================');
  
  try {
    let offset = 3400; // Reprendre à partir de là où vous vous êtes arrêté
    const BATCH_SIZE = 50;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let totalProcessed = 0;
    const startTime = new Date();

    while (true) {
      console.log(`📦 Lot ${Math.floor(offset / BATCH_SIZE) + 1} (offset: ${offset})`);
      
      // Requête ULTRA SIMPLE - juste les IDs
      const partners = await prisma.partner.findMany({
        select: {
          id: true,
          companyName: true
        },
        skip: offset,
        take: BATCH_SIZE
      });

      if (partners.length === 0) {
        console.log('✅ Plus de partenaires à traiter');
        break;
      }

      console.log(`   📊 ${partners.length} partenaires dans ce lot`);

      for (let i = 0; i < partners.length; i++) {
        const partner = partners[i];
        
        console.log(`   🔍 [${totalProcessed + i + 1}] ${partner.companyName}`);
        console.log(`       ID: ${partner.id}`);
        
        try {
          // Vérifier les fichiers sur Vercel Blob
          const { blobs } = await list({ 
            prefix: `partners/${partner.id}/960/`,
            limit: 20 
          });
          
          if (blobs.length > 0) {
            console.log(`       📁 ${blobs.length} fichiers trouvés`);
            
            // Extraire le hash du premier fichier
            const fileName = blobs[0].url.split('/').pop() || '';
            const hashMatch = fileName.match(/image-1-(.+)\.webp/);
            
            if (hashMatch) {
              const hash = hashMatch[1];
              console.log(`       🔑 Hash: ${hash}`);
              
              // Construire les URLs
              const imageUrls = [];
              for (let j = 1; j <= blobs.length; j++) {
                imageUrls.push(`https://tngthgmxehdhwfq3.public.blob.vercel-storage.com/partners/${partner.id}/960/image-${j}-${hash}.webp`);
              }
              
              // Mettre à jour
              await prisma.partner.update({
                where: { id: partner.id },
                data: { images: imageUrls }
              });
              
              console.log(`       ✅ Mis à jour avec ${imageUrls.length} images`);
              updatedCount++;
              
            } else {
              console.log(`       ❌ Pas de hash`);
              skippedCount++;
            }
            
          } else {
            console.log(`       ⚠️  Aucun fichier`);
            skippedCount++;
          }
          
        } catch (error) {
          console.error(`       ❌ Erreur: ${error.message}`);
          errorCount++;
        }
        
        // Pause entre les requêtes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      totalProcessed += partners.length;
      offset += BATCH_SIZE;

      // Rapport de progrès
      const elapsed = new Date().getTime() - startTime.getTime();
      const elapsedMinutes = Math.floor(elapsed / 60000);
      const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);
      const rate = totalProcessed / (elapsed / 1000);
      
      console.log('');
      console.log('📈 ========== RAPPORT DE PROGRÈS ==========');
      console.log(`⏱️  Temps écoulé: ${elapsedMinutes}m ${elapsedSeconds}s`);
      console.log(`📊 Total traités: ${totalProcessed}`);
      console.log(`✅ Mis à jour: ${updatedCount}`);
      console.log(`⏭️  Ignorés: ${skippedCount}`);
      console.log(`❌ Erreurs: ${errorCount}`);
      console.log(`🚀 Vitesse: ${rate.toFixed(2)} partenaires/seconde`);
      
      if (rate > 0) {
        const estimatedTotal = 10000; // Estimation grossière
        const remainingTime = (estimatedTotal - totalProcessed) / rate;
        const remainingMinutes = Math.floor(remainingTime / 60);
        const remainingSeconds = Math.floor(remainingTime % 60);
        console.log(`⏳ Temps restant estimé: ${remainingMinutes}m ${remainingSeconds}s`);
      }
      
      console.log('==========================================');
      console.log('');

      // Pause entre les lots
      console.log('⏳ Pause de 2 secondes avant le prochain lot...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const endTime = new Date();
    const totalTime = endTime.getTime() - startTime.getTime();
    const totalMinutes = Math.floor(totalTime / 60000);
    const totalSeconds = Math.floor((totalTime % 60000) / 1000);

    console.log('');
    console.log('🎉 ========== TRAITEMENT TERMINÉ ==========');
    console.log(`⏰ Durée totale: ${totalMinutes}m ${totalSeconds}s`);
    console.log(`📊 Résultats:`);
    console.log(`   • Total traités: ${totalProcessed}`);
    console.log(`   • Mis à jour: ${updatedCount}`);
    console.log(`   • Ignorés: ${skippedCount}`);
    console.log(`   • Erreurs: ${errorCount}`);
    console.log(`📈 Taux de succès: ${((updatedCount/totalProcessed)*100).toFixed(1)}%`);
    console.log(`🚀 Vitesse moyenne: ${(totalProcessed/(totalTime/1000)).toFixed(2)} partenaires/seconde`);
    console.log('==========================================');

  } catch (error) {
    console.error('💥 Erreur fatale:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Déconnexion de la base de données');
  }
}

resumeUpdateFromOffset3400();
