import { PrismaClient } from '@prisma/client'
import { put, del } from '@vercel/blob'
import fetch from 'node-fetch'

const prisma = new PrismaClient()

async function migratePhotos() {
  console.log('Starting photo migration to /albums/ structure...')
  
  try {
    // Get all existing photos
    const photos = await prisma.userPhoto.findMany({
      where: {
        url: {
          contains: 'blob.vercel-storage.com'
        }
      }
    })
    
    console.log(`Found ${photos.length} photos to migrate`)
    
    for (const photo of photos) {
      try {
        console.log(`Migrating photo ${photo.id}...`)
        
        // Download the current image
        const response = await fetch(photo.url)
        if (!response.ok) {
          console.warn(`Failed to download ${photo.url}: ${response.status}`)
          continue
        }
        
        const buffer = Buffer.from(await response.arrayBuffer())
        
        // Generate new filename
        const urlParts = photo.url.split('/')
        const oldFilename = urlParts[urlParts.length - 1]
        const newFilename = `albums/${oldFilename}`
        
        // Upload to new location
        const newBlob = await put(newFilename, buffer, {
          access: 'public',
          contentType: photo.mimeType,
        })
        
        // Update database record
        await prisma.userPhoto.update({
          where: { id: photo.id },
          data: { url: newBlob.url }
        })
        
        // Delete old blob
        try {
          await del(photo.url)
          console.log(`✓ Migrated and deleted old: ${photo.id}`)
        } catch (deleteError) {
          console.warn(`⚠ Migrated but failed to delete old: ${photo.id}`, deleteError)
        }
        
      } catch (error) {
        console.error(`✗ Failed to migrate photo ${photo.id}:`, error)
      }
    }
    
    console.log('Migration completed!')
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migratePhotos()
