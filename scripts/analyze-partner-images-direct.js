const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzePartnerImages() {
  try {
    console.log('🔍 ANALYSE DES IMAGES PARTENAIRES');
    console.log('==================================================');

    // 1. Compter les partenaires avec images dans l'array
    const partnersWithImagesArray = await prisma.partner.count({
      where: {
        images: {
          isEmpty: false
        }
      }
    });
    console.log(`🤝 Partenaires avec images array: ${partnersWithImagesArray}`);

    // 2. Compter les partenaires avec médias
    const partnersWithMedia = await prisma.partner.count({
      where: {
        storefronts: {
          some: {
            media: {
              some: {}
            }
          }
        }
      }
    });
    console.log(`📷 Partenaires avec médias: ${partnersWithMedia}`);

    // 3. Compter total images dans arrays
    const partners = await prisma.partner.findMany({
      select: {
        images: true
      }
    });
    const totalImagesInArrays = partners.reduce((sum, partner) => sum + partner.images.length, 0);
    console.log(`🖼️ Total images dans arrays partenaires: ${totalImagesInArrays}`);

    // 4. Compter total médias
    const totalMedia = await prisma.media.count();
    console.log(`📷 Total médias: ${totalMedia}`);

    // 5. Analyser un exemple de partenaire avec images
    const samplePartner = await prisma.partner.findFirst({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        companyName: true,
        images: true,
        storefronts: {
          select: {
            id: true,
            media: {
              select: {
                id: true,
                url: true
              }
            }
          }
        }
      }
    });

    if (samplePartner) {
      console.log('\n📋 Exemple de partenaire avec images:');
      console.log(`  Nom: ${samplePartner.companyName}`);
      console.log(`  ID: ${samplePartner.id}`);
      console.log(`  Images array: ${samplePartner.images.length}`);
      console.log(`  Storefronts: ${samplePartner.storefronts.length}`);
      console.log(`  Médias: ${samplePartner.storefronts.reduce((sum, sf) => sum + sf.media.length, 0)}`);
    }

    // 6. Analyser la distribution des images
    console.log('\n📊 DISTRIBUTION DES IMAGES:');
    const imageCounts = {};
    partners.forEach(partner => {
      const count = partner.images.length;
      imageCounts[count] = (imageCounts[count] || 0) + 1;
    });

    Object.entries(imageCounts)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([count, partners]) => {
        console.log(`  ${count} images: ${partners} partenaires`);
      });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePartnerImages();
