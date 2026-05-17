import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

async function main() {
  const db = createClient({ url: "file:./dev.db" });
  const hash = await bcrypt.hash("admin123", 10);

  // Admin
  await db.execute("INSERT OR REPLACE INTO User (id, name, email, password, role, isActive, createdAt, updatedAt) VALUES (1, 'Administrador', 'admin@lacafeta.com', ?, 'ADMIN', 1, datetime('now'), datetime('now'))", [hash]);
  console.log("Admin OK");

  // Delete old employees
  await db.execute("DELETE FROM ShiftDebt");
  await db.execute("DELETE FROM ShiftSwap");
  await db.execute("DELETE FROM ShiftAssignment");
  await db.execute("DELETE FROM ProtocolCompletion");
  await db.execute("DELETE FROM Protocol");
  await db.execute("DELETE FROM SaleItem");
  await db.execute("DELETE FROM SaleTransaction");
  await db.execute("DELETE FROM Inventory");
  await db.execute("DELETE FROM Product");
  await db.execute("DELETE FROM Shift");
  await db.execute("DELETE FROM User WHERE role = 'EMPLOYEE'");
  console.log("Old data cleared");

  // Employees
  const names = ["Adri","Kawtar","Canario","Aitana","Claudia","Málaga","Luca","Sofía","Elías","Villasante","Jose G","Ángel","Diego S","Bakr","Abrey","Vittorio","Lastra","Spark 1","Spark 2"];
  let nextId = 2;
  for (const n of names) {
    await db.execute("INSERT INTO User (id, name, email, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'EMPLOYEE', 1, datetime('now'), datetime('now'))", 
      [nextId++, n, n.toLowerCase().replace(/\s/g,'')+"@lacafeta.com", hash]);
  }
  console.log(names.length + " employees");

  // Products
  const pg = [
    {t:'["cafe","caliente"]', i:[["Cafe con leche pequeño",1.2],["Cafe con leche grande",1.5],["Cafe sin lactosa pequeño",1.2],["Cafe sin lactosa grande",1.5],["Cafe americano pequeño",1.2],["Cafe americano grande",1.5],["Cafe solo pequeño",1],["Cafe solo grande",1.2],["Espresso",1.2],["ColaCao",1.5],["ColaCao sin lactosa",1.5],["Cafe avena grande",1.8]]},
    {t:'["comida","bocadillo"]', i:[["Sandwich pavo y queso",2.5],["Bocata lomo y queso",4],["Bocata jamón",3.5],["Bocata tortilla",4],["Croissant pavo y queso",2.5],["Croissant a la plancha",1.5],["Bocadillo lomo aceite y tomate",4]]},
    {t:'["comida","tostada"]', i:[["Tostada jamón",2],["Tostada tomate y aceite",1.5],["Tostada mantequilla y mermelada",1.2]]},
    {t:'["comida","caliente"]', i:[["Pincho tortilla",1.5],["Gofre",2],["Pizza",2.5]]},
    {t:'["comida","pack"]', i:[["Pack desayuno sandwich",3.5],["Pack desayuno tostada",2.5],["Pack dulce",2],["Pack comida lomo",5],["Pack comida tortilla",4.5],["Pack TLS",3.5]]},
    {t:'["bebida","frio"]', i:[["Agua",1],["Coca Cola",1.5],["Coca Cola Zero",1.5],["Cerveza",2],["Nestea",1.5],["Aquarius limón",1.5],["Fanta naranja",1.5]]},
    {t:'["bebida","energy"]', i:[["Redbull sin azucar",2.5],["Redbull naranja",2.5],["Redbull blanco",2.5]]},
    {t:'["snack","dulce"]', i:[["Galleta",0.5],["Huesitos",1],["Barrita proteinas",1.5]]},
    {t:'["bebida","caliente"]', i:[["Te",1.2]]},
  ];
  let prodId = 1;
  for (const g of pg) {
    for (const [n, p] of g.i) {
      await db.execute("INSERT INTO Product (id, name, price, tags, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))", [prodId, n, p, g.t, ""]);
      await db.execute("INSERT INTO Inventory (id, productId, stock, minStock, unit, updatedAt) VALUES (?, ?, 20, 5, 'unidad', datetime('now'))", [prodId, prodId]);
      prodId++;
    }
  }
  const prodCount = prodId - 1;
  console.log(prodCount + " products");

  // Shifts
  const shifts = [["Mañana","09:00","13:00","1,2,3,4,5"],["Mañana Corta","09:00","12:00","2,4"],["Mediodía","12:00","15:00","2,4"],["Tarde","13:00","17:00","1,3"],["Tarde Corta","15:00","17:00","2"],["Tarde Larga","15:00","19:00","4"]];
  for (const [n,st,et,d] of shifts) {
    await db.execute("INSERT INTO Shift (name, startTime, endTime, daysOfWeek, createdAt) VALUES (?, ?, ?, ?, datetime('now'))", [n, st, et, d]);
  }
  console.log(shifts.length + " shifts");

  console.log("✅ Done!");
}

main().catch(e=>{console.error(e); process.exit(1)});
