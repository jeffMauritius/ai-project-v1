// Test d'accessibilité des URLs Vercel Blob
const testUrls = [
  'https://tngthgmxehdhwfq3.public.blob.vercel-storage.com/partners/68bfa7178ee56a699c75b0fb/960/image-1-rTwsrxxc51v17GXDxNmEdLzTb1kFyc.webp',
  'https://tngthgmxehdhwfq3.public.blob.vercel-storage.com/partners/68bfa7178ee56a699c75b0fb/960/image-2-rTwsrxxc51v17GXDxNmEdLzTb1kFyc.webp',
  'https://tngthgmxehdhwfq3.public.blob.vercel-storage.com/partners/68bfa7178ee56a699c75b0fb/960/image-3-rTwsrxxc51v17GXDxNmEdLzTb1kFyc.webp'
]

async function testImageUrls() {
  console.log('🧪 Test d\'accessibilité des URLs Vercel Blob')
  console.log('============================================')
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i]
    try {
      console.log(`\n${i + 1}. Test de: ${url}`)
      const response = await fetch(url, { method: 'HEAD' })
      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
      console.log(`   Content-Length: ${response.headers.get('content-length')}`)
      
      if (response.status === 200) {
        console.log(`   ✅ Image accessible`)
      } else {
        console.log(`   ❌ Image non accessible`)
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`)
    }
  }
}

testImageUrls().catch(console.error)
