import { formatDescription } from './format-descriptions'

// Exemple de description du Château des Bordes
const exampleDescription = `Le Château des Bordes est situé à Urzy, dans la Nièvre. Ses jardins français, italiens, potager et verger sont entourés de murs majestueux. Les salles de réception se trouvent dans les anciennes écuries de la Reine de Pologne et peuvent accueillir jusqu'à 400 personnes assises ou 600 pour des cocktails, avec quatre salons voûtés et lumineux. Une terrasse extérieure face au château est disponible pour les réceptions. Les jardins ont été conçus par Louise d'Ancienville au XVIIe siècle. L'équipe du Château des Bordes propose un service personnalisé pour vos événements comme les mariages.`

console.log('📝 Description originale:')
console.log(exampleDescription)
console.log('\n' + '='.repeat(80) + '\n')

console.log('✨ Description formatée:')
const formattedDescription = formatDescription(exampleDescription)
console.log(formattedDescription)

// Test avec d'autres exemples
const testCases = [
  {
    name: 'Description simple',
    input: 'Ceci est une phrase. Ceci est une autre phrase.',
    expected: 'Ceci est une phrase.\n\nCeci est une autre phrase.'
  },
  {
    name: 'Description avec points multiples',
    input: 'Première phrase. Deuxième phrase. Troisième phrase.',
    expected: 'Première phrase.\n\nDeuxième phrase.\n\nTroisième phrase.'
  },
  {
    name: 'Description vide',
    input: '',
    expected: ''
  },
  {
    name: 'Description sans point',
    input: 'Ceci est une phrase sans point final',
    expected: 'Ceci est une phrase sans point final'
  }
]

console.log('\n' + '='.repeat(80))
console.log('🧪 Tests de la fonction formatDescription:')

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}:`)
  console.log(`   Input: "${testCase.input}"`)
  const result = formatDescription(testCase.input)
  console.log(`   Output: "${result}"`)
  console.log(`   Expected: "${testCase.expected}"`)
  console.log(`   ✅ ${result === testCase.expected ? 'PASS' : 'FAIL'}`)
}) 