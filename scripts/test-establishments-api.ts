import fetch from 'node-fetch';

async function testAPI() {
  const types = [
    'Domaine mariage',
    'Château mariage', 
    'Salle mariage',
    'Restaurant mariage',
    'Hôtel mariage',
    'Bateau mariage',
    'Auberge mariage'
  ];
  
  console.log('🧪 Test de l\'API /api/establishments avec différents types...\n');
  
  for (const type of types) {
    try {
      const encodedType = encodeURIComponent(type);
      const url = `http://localhost:3000/api/establishments?page=1&limit=1&type=${encodedType}`;
      
      console.log(`📝 Test: "${type}"`);
      console.log(`🔗 URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`📊 Résultat: ${data.total} établissements`);
      console.log(`✅ Status: ${response.status}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Erreur pour "${type}":`, error.message);
      console.log('');
    }
  }
}

testAPI();
