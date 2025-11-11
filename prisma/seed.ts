import { PrismaClient } from "../src/generated/prisma/client";
import { toMonthKey } from "../src/lib/month";
const prisma = new PrismaClient();

async function main() {
  const utilities = await prisma.category.upsert({
    where: { name: "Utilities" },
    update: {},
    create: { name: "Utilities", color: "#93C5FD" },
  });
  const rent = await prisma.category.upsert({
    where: { name: "Rent" },
    update: {},
    create: { name: "Rent", color: "#FCA5A5" },
  });
  const subs = await prisma.category.upsert({
    where: { name: "Subscriptions" },
    update: {},
    create: { name: "Subscriptions", color: "#86EFAC" },
  });

  await prisma.billTemplate.upsert({
    where: { id: "rent-template" },
    update: {},
    create: {
      id: "rent-template",
      name: "Rent",
      categoryId: rent.id,
      amountDefault: 1800,
      dueDayDefault: 1,
    },
  });

  await prisma.billTemplate.upsert({
    where: { id: "power-template" },
    update: {},
    create: {
      id: "power-template",
      name: "Power",
      categoryId: utilities.id,
      amountDefault: 120,
      dueDayDefault: 15,
    },
  });

  const month = toMonthKey(new Date());
  await prisma.bill.create({
    data: {
      name: "Laptop Repair",
      categoryId: subs.id,
      amountDue: 250,
      dueDate: new Date(),
      isRecurring: false,
      isPaid: false,
      month,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
