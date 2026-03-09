import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import { brands } from "./schema/brands";
import { locations } from "./schema/locations";
import { users } from "./schema/users";
import { terminals } from "./schema/terminals";
import { menuCategories, menuItems, modifierGroups, modifierOptions } from "./schema/menu";

// Unsplash direct image URLs (free, no API key needed, 400x400 crop)
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=80`;

const images = {
  // A RAMEN
  tonkotsu:      img("1569718212165-3a8922ada9a4"),
  shoyu:         img("1591814468924-caf88d1232e1"),
  miso:          img("1617093727343-374698b1b08d"),
  tantan:        img("1623341214825-9f4f963727da"),
  vegRamen:      img("1547928578-bca3e90e8e56"),
  gyoza:         img("1496116218417-1a781b1c416c"),
  edamame:       img("1564834724105-918b73033155"),
  karaage:       img("1562967916-eb82221dfb2a"),
  chashuDon:     img("1526318896980-cf78c088247c"),
  katsuDon:      img("1585032226651-759b368d7246"),
  extraChashu:   img("1555939594-58d7cb561ad1"),
  extraEgg:      img("1482049016530-d981e5db9e12"),
  extraNoodles:  img("1612929633738-8fe44f7ec841"),
  icedGreenTea:  img("1556881286-fc6a1e5e0820"),
  ramune:        img("1625772299848-391b6a87d7b3"),
  // Burger Lab
  classicBurger: img("1568901346375-23c9450c58cd"),
  doubleBurger:  img("1553979459-d2229ba7433b"),
  baconBurger:   img("1594212699903-ec8a3eca50f5"),
  mushroomBurger:img("1572802419224-296b0aeee15d"),
  veggieBurger:  img("1520072959219-c595e76c6b92"),
  fries:         img("1573080496219-bb080dd4f877"),
  onionRings:    img("1639024471283-03518883512d"),
  coleslaw:      img("1625938144755-652e08e359b7"),
  vanillaShake:  img("1572490122747-3968b75cc699"),
  chocoShake:    img("1541658016709-82535e94bc69"),
  strawShake:    img("1579954354917-f9fba61a1cee"),
  cola:          img("1554866585-cd94860890b7"),
  sprite:        img("1625772452859-163c51cd81ae"),
  brownie:       img("1606313564200-e75d5e30476c"),
  churros:       img("1624353365286-3f8d62daad51"),
};

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  console.log("Seeding database...");

  // Hash passwords and PINs
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const managerPinHash = await bcrypt.hash("1234", 10);
  const cashier1PinHash = await bcrypt.hash("1111", 10);
  const cashier2PinHash = await bcrypt.hash("2222", 10);

  // --- Brands ---
  const [aramen] = await db
    .insert(brands)
    .values({
      name: "A RAMEN",
      logoUrl: "/brands/aramen-logo.png",
      address: "123 Sukhumvit Rd, Bangkok 10110",
      taxId: "0105564012345",
      serviceChargePct: "10.00",
      vatPct: "7.00",
    })
    .returning();

  const [burgerLab] = await db
    .insert(brands)
    .values({
      name: "Burger Lab",
      logoUrl: "/brands/burgerlab-logo.png",
      address: "456 Silom Rd, Bangkok 10500",
      taxId: "0105564067890",
      serviceChargePct: "0.00",
      vatPct: "7.00",
    })
    .returning();

  console.log(`Created brands: ${aramen.name}, ${burgerLab.name}`);

  // --- Locations ---
  const [aramenLocation] = await db
    .insert(locations)
    .values({
      brandId: aramen.id,
      name: "A RAMEN - Siam Square",
      address: "Siam Square Soi 3, Bangkok",
      settings: {
        printerConfig: { ip: "192.168.1.100", port: 9100 },
        tableCount: 15,
      },
    })
    .returning();

  const [burgerLabLocation] = await db
    .insert(locations)
    .values({
      brandId: burgerLab.id,
      name: "Burger Lab - Central World",
      address: "Central World 4th Floor, Bangkok",
      settings: {
        printerConfig: { ip: "192.168.1.200", port: 9100 },
        tableCount: 20,
      },
    })
    .returning();

  console.log(`Created locations: ${aramenLocation.name}, ${burgerLabLocation.name}`);

  // --- Users ---
  await db.insert(users).values({
    brandId: aramen.id,
    name: "System Admin",
    email: "admin@aramen.com",
    role: "admin",
    passwordHash: adminPasswordHash,
  });

  await db.insert(users).values([
    {
      brandId: aramen.id,
      locationId: aramenLocation.id,
      name: "Somchai (Manager)",
      email: "somchai@aramen.com",
      role: "manager",
      pinHash: managerPinHash,
      passwordHash: adminPasswordHash,
    },
    {
      brandId: aramen.id,
      locationId: aramenLocation.id,
      name: "Nong",
      role: "cashier",
      pinHash: cashier1PinHash,
    },
    {
      brandId: aramen.id,
      locationId: aramenLocation.id,
      name: "Fah",
      role: "cashier",
      pinHash: cashier2PinHash,
    },
  ]);

  await db.insert(users).values([
    {
      brandId: burgerLab.id,
      locationId: burgerLabLocation.id,
      name: "Pim (Manager)",
      email: "pim@burgerlab.com",
      role: "manager",
      pinHash: managerPinHash,
      passwordHash: adminPasswordHash,
    },
    {
      brandId: burgerLab.id,
      locationId: burgerLabLocation.id,
      name: "Bank",
      role: "cashier",
      pinHash: cashier1PinHash,
    },
    {
      brandId: burgerLab.id,
      locationId: burgerLabLocation.id,
      name: "Ploy",
      role: "cashier",
      pinHash: cashier2PinHash,
    },
  ]);

  console.log("Created users: 1 admin, 2 managers, 4 cashiers");

  // --- Terminals ---
  await db.insert(terminals).values([
    {
      brandId: aramen.id,
      locationId: aramenLocation.id,
      name: "POS Terminal 1",
    },
    {
      brandId: burgerLab.id,
      locationId: burgerLabLocation.id,
      name: "POS Terminal 1",
    },
  ]);

  console.log("Created terminals: 1 per location");

  // --- A RAMEN Menu ---
  const aramenCategories = await db
    .insert(menuCategories)
    .values([
      { brandId: aramen.id, name: "Ramen", sortOrder: 1, erpId: "AR-CAT-001" },
      { brandId: aramen.id, name: "Appetizers", sortOrder: 2, erpId: "AR-CAT-002" },
      { brandId: aramen.id, name: "Rice Bowls", sortOrder: 3, erpId: "AR-CAT-003" },
      { brandId: aramen.id, name: "Sides", sortOrder: 4, erpId: "AR-CAT-004" },
      { brandId: aramen.id, name: "Drinks", sortOrder: 5, erpId: "AR-CAT-005" },
    ])
    .returning();

  const ramenCat = aramenCategories[0];
  const appetizerCat = aramenCategories[1];
  const riceCat = aramenCategories[2];
  const sidesCat = aramenCategories[3];
  const drinksCat = aramenCategories[4];

  // Ramen items
  const aramenRamenItems = await db
    .insert(menuItems)
    .values([
      { brandId: aramen.id, categoryId: ramenCat.id, name: "Tonkotsu Ramen", price: "189.00", imageUrl: images.tonkotsu, erpId: "AR-001" },
      { brandId: aramen.id, categoryId: ramenCat.id, name: "Shoyu Ramen", price: "179.00", imageUrl: images.shoyu, erpId: "AR-002" },
      { brandId: aramen.id, categoryId: ramenCat.id, name: "Miso Ramen", price: "189.00", imageUrl: images.miso, erpId: "AR-003" },
      { brandId: aramen.id, categoryId: ramenCat.id, name: "Spicy Tan-Tan Ramen", price: "199.00", imageUrl: images.tantan, erpId: "AR-004" },
      { brandId: aramen.id, categoryId: ramenCat.id, name: "Veggie Ramen", price: "169.00", imageUrl: images.vegRamen, erpId: "AR-005" },
    ])
    .returning();

  // Appetizer items
  await db.insert(menuItems).values([
    { brandId: aramen.id, categoryId: appetizerCat.id, name: "Gyoza (6 pcs)", price: "129.00", imageUrl: images.gyoza, erpId: "AR-006" },
    { brandId: aramen.id, categoryId: appetizerCat.id, name: "Edamame", price: "79.00", imageUrl: images.edamame, erpId: "AR-007" },
    { brandId: aramen.id, categoryId: appetizerCat.id, name: "Karaage Chicken", price: "139.00", imageUrl: images.karaage, erpId: "AR-008" },
  ]);

  // Rice bowl items
  await db.insert(menuItems).values([
    { brandId: aramen.id, categoryId: riceCat.id, name: "Chashu Don", price: "159.00", imageUrl: images.chashuDon, erpId: "AR-009" },
    { brandId: aramen.id, categoryId: riceCat.id, name: "Katsu Don", price: "169.00", imageUrl: images.katsuDon, erpId: "AR-010" },
  ]);

  // Side items
  await db.insert(menuItems).values([
    { brandId: aramen.id, categoryId: sidesCat.id, name: "Extra Chashu", price: "59.00", imageUrl: images.extraChashu, erpId: "AR-011" },
    { brandId: aramen.id, categoryId: sidesCat.id, name: "Extra Egg", price: "29.00", imageUrl: images.extraEgg, erpId: "AR-012" },
    { brandId: aramen.id, categoryId: sidesCat.id, name: "Extra Noodles", price: "39.00", imageUrl: images.extraNoodles, erpId: "AR-013" },
  ]);

  // Drink items
  await db.insert(menuItems).values([
    { brandId: aramen.id, categoryId: drinksCat.id, name: "Iced Green Tea", price: "69.00", imageUrl: images.icedGreenTea, erpId: "AR-014" },
    { brandId: aramen.id, categoryId: drinksCat.id, name: "Ramune Soda", price: "79.00", imageUrl: images.ramune, erpId: "AR-015" },
  ]);

  // Modifiers for Tonkotsu Ramen
  const [noodleGroup] = await db
    .insert(modifierGroups)
    .values({
      menuItemId: aramenRamenItems[0].id,
      name: "Noodle Firmness",
      modifierType: "single_select",
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      sortOrder: 1,
    })
    .returning();

  await db.insert(modifierOptions).values([
    { modifierGroupId: noodleGroup.id, name: "Soft (Yawa)", sortOrder: 1 },
    { modifierGroupId: noodleGroup.id, name: "Regular (Futsu)", isDefault: true, sortOrder: 2 },
    { modifierGroupId: noodleGroup.id, name: "Firm (Katame)", sortOrder: 3 },
    { modifierGroupId: noodleGroup.id, name: "Extra Firm (Barikata)", sortOrder: 4 },
  ]);

  const [toppingsGroup] = await db
    .insert(modifierGroups)
    .values({
      menuItemId: aramenRamenItems[0].id,
      name: "Extra Toppings",
      modifierType: "multi_select",
      isRequired: false,
      minSelections: 0,
      maxSelections: 5,
      sortOrder: 2,
    })
    .returning();

  await db.insert(modifierOptions).values([
    { modifierGroupId: toppingsGroup.id, name: "Extra Chashu", priceAdjustment: "59.00", sortOrder: 1 },
    { modifierGroupId: toppingsGroup.id, name: "Ajitama Egg", priceAdjustment: "29.00", sortOrder: 2 },
    { modifierGroupId: toppingsGroup.id, name: "Corn", priceAdjustment: "19.00", sortOrder: 3 },
    { modifierGroupId: toppingsGroup.id, name: "Nori (3 pcs)", priceAdjustment: "19.00", sortOrder: 4 },
    { modifierGroupId: toppingsGroup.id, name: "Bamboo Shoots", priceAdjustment: "19.00", sortOrder: 5 },
  ]);

  // --- Burger Lab Menu ---
  const burgerCategories = await db
    .insert(menuCategories)
    .values([
      { brandId: burgerLab.id, name: "Burgers", sortOrder: 1, erpId: "BL-CAT-001" },
      { brandId: burgerLab.id, name: "Sides", sortOrder: 2, erpId: "BL-CAT-002" },
      { brandId: burgerLab.id, name: "Shakes", sortOrder: 3, erpId: "BL-CAT-003" },
      { brandId: burgerLab.id, name: "Drinks", sortOrder: 4, erpId: "BL-CAT-004" },
      { brandId: burgerLab.id, name: "Desserts", sortOrder: 5, erpId: "BL-CAT-005" },
    ])
    .returning();

  const burgerCat = burgerCategories[0];
  const blSidesCat = burgerCategories[1];
  const shakesCat = burgerCategories[2];
  const blDrinksCat = burgerCategories[3];
  const dessertsCat = burgerCategories[4];

  // Burger items
  const burgerItems = await db
    .insert(menuItems)
    .values([
      { brandId: burgerLab.id, categoryId: burgerCat.id, name: "Classic Smash Burger", price: "189.00", imageUrl: images.classicBurger, erpId: "BL-001" },
      { brandId: burgerLab.id, categoryId: burgerCat.id, name: "Double Smash Burger", price: "249.00", imageUrl: images.doubleBurger, erpId: "BL-002" },
      { brandId: burgerLab.id, categoryId: burgerCat.id, name: "Bacon Cheeseburger", price: "229.00", imageUrl: images.baconBurger, erpId: "BL-003" },
      { brandId: burgerLab.id, categoryId: burgerCat.id, name: "Mushroom Swiss Burger", price: "239.00", imageUrl: images.mushroomBurger, erpId: "BL-004" },
      { brandId: burgerLab.id, categoryId: burgerCat.id, name: "Veggie Burger", price: "179.00", imageUrl: images.veggieBurger, erpId: "BL-005" },
    ])
    .returning();

  // Sides
  await db.insert(menuItems).values([
    { brandId: burgerLab.id, categoryId: blSidesCat.id, name: "French Fries", price: "79.00", imageUrl: images.fries, erpId: "BL-006" },
    { brandId: burgerLab.id, categoryId: blSidesCat.id, name: "Onion Rings", price: "99.00", imageUrl: images.onionRings, erpId: "BL-007" },
    { brandId: burgerLab.id, categoryId: blSidesCat.id, name: "Coleslaw", price: "59.00", imageUrl: images.coleslaw, erpId: "BL-008" },
  ]);

  // Shakes
  await db.insert(menuItems).values([
    { brandId: burgerLab.id, categoryId: shakesCat.id, name: "Vanilla Shake", price: "119.00", imageUrl: images.vanillaShake, erpId: "BL-009" },
    { brandId: burgerLab.id, categoryId: shakesCat.id, name: "Chocolate Shake", price: "119.00", imageUrl: images.chocoShake, erpId: "BL-010" },
    { brandId: burgerLab.id, categoryId: shakesCat.id, name: "Strawberry Shake", price: "129.00", imageUrl: images.strawShake, erpId: "BL-011" },
  ]);

  // Drinks
  await db.insert(menuItems).values([
    { brandId: burgerLab.id, categoryId: blDrinksCat.id, name: "Coca-Cola", price: "49.00", imageUrl: images.cola, erpId: "BL-012" },
    { brandId: burgerLab.id, categoryId: blDrinksCat.id, name: "Sprite", price: "49.00", imageUrl: images.sprite, erpId: "BL-013" },
  ]);

  // Desserts
  await db.insert(menuItems).values([
    { brandId: burgerLab.id, categoryId: dessertsCat.id, name: "Brownie Sundae", price: "139.00", imageUrl: images.brownie, erpId: "BL-014" },
    { brandId: burgerLab.id, categoryId: dessertsCat.id, name: "Churros", price: "99.00", imageUrl: images.churros, erpId: "BL-015" },
  ]);

  // Modifiers for Classic Smash Burger
  const [cheeseGroup] = await db
    .insert(modifierGroups)
    .values({
      menuItemId: burgerItems[0].id,
      name: "Cheese Selection",
      modifierType: "single_select",
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      sortOrder: 1,
    })
    .returning();

  await db.insert(modifierOptions).values([
    { modifierGroupId: cheeseGroup.id, name: "American Cheese", isDefault: true, sortOrder: 1 },
    { modifierGroupId: cheeseGroup.id, name: "Cheddar", sortOrder: 2 },
    { modifierGroupId: cheeseGroup.id, name: "Swiss", sortOrder: 3 },
    { modifierGroupId: cheeseGroup.id, name: "No Cheese", sortOrder: 4 },
  ]);

  const [addOnsGroup] = await db
    .insert(modifierGroups)
    .values({
      menuItemId: burgerItems[0].id,
      name: "Add-ons",
      modifierType: "multi_select",
      isRequired: false,
      minSelections: 0,
      maxSelections: 5,
      sortOrder: 2,
    })
    .returning();

  await db.insert(modifierOptions).values([
    { modifierGroupId: addOnsGroup.id, name: "Extra Patty", priceAdjustment: "69.00", sortOrder: 1 },
    { modifierGroupId: addOnsGroup.id, name: "Bacon", priceAdjustment: "39.00", sortOrder: 2 },
    { modifierGroupId: addOnsGroup.id, name: "Fried Egg", priceAdjustment: "19.00", sortOrder: 3 },
    { modifierGroupId: addOnsGroup.id, name: "Avocado", priceAdjustment: "49.00", sortOrder: 4 },
    { modifierGroupId: addOnsGroup.id, name: "Jalapenos", priceAdjustment: "19.00", sortOrder: 5 },
  ]);

  console.log("Created menu: A RAMEN (5 categories, 15 items), Burger Lab (5 categories, 15 items)");
  console.log("Created modifiers: noodle firmness, toppings, cheese, add-ons");
  console.log("All items have placeholder images from Unsplash");
  console.log("Seed complete!");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
