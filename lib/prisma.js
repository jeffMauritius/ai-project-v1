const { PrismaClient } = require('@prisma/client')

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'],
    errorFormat: 'pretty'
  })
}

const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

module.exports = { prisma }
