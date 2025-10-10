import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VERCEL_BLOB_BASE_URL = 'https://tngthgmxehdhwfq3.public.blob.vercel-storage.com'

async function updateEstablishmentImageUrls() {
  console.log('🚀 Démarrage de la mise à jour des URLs d\'images 960p pour TOUS les établissements...')

  try {
    const establishmentsToUpdate = await prisma.establishment.findMany({
      select: {
        id: true,
        name: true,
        images: true, // Pour connaître le nombre d'images existantes
      },
    })

    if (establishmentsToUpdate.length === 0) {
      console.log('Aucun établissement trouvé.')
      return
    }

    console.log(`📊 ${establishmentsToUpdate.length} établissements trouvés.`)

    for (let i = 0; i < establishmentsToUpdate.length; i++) {
      const establishment = establishmentsToUpdate[i]
      console.log(`\n📁 [${i + 1}/${establishmentsToUpdate.length}] Traitement de: ${establishment.name} (${establishment.id})`)

      const new960pUrls: string[] = []
      // On suppose que le nombre d'images est le même que celui déjà en base
      // Si images est vide, on peut supposer un nombre par défaut ou ignorer
      const numberOfImages = establishment.images?.length || 0

      if (numberOfImages === 0) {
        console.warn(`  ⚠️  Aucune image existante pour ${establishment.name}. Aucune URL 960p ne sera générée.`)
        continue
      }

      for (let i = 1; i <= numberOfImages; i++) {
        const newUrl = `${VERCEL_BLOB_BASE_URL}/establishments/${establishment.id}/960/image-${i}.webp`
        new960pUrls.push(newUrl)
      }

      // Mettre à jour l'établissement dans la base de données
      await prisma.establishment.update({
        where: { id: establishment.id },
        data: { images: new960pUrls },
      })

      console.log(`  ✅ ${new960pUrls.length} URLs 960p mises à jour pour ${establishment.name}.`)
      
      // Afficher le progrès toutes les 10 établissements
      if ((i + 1) % 10 === 0 || i === establishmentsToUpdate.length - 1) {
        const progressPercent = (((i + 1) / establishmentsToUpdate.length) * 100).toFixed(1)
        console.log(`  📊 Progrès: ${i + 1}/${establishmentsToUpdate.length} établissements (${progressPercent}%)`)
      }
    }

    console.log('\n🎉 Mise à jour des URLs 960p terminée pour TOUS les établissements !')
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des URLs d\'images :', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateEstablishmentImageUrls()
