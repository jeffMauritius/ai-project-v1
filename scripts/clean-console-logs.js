#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fonction pour nettoyer les console.log d'un fichier
function cleanConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Supprimer les console.log simples (une ligne)
    const simpleLogRegex = /^\s*console\.log\([^;]*\);\s*$/gm;
    if (simpleLogRegex.test(content)) {
      content = content.replace(simpleLogRegex, '');
      modified = true;
    }

    // Supprimer les console.log avec template literals sur plusieurs lignes
    const multiLineLogRegex = /^\s*console\.log\(`[^`]*`[^;]*\);\s*$/gm;
    if (multiLineLogRegex.test(content)) {
      content = content.replace(multiLineLogRegex, '');
      modified = true;
    }

    // Supprimer les console.log avec des objets simples
    const objectLogRegex = /^\s*console\.log\([^,)]+\);\s*$/gm;
    if (objectLogRegex.test(content)) {
      content = content.replace(objectLogRegex, '');
      modified = true;
    }

    // Supprimer les lignes vides supplémentaires
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (modified) {
      fs.writeFileSync(filePath, content);

      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
    return false;
  }
}

// Fonction récursive pour parcourir les dossiers
function walkDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Ignorer node_modules et .next
        if (!['node_modules', '.next', '.git'].includes(item)) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

// Dossier racine du projet
const projectRoot = process.cwd();

// Trouver tous les fichiers TypeScript/JavaScript
const files = walkDirectory(projectRoot);

let cleanedCount = 0;
let totalCount = 0;

for (const file of files) {
  totalCount++;
  if (cleanConsoleLogs(file)) {
    cleanedCount++;
  }
}

