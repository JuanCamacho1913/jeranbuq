import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Upsert AdminAvailability rows: Mon (1) through Sat (6), 07:00-19:00, slotMinutes=30
  const weekdays = [
    { dayOfWeek: 1, label: "Monday" },
    { dayOfWeek: 2, label: "Tuesday" },
    { dayOfWeek: 3, label: "Wednesday" },
    { dayOfWeek: 4, label: "Thursday" },
    { dayOfWeek: 5, label: "Friday" },
    { dayOfWeek: 6, label: "Saturday" },
  ];

  for (const day of weekdays) {
    await prisma.adminAvailability.upsert({
      where: { dayOfWeek: day.dayOfWeek },
      update: {
        startTime: "07:00",
        endTime: "19:00",
        slotMinutes: 30,
        active: true,
      },
      create: {
        dayOfWeek: day.dayOfWeek,
        startTime: "07:00",
        endTime: "19:00",
        slotMinutes: 30,
        active: true,
      },
    });
    console.log(`Upserted availability for ${day.label}`);
  }

  // Upsert 3 sample services
  const services = [
    {
      name: "Corte Clásico",
      description: "Corte de cabello clásico con tijera y máquina",
      durationMin: 30,
      price: 25000,
    },
    {
      name: "Barba",
      description: "Arreglo y delineado de barba",
      durationMin: 20,
      price: 15000,
    },
    {
      name: "Corte + Barba",
      description: "Combo corte de cabello y arreglo de barba",
      durationMin: 50,
      price: 35000,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        description: service.description,
        durationMin: service.durationMin,
        price: service.price,
        active: true,
      },
      create: {
        name: service.name,
        description: service.description,
        durationMin: service.durationMin,
        price: service.price,
        active: true,
      },
    });
    console.log(`Upserted service: ${service.name}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
