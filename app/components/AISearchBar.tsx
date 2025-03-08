'use client'

import { PaperAirplaneIcon, MicrophoneIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'

export default function AISearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [animatingTag, setAnimatingTag] = useState<{ text: string, rect: DOMRect } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/results?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleTagClick = async (text: string, e: React.MouseEvent) => {
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const inputRect = inputRef.current?.getBoundingClientRect()
    
    if (!inputRect) return
    
    setAnimatingTag({ 
      text,
      rect: buttonRect
    })
    
    // Retarder et animer l'apparition du texte caractère par caractère
    let currentText = ''
    const chars = text.split('')
    
    // Attendre que l'animation du tag commence
    setTimeout(() => {
      const interval = setInterval(() => {
        if (currentText.length < chars.length) {
          currentText += chars[currentText.length]
          setSearchQuery(currentText)
        } else {
          clearInterval(interval)
        }
      }, 50) // 50ms entre chaque caractère
    }, 800) // Attendre 800ms avant de commencer
    
    setTimeout(() => {
      setAnimatingTag(null)
      inputRef.current?.focus()
    }, 2500)
  }

  return (
    <div className="w-full max-w-4xl">
      <form className="relative flex items-center" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-3xl border-none py-8 pl-8 pr-32 text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-lg ring-1 ring-inset ring-gray-100 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-pink-500/50 hover:ring-pink-500/30 transition-all text-lg"
          placeholder="Décrivez ce que vous recherchez..."
        />
        <div className="absolute right-16 flex gap-2">
          <button 
            type="button"
            className="p-2 rounded-xl text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Commande vocale"
          >
            <MicrophoneIcon className="h-5 w-5" />
          </button>
          <button 
            type="button"
            className="p-2 rounded-xl text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Ajouter un fichier"
          >
            <DocumentPlusIcon className="h-5 w-5" />
          </button>
        </div>
        <button 
          type="submit" 
          className="absolute right-4 p-2 rounded-xl bg-pink-600 hover:bg-pink-500 transition-colors"
        >
          <PaperAirplaneIcon className="h-5 w-5 text-white" />
        </button>
      </form>
      {pathname === '/' && <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
        <div className="flex flex-wrap gap-2 pb-2">
          {[
            { text: "Château avec jardin près de Paris", delay: 0 },
            { text: "Photographe style reportage", delay: 0.1 },
            { text: "Traiteur cuisine française", delay: 0.2 },
            { text: "Salle de réception champêtre", delay: 0.3 },
            { text: "DJ ambiance lounge", delay: 0.4 },
            { text: "Fleuriste bouquet bohème", delay: 0.5 },
            { text: "Wedding planner bilingue", delay: 0.6 },
            { text: "Robe de mariée sur mesure", delay: 0.7 },
            { text: "Domaine viticole Bordeaux", delay: 0.8 },
            { text: "Orchestre jazz manouche", delay: 0.9 },
            { text: "Décorateur thème champêtre", delay: 1.0 },
            { text: "Voiture collection mariage", delay: 1.1 },
            { text: "Maquilleur professionnel", delay: 1.2 },
            { text: "Lieu insolite Paris", delay: 1.3 }
          ].map(({ text, delay }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.5 }}
            >
              <motion.button
                onClick={(e) => handleTagClick(text, e)}
                className="flex-shrink-0 rounded-full bg-gray-50/50 dark:bg-gray-800 px-4 py-2 hover:bg-pink-50 dark:hover:bg-gray-700 hover:text-pink-600 dark:hover:text-pink-400 transition-colors text-xs relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  style={{
                    display: 'inline-block',
                    willChange: 'transform'
                  }}
                  animate={animatingTag?.text === text ? {
                    y: [0, -100, -50],
                    x: [0, 50, 100],
                    scale: [1, 1.5, 0.8],
                    opacity: [1, 1, 0],
                    rotate: [0, -10, -20],
                  } : undefined}
                  transition={{
                    duration: 2,
                    ease: [0.19, 1, 0.22, 1]
                  }}
                >
                  {text}
                </motion.span>
                {animatingTag?.text === text && (
                  <motion.span
                    className="absolute left-0 top-0 w-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5], y: -20 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  >
                    ✨
                  </motion.span>
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>}
    </div>
  )
}