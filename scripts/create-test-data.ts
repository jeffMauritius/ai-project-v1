import fs from 'fs'
import path from 'path'

interface TestVenue {
  url: string
  name: string
  type: string
  description: string
  images: string[]
  price: string
  address: string
  city: string
  region: string
  capacity: string
  rating: string
}

interface TestVendor {
  url: string
  name: string
  type: string
  description: string
  images: string[]
  price: string
  address: string
  city: string
  region: string
  rating: string
  services: string[]
}

class TestDataGenerator {
  private dataDir: string

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data')
  }

  async generateTestData() {
    console.log('🧪 Génération des données de test...')
    
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }

    // Générer les lieux de test
    await this.generateTestVenues()
    
    // Générer les prestataires de test
    await this.generateTestVendors()
    
    console.log('✅ Données de test générées avec succès !')
  }

  private async generateTestVenues() {
    console.log('🏛️  Génération de 10 lieux de test...')
    
    const venues: TestVenue[] = []
    
    for (let i = 1; i <= 10; i++) {
      const venue: TestVenue = {
        url: `https://www.mariages.net/test-venue-${i}`,
        name: `Domaine de Test ${i}`,
        type: 'Domaine mariage',
        description: `Magnifique domaine de test ${i} situé dans un cadre idyllique. Parfait pour célébrer votre mariage dans un environnement exceptionnel. Ce domaine offre des espaces intérieurs et extérieurs pour tous vos besoins.`,
        images: [
          `https://cdn0.mariages.net/test/venue-${i}-main.jpg`,
          `https://cdn0.mariages.net/test/venue-${i}-gallery-1.jpg`,
          `https://cdn0.mariages.net/test/venue-${i}-gallery-2.jpg`,
          `https://cdn0.mariages.net/test/venue-${i}-gallery-3.jpg`,
          `https://cdn0.mariages.net/test/venue-${i}-gallery-4.jpg`
        ],
        price: `À partir de ${(15000 + i * 1000)}€`,
        address: `· Test City ${i}, Test Region`,
        city: `· Test City ${i}`,
        region: `Test Region ${i}`,
        capacity: `${50 + i * 10} - ${100 + i * 20} Invités`,
        rating: `${4.5 + (i % 5) * 0.1} (${10 + i * 5})`
      }
      
      venues.push(venue)
    }
    
    const venuesData = { venues }
    const venuesPath = path.join(this.dataDir, 'venues.json')
    fs.writeFileSync(venuesPath, JSON.stringify(venuesData, null, 2))
    
    console.log(`✅ ${venues.length} lieux générés dans venues.json`)
  }

  private async generateTestVendors() {
    console.log('👥 Génération de 10 prestataires par catégorie...')
    
    const vendorTypes = [
      { file: 'photographers.json', type: 'photographer', serviceName: 'Photographe' },
      { file: 'caterers.json', type: 'caterer', serviceName: 'Traiteur' },
      { file: 'decorators.json', type: 'decorator', serviceName: 'Décorateur' },
      { file: 'videographers.json', type: 'videographer', serviceName: 'Vidéaste' },
      { file: 'music-vendors.json', type: 'music', serviceName: 'DJ/Musicien' },
      { file: 'suits.json', type: 'suit', serviceName: 'Costume' },
      { file: 'wedding-cakes.json', type: 'cake', serviceName: 'Wedding Cake' },
      { file: 'honeymoon.json', type: 'honeymoon', serviceName: 'Lune de Miel' },
      { file: 'entertainment.json', type: 'entertainment', serviceName: 'Animation' },
      { file: 'invitations.json', type: 'invitation', serviceName: 'Faire-part' },
      { file: 'organization.json', type: 'organization', serviceName: 'Organisation' },
      { file: 'gifts.json', type: 'gift', serviceName: 'Cadeaux Invités' },
      { file: 'officiants.json', type: 'officiant', serviceName: 'Officiant' },
      { file: 'florist-decoration.json', type: 'florist', serviceName: 'Fleuriste' },
      { file: 'transport.json', type: 'transport', serviceName: 'Transport' },
      { file: 'beauty.json', type: 'beauty', serviceName: 'Beauté' },
      { file: 'dresses.json', type: 'dress', serviceName: 'Robe' },
      { file: 'florists.json', type: 'florist', serviceName: 'Fleuriste' },
      { file: 'jewelry.json', type: 'jewelry', serviceName: 'Bijoux' },
      { file: 'wine-spirits.json', type: 'wine', serviceName: 'Vins & Spiritueux' }
    ]
    
    for (const vendorType of vendorTypes) {
      await this.generateVendorsForType(vendorType)
    }
  }

  private async generateVendorsForType(vendorType: {
    file: string
    type: string
    serviceName: string
  }) {
    const vendors: TestVendor[] = []
    
    for (let i = 1; i <= 10; i++) {
      const vendor: TestVendor = {
        url: `https://www.mariages.net/test-${vendorType.type}-${i}`,
        name: `${vendorType.serviceName} Test ${i}`,
        type: vendorType.type,
        description: `Professionnel ${vendorType.serviceName.toLowerCase()} de test ${i} avec plus de ${5 + i} ans d'expérience. Spécialisé dans la création de moments inoubliables pour votre mariage.`,
        images: [
          `https://cdn0.mariages.net/test/${vendorType.type}-${i}-main.jpg`,
          `https://cdn0.mariages.net/test/${vendorType.type}-${i}-gallery-1.jpg`,
          `https://cdn0.mariages.net/test/${vendorType.type}-${i}-gallery-2.jpg`,
          `https://cdn0.mariages.net/test/${vendorType.type}-${i}-gallery-3.jpg`
        ],
        price: i % 3 === 0 ? `À partir de ${(500 + i * 100)}€` : '',
        address: `· Test City ${i}, Test Region`,
        city: `· Test City ${i}`,
        region: `Test Region ${i}`,
        rating: `${4.0 + (i % 6) * 0.2} (${5 + i * 3})`,
        services: this.generateServicesForType(vendorType.type, i)
      }
      
      vendors.push(vendor)
    }
    
    const vendorsData = { vendors }
    const vendorsPath = path.join(this.dataDir, vendorType.file)
    fs.writeFileSync(vendorsPath, JSON.stringify(vendorsData, null, 2))
    
    console.log(`✅ ${vendors.length} ${vendorType.serviceName}s générés dans ${vendorType.file}`)
  }

  private generateServicesForType(type: string, index: number): string[] {
    const serviceMap: Record<string, string[]> = {
      photographer: ['Reportage photo', 'Album photo', 'Séance de couple', 'Photos de groupe'],
      caterer: ['Cocktail', 'Dîner de mariage', 'Buffet', 'Service en salle'],
      decorator: ['Décoration florale', 'Décoration de table', 'Décoration de salle', 'Éclairage'],
      videographer: ['Film de mariage', 'Teaser', 'Film institutionnel', 'Montage vidéo'],
      music: ['DJ', 'Groupe live', 'Playlist personnalisée', 'Animation musicale'],
      suit: ['Costume sur mesure', 'Location costume', 'Accessoires', 'Retouche'],
      cake: ['Wedding cake', 'Cupcakes', 'Macarons', 'Desserts personnalisés'],
      honeymoon: ['Séjour romantique', 'Voyage organisé', 'Hôtel de luxe', 'Activités'],
      entertainment: ['Animation soirée', 'Spectacle', 'Jeux', 'Photobooth'],
      invitation: ['Faire-part personnalisé', 'Cartes de table', 'Menu', 'Programme'],
      organization: ['Wedding planning', 'Coordination', 'Logistique', 'Gestion budget'],
      gift: ['Cadeaux personnalisés', 'Packaging', 'Livraison', 'Personnalisation'],
      officiant: ['Cérémonie laïque', 'Cérémonie religieuse', 'Rituels', 'Discours'],
      florist: ['Bouquet de mariée', 'Décoration florale', 'Boutonnières', 'Centres de table'],
      transport: ['Location voiture', 'Chauffeur', 'Limousine', 'Navette'],
      beauty: ['Coiffure', 'Maquillage', 'Manucure', 'Soins'],
      dress: ['Robe de mariée', 'Essayage', 'Retouche', 'Accessoires'],
      jewelry: ['Alliance', 'Bague de fiançailles', 'Bijoux', 'Montre'],
      wine: ['Sélection vins', 'Champagne', 'Cocktails', 'Service']
    }
    
    const services = serviceMap[type] || ['Service personnalisé', 'Conseil', 'Devis gratuit']
    return services.slice(0, 3) // Retourner 3 services maximum
  }

  async printTestDataSummary() {
    console.log('\n📊 Résumé des données de test générées:')
    
    const files = fs.readdirSync(this.dataDir).filter(file => file.endsWith('.json'))
    
    for (const file of files) {
      const filePath = path.join(this.dataDir, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      
      if (file === 'venues.json') {
        console.log(`🏛️  ${file}: ${data.venues?.length || 0} lieux`)
      } else {
        console.log(`👥 ${file}: ${data.vendors?.length || 0} prestataires`)
      }
    }
    
    const totalVenues = files.includes('venues.json') ? 10 : 0
    const totalVendors = files.filter(f => f !== 'venues.json').length * 10
    
    console.log(`\n📈 Total: ${totalVenues} lieux + ${totalVendors} prestataires = ${totalVenues + totalVendors} entités`)
    console.log(`🖼️  Images estimées: ${(totalVenues + totalVendors) * 4} images`)
    console.log(`🔐 Identifiants de connexion: ${totalVenues + totalVendors} comptes créés`)
    console.log(`📧 Emails: {entity-id}@monmariage.ai`)
    console.log(`🔑 Mot de passe: Test123456!`)
  }
}

// Exécution du script
if (require.main === module) {
  const generator = new TestDataGenerator()
  
  generator.generateTestData()
    .then(async () => {
      await generator.printTestDataSummary()
      console.log('\n🎉 Données de test prêtes pour la migration !')
      console.log('\n🚀 Prochaines étapes:')
      console.log('1. npm run migration:setup')
      console.log('2. npm run migration:full')
    })
    .catch((error) => {
      console.error('💥 Erreur lors de la génération:', error)
      process.exit(1)
    })
}

export { TestDataGenerator }
