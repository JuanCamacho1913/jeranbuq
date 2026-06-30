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

  // IMPORTANT: All appointments must be CANCELLED before running this seed.
  // This block deletes all appointments and services, then re-creates the full 19-service catalog.
  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany();
    console.log("Deleted all existing appointments");

    await tx.service.deleteMany();
    console.log("Deleted all existing services");

    await tx.service.createMany({
      data: [
        // HAIRCUT — all 45 min
        {
          name: "Corte basico maquina con la 1 y 2",
          price: 20000,
          durationMin: 45,
          category: "HAIRCUT",
          sortOrder: 1,
          active: true,
        },
        {
          name: "Corte de cabello",
          price: 25000,
          durationMin: 45,
          category: "HAIRCUT",
          sortOrder: 2,
          priceNote: "desde $25.000",
          active: true,
        },
        {
          name: "Corte de cabello a tijera",
          price: 32000,
          durationMin: 45,
          category: "HAIRCUT",
          sortOrder: 3,
          priceNote: "desde $32.000",
          active: true,
        },
        {
          name: "Contornos",
          price: 16000,
          durationMin: 45,
          category: "HAIRCUT",
          sortOrder: 4,
          active: true,
        },
        {
          name: "Base",
          price: 18000,
          durationMin: 45,
          category: "HAIRCUT",
          sortOrder: 5,
          active: true,
        },

        // COMBO — all 45 min
        {
          name: "Barba",
          price: 18000,
          durationMin: 45,
          category: "COMBO",
          sortOrder: 1,
          description: "Incluye ritual de barba",
          active: true,
        },
        {
          name: "Corte de cabello + Barba",
          price: 30000,
          durationMin: 45,
          category: "COMBO",
          sortOrder: 2,
          description: "Incluye ritual de barba",
          active: true,
        },
        {
          name: "Contorno o Base + Barba",
          price: 25000,
          durationMin: 45,
          category: "COMBO",
          sortOrder: 3,
          description: "Incluye ritual de barba",
          active: true,
        },
        {
          name: "Corte de cabello + Barba diseño",
          price: 32000,
          durationMin: 45,
          category: "COMBO",
          sortOrder: 4,
          priceNote: "desde $32.000",
          description: "Incluye ritual de barba",
          active: true,
        },
        {
          name: "Corte de cabello + Barba + Maquillaje de barba",
          price: 35000,
          durationMin: 45,
          category: "COMBO",
          sortOrder: 5,
          description: "Incluye ritual de barba",
          active: true,
        },

        // PREMIUM — all 45 min
        {
          name: "Corte de cabello + Puntos negros",
          price: 32000,
          durationMin: 45,
          category: "PREMIUM",
          sortOrder: 1,
          active: true,
        },
        {
          name: "Corte de cabello + Exfoliación",
          price: 32000,
          durationMin: 45,
          category: "PREMIUM",
          sortOrder: 2,
          active: true,
        },
        {
          name: "Corte de cabello + Depilación nasal",
          price: 32000,
          durationMin: 45,
          category: "PREMIUM",
          sortOrder: 3,
          active: true,
        },

        // VIP — 45 min
        {
          name: "Servicio VIP",
          price: 70000,
          durationMin: 45,
          category: "VIP",
          sortOrder: 1,
          description:
            "Corte · Barba · Puntos negros & impurezas nasal · Exfoliación · Hidratación velo de colágeno · Depilación nasal & oídos · Enjuague · Moldeo de peinado · Bebida. Servicio para momentos especiales — boda, cumpleaños…",
          active: true,
        },

        // COLORIMETRIA — 75 min (excl. Enjuague + Moldeo: 15 min)
        {
          name: "Enjuague de cabello + Moldeo de peinado",
          price: 2000,
          durationMin: 15,
          category: "COLORIMETRIA",
          sortOrder: 1,
          description: "Adicional a cualquier servicio",
          active: true,
        },
        {
          name: "Corte de cabello + Enjuague base negro",
          price: 42000,
          durationMin: 75,
          category: "COLORIMETRIA",
          sortOrder: 2,
          active: true,
        },
        {
          name: "Mechas",
          price: 40000,
          durationMin: 75,
          category: "COLORIMETRIA",
          sortOrder: 3,
          priceNote: "desde $40.000",
          active: true,
        },
        {
          name: "Platinados",
          price: 80000,
          durationMin: 75,
          category: "COLORIMETRIA",
          sortOrder: 4,
          priceNote: "desde $80.000",
          active: true,
        },

        // KIDS — 45 min
        {
          name: "Corte de cabello niño",
          price: 25000,
          durationMin: 45,
          category: "KIDS",
          sortOrder: 1,
          active: true,
        },
      ],
    });

    console.log("Created 19 real services");
  });
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
