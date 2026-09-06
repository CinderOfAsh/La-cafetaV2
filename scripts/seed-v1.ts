// La Cafeta V2 — Seed V1
// Poblado con datos del Excel databaseV1.xlsx (3 primeras hojas: USERS, Product, RawMaterial).
// Solo lo necesario para arrancar la web — turnos, recetas, etc. se harán en seeds siguientes.
//
// Cómo correrlo:
//   npm run db:push     # crea schema en BD
//   npm run db:generate # genera Prisma Client
//   npx tsx scripts/seed-v1.ts
//
// Es idempotente: si corres 2 veces, limpia lo que creó esta versión y vuelve a poblar.

import { PrismaClient } from '@prisma/client'

// Cliente propio del seed (evita tocar db.ts que tiene top-level await incompatible con CJS)
const db = new PrismaClient()

// ---------- Constantes de la hoja USERS ----------
// Bakr: ADMIN, password "0009" = la del PANEL DE ADMIN (no suya personal).
// Resto: EMPLOYEE, sin password.
const USERS: { name: string; email: string; role: 'ADMIN' | 'EMPLOYEE'; password: string }[] = [
  { name: 'Bakr',    email: 'mohammadbakr.ouahid@alumni.mondragon.edu', role: 'ADMIN',    password: '0009' },
  { name: 'Aitana',  email: 'aitana.gonzalez@alumni.mondragon.edu',     role: 'EMPLOYEE', password: ''    },
  { name: 'Angel',   email: 'angel.rodriguez@alumni.mondragon.edu',     role: 'EMPLOYEE', password: ''    },
  { name: 'Adrian',  email: 'adrian.navarro@alumni.mondragon.edu',      role: 'EMPLOYEE', password: ''    },
  { name: 'Claudia', email: 'claudia.gordo@alumni.mondragon.edu',       role: 'EMPLOYEE', password: ''    },
  { name: 'Elias',   email: 'eliasbenjamin.vicen@alumni.mondragon.edu', role: 'EMPLOYEE', password: ''    },
  { name: 'Diego S', email: 'diego.sanchezg@alumni.mondragon.edu',      role: 'EMPLOYEE', password: ''    },
  { name: 'Diego V', email: 'diego.villasante@alumni.mondragon.edu',    role: 'EMPLOYEE', password: ''    },
  { name: 'Hugo',    email: 'hugonicholas.abrey@alumni.mondragon.edu',  role: 'EMPLOYEE', password: ''    },
  { name: 'Jose G',  email: 'josefrancisco.gomez@alumni.mondragon.edu',role: 'EMPLOYEE', password: ''    },
  { name: 'Javi C',  email: 'javier.diazn@alumni.mondragon.edu',        role: 'EMPLOYEE', password: ''    },
  { name: 'Javi M',  email: 'franciscojavier.garg@alumni.mondragon.edu',role: 'EMPLOYEE', password: ''    },
  { name: 'Kawtar',  email: 'kawtar.mellass@alumni.mondragon.edu',      role: 'EMPLOYEE', password: ''    },
  { name: 'Luca',    email: 'luca.rodriguez@alumni.mondragon.edu',      role: 'EMPLOYEE', password: ''    },
  { name: 'Sofía',   email: 'sofia.villabrille@alumni.mondragon.edu',   role: 'EMPLOYEE', password: ''    },
  { name: 'Vittorio',email: 'vittorioniccola.camp@alumni.mondragon.edu',role: 'EMPLOYEE', password: ''    },
]

// ---------- Constantes de la hoja Product ----------
// Precios con punto decimal (Prisma Float).
// Tags respetando "coñas" del Excel (sofía, Yugo, Jose_Adri_Aitana, agua bendita, comida de niños...).
// Corissant → Croissant (typo tuyo).
// Imagen repetida para productos normales; imágenes únicas de genius.com para packs.
const IMG_PRODUCTO =
  'https://imgs.search.brave.com/1KFqvjAAgwOVTHmBvYMg-W705_4tusJKwBRTgf1LLsE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41NDE1/NTk4MzI3LjIzOTcv/cmFmLDM2MHgzNjAs/MDc1LHQsZmFmYWZh/OmNhNDQzZjQ3ODYu/dTUuanBn'

interface ProductInput {
  name: string
  price: number
  tags: string[]
  imageUrl: string | null
}

const PRODUCTS: ProductInput[] = [
  // Comida (sándwiches, tostadas, pinchos)
  { name: 'Sandwich pavo y queso',          price: 2.50, tags: ['bocadillo', 'caliente', 'salado'],       imageUrl: IMG_PRODUCTO },
  { name: 'Tostada mantequilla y mermelada',price: 2.00, tags: ['bocadillo', 'dulce'],                    imageUrl: IMG_PRODUCTO },
  { name: 'Tostada tomate y aceite',        price: 2.00, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
  { name: 'Tostada jamón',                  price: 2.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
  { name: 'Pincho tortilla',                price: 1.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
  { name: 'Croissant a la plancha',         price: 1.50, tags: ['Croissant', 'dulce', 'salado', 'caliente'], imageUrl: IMG_PRODUCTO },
  { name: 'Bocata lomo y queso',            price: 3.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
  { name: 'Bocata jamón',                   price: 3.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
  { name: 'Bocata tortilla',                price: 3.50, tags: ['bocadillo', 'salado'],                   imageUrl: IMG_PRODUCTO },
  { name: 'Gofre',                          price: 2.50, tags: ['postre', 'dulce'],                       imageUrl: IMG_PRODUCTO },
  { name: 'Croissant pavo y queso',         price: 2.50, tags: ['Croissant', 'dulce', 'salado'],         imageUrl: IMG_PRODUCTO },
  { name: 'Pizza',                          price: 3.00, tags: ['caliente', 'bocadillo'],                 imageUrl: IMG_PRODUCTO },
  { name: 'Palitos de queso',               price: 2.50, tags: ['frito', 'cliente', 'Jose_Adri_Aitana', 'comida de niños'], imageUrl: IMG_PRODUCTO },

  // Bebidas calientes
  { name: 'Café con leche pequeño',        price: 1.20, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
  { name: 'Café sin lactosa pequeño',       price: 1.20, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
  { name: 'Café americano pequeño',         price: 1.20, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
  { name: 'Café solo pequeño',              price: 1.20, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
  { name: 'ColaCao',                        price: 1.20, tags: ['bebida', 'caliente', 'frio', 'dulce'],   imageUrl: IMG_PRODUCTO },
  { name: 'ColaCao sin lactosa',            price: 1.20, tags: ['bebida', 'caliente', 'frio', 'dulce'],   imageUrl: IMG_PRODUCTO },
  { name: 'Café con leche grande',          price: 1.50, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
  { name: 'Café sin lactosa grande',        price: 1.50, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
  { name: 'Café americano grande',          price: 1.50, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
  { name: 'Café solo grande',               price: 1.50, tags: ['bebida', 'caliente', 'cafe'],            imageUrl: IMG_PRODUCTO },
  { name: 'Té',                             price: 1.20, tags: ['bebida', 'caliente'],                    imageUrl: IMG_PRODUCTO },

  // Bebidas frías
  { name: 'Agua',                           price: 1.00, tags: ['bebida', 'frio'],                        imageUrl: IMG_PRODUCTO },
  { name: 'Coca-Cola',                      price: 1.20, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
  { name: 'Coca-Cola Zero',                 price: 1.20, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
  { name: 'Red Bull sin azúcar',            price: 1.70, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
  { name: 'Red Bull naranja',               price: 1.70, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
  { name: 'Red Bull blanco',                price: 1.70, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
  { name: 'Cerveza',                        price: 1.50, tags: ['bebida', 'refresco', 'agua bendita', 'frio'], imageUrl: IMG_PRODUCTO },
  { name: 'Fanta de naranja',               price: 1.20, tags: ['bebida', 'refresco', 'dulce', 'frio'],   imageUrl: IMG_PRODUCTO },
  { name: 'Aquarius de limón',              price: 1.20, tags: ['sofía', 'bebida', 'fria', 'dulce'],      imageUrl: IMG_PRODUCTO },
  { name: 'Nestea',                         price: 1.20, tags: ['Sofía', 'bebida', 'fria', 'dulce'],      imageUrl: IMG_PRODUCTO },

  // Packs (imágenes únicas de genius.com — versiones finales)
  { name: 'Pack desayuno sandwich',         price: 3.00, tags: ['pack'],
    imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2F7d30d51bf406648812f0c7ffaeb1ff42.1000x1000x1.png' },
  { name: 'Pack desayuno tostada',          price: 2.70, tags: ['pack'],
    imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2Fee777db36c1e6a87809f3280c190ab9c.1000x1000x1.png' },
  { name: 'Pack dulce',                     price: 3.25, tags: ['pack'],
    imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2F1bb36868bb2b7bb0b8b3dbc9c92ac62c.1000x1000x1.png' },
  { name: 'Pack TLS',                       price: 2.25, tags: ['pack'],
    imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2Fa02e62a211860be7e9eeba1e4b05fb8b.1000x1000x1.jpg' },
  { name: 'Pack comida lomo',               price: 4.75, tags: ['pack'],
    imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2F0f7f84ec4e47f6c89e9066225fbe16b0.1000x1000x1.png' },
  { name: 'Pack comida tortilla',           price: 4.75, tags: ['pack'],
    imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2Fb30a054c6bc082c407f04b227b1cda2b.1000x1000x1.png' },
  { name: 'Pack LEINN',                     price: 4.00, tags: ['pack'],
    imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2Fd5cfd7f6208861a053a51b3bbb62624c.1000x1000x1.png' },
  { name: 'Pack Bakr',                      price: 3.00, tags: ['pack'],
    imageUrl: 'https://t2.genius.com/unsafe/504x0/https%3A%2F%2Fimages.genius.com%2F2037d9946a064f461b5c45eeb452fcac.1000x1000x1.png' },
]

// ---------- Constantes de la hoja RawMaterial ----------
// Stock inicial = 0 (lo rellenarás con la primera compra). minStock = 10.
// Fila 33 vacía del Excel → omitida.
interface RawInput { name: string; unit: string; minStock: number }
const RAW: RawInput[] = [
  // Materias primas "de producto"
  { name: 'pan de molde',           unit: 'ud',     minStock: 10 },
  { name: 'pavo',                    unit: 'ud',     minStock: 10 },
  { name: 'queso en lonchas',       unit: 'ud',     minStock: 10 },
  { name: 'pan para tostadas',       unit: 'ud',     minStock: 10 },
  { name: 'mantequilla',             unit: 'gramo',  minStock: 10 },
  { name: 'mermelada',               unit: 'ud',     minStock: 10 },
  { name: 'jamon',                   unit: 'ud',     minStock: 10 },
  { name: 'tortilla',                unit: 'ud',     minStock: 10 },
  { name: 'pan para pinchos',        unit: 'ud',     minStock: 10 },
  { name: 'croissant',               unit: 'ud',     minStock: 10 },
  { name: 'lomo',                    unit: 'ud',     minStock: 10 },
  { name: 'gofre',                   unit: 'ud',     minStock: 10 },
  { name: 'capsula de cafe doble',   unit: 'ud',     minStock: 10 },
  { name: 'leche semi',              unit: 'litro',  minStock: 10 },
  { name: 'leche sin lactosa',       unit: 'litro',  minStock: 10 },
  { name: 'leche de avena',          unit: 'litro',  minStock: 10 },
  { name: 'colacao',                 unit: 'ud',     minStock: 10 },
  { name: 'agua',                    unit: 'ud',     minStock: 10 },
  { name: 'coca-cola',               unit: 'ud',     minStock: 10 },
  { name: 'coca-cola Zero',          unit: 'ud',     minStock: 10 },
  { name: 'Red Bull sin azucar',     unit: 'ud',     minStock: 10 },
  { name: 'Red Bull naranja',        unit: 'ud',     minStock: 10 },
  { name: 'Red Bull blanco',         unit: 'ud',     minStock: 10 },
  { name: 'cerveza',                 unit: 'ud',     minStock: 10 },
  { name: 'fanta naranja',           unit: 'ud',     minStock: 10 },
  { name: 'te',                      unit: 'ud',     minStock: 10 },
  { name: 'aquarius de limon',       unit: 'ud',     minStock: 10 },
  { name: 'Nestea',                  unit: 'ud',     minStock: 10 },
  { name: 'Pizza',                   unit: 'ud',     minStock: 10 },
  { name: 'palitos de queso',        unit: 'ud',     minStock: 10 },
  { name: 'patatas',                 unit: 'ud',     minStock: 10 },
  { name: 'capsulas de cafe descafeinado', unit: 'ud', minStock: 10 },
  // Consumibles
  { name: 'platos',                  unit: 'ud',     minStock: 10 },
  { name: 'vasos pequeños',          unit: 'ud',     minStock: 10 },
  { name: 'vasos medianos',          unit: 'ud',     minStock: 10 },
  { name: 'vasos grandes',           unit: 'ud',     minStock: 10 },
  { name: 'tapas grandes',           unit: 'ud',     minStock: 10 },
  { name: 'palillos',                unit: 'ud',     minStock: 10 },
  { name: 'tenedor de madera',       unit: 'ud',     minStock: 10 },
  { name: 'cuchara de madera',       unit: 'ud',     minStock: 10 },
  { name: 'cuchillo de madera',      unit: 'ud',     minStock: 10 },
  { name: 'papel de horno',          unit: 'ud',     minStock: 10 },
  { name: 'pegatinas',               unit: 'ud',     minStock: 10 },
  { name: 'papel film',              unit: 'ud',     minStock: 10 },
  { name: 'servilletas',             unit: 'ud',     minStock: 10 },
  // Limpieza
  { name: 'quitagrasas',             unit: 'litro',  minStock: 10 },
  { name: 'jabon',                   unit: 'litro',  minStock: 10 },
  { name: 'balletas',                unit: 'litro',  minStock: 10 },
]

// ---------- Runner ----------
async function main() {
  console.log('🌱 Seed V1 — USERS + Product + RawMaterial')
  console.log(`   Productos: ${PRODUCTS.length}`)
  console.log(`   Usuarios:  ${USERS.length} (1 admin + ${USERS.length - 1} employees)`)
  console.log(`   Materias: ${RAW.length}`)

  // Limpieza (orden importa por FK: primero las hijas, luego las madres).
  // Esto es seguro porque las tablas referenciadas (Shift, Protocol, etc.) no se tocan.
  await db.purchaseItem.deleteMany({})
  await db.purchase.deleteMany({})
  await db.saleItem.deleteMany({})
  await db.saleTransaction.deleteMany({})
  await db.productRecipe.deleteMany({})
  await db.product.deleteMany({})
  await db.rawMaterial.deleteMany({})
  await db.user.deleteMany({})

  // 1) Users
  for (const u of USERS) {
    await db.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        isActive: true,
        customFields: '{}',
      },
    })
  }
  console.log(`✓ Users: ${USERS.length}`)

  // 2) Products
  for (const p of PRODUCTS) {
    await db.product.create({
      data: {
        name: p.name,
        price: p.price,
        tags: JSON.stringify(p.tags),
        imageUrl: p.imageUrl,
        description: null,
        isActive: true,
        customFields: '{}',
      },
    })
  }
  console.log(`✓ Products: ${PRODUCTS.length}`)

  // 3) RawMaterials (stock inicial 0)
  for (const r of RAW) {
    await db.rawMaterial.create({
      data: {
        name: r.name,
        unit: r.unit,
        stock: 0,
        minStock: r.minStock,
      },
    })
  }
  console.log(`✓ RawMaterials: ${RAW.length}`)

  console.log('\n✅ Seed V1 completo.')
  console.log(`   Admin:    Bakr (mohammadbakr.ouahid@alumni.mondragon.edu), password=0009`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
