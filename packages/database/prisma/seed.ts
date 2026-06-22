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
        // HAIRCUT
        {
          name: "Corte básico 1y2",
          price: 20000,
          durationMin: 30,
          category: "HAIRCUT",
          active: true,
        },
        {
          name: "Corte de cabello",
          price: 25000,
          durationMin: 30,
          category: "HAIRCUT",
          priceNote: "desde $25.000",
          active: true,
        },
        {
          name: "Corte de cabello a tijera",
          price: 32000,
          durationMin: 45,
          category: "HAIRCUT",
          priceNote: "desde $32.000",
          active: true,
        },
        {
          name: "Contornos",
          price: 16000,
          durationMin: 20,
          category: "HAIRCUT",
          active: true,
        },
        {
          name: "Base",
          price: 18000,
          durationMin: 20,
          category: "HAIRCUT",
          active: true,
        },

        // COMBO
        {
          name: "Barba",
          price: 18000,
          durationMin: 30,
          category: "COMBO",
          description: "Incluye ritual de barba",
          active: true,
        },
        {
          name: "Barba + Contorno o Base",
          price: 25000,
          durationMin: 40,
          category: "COMBO",
          description: "Incluye ritual de barba",
          active: true,
        },
        {
          name: "Corte de cabello + Barba",
          price: 30000,
          durationMin: 60,
          category: "COMBO",
          description: "Incluye ritual de barba",
          active: true,
        },
        {
          name: "Corte de cabello + Barba diseño",
          price: 32000,
          durationMin: 75,
          category: "COMBO",
          priceNote: "desde $32.000",
          description: "Incluye ritual de barba",
          active: true,
        },
        {
          name: "Corte de cabello + Barba + Maquillaje de barba",
          price: 35000,
          durationMin: 75,
          category: "COMBO",
          description: "Incluye ritual de barba",
          active: true,
        },

        // PREMIUM
        {
          name: "Corte de cabello + Puntos negros",
          price: 32000,
          durationMin: 45,
          category: "PREMIUM",
          active: true,
        },
        {
          name: "Corte de cabello + Exfoliación",
          price: 32000,
          durationMin: 45,
          category: "PREMIUM",
          active: true,
        },
        {
          name: "Corte de cabello + Depilación nasal",
          price: 32000,
          durationMin: 45,
          category: "PREMIUM",
          active: true,
        },

        // VIP
        {
          name: "Servicio VIP",
          price: 70000,
          durationMin: 120,
          category: "VIP",
          description:
            "Corte · Barba · Puntos negros · Exfoliación · Hidratación velo de colágeno · Depilación nasal & oídos · Enjuague · Moldeo de peinado · Bebida. Ideal para bodas y eventos especiales.",
          active: true,
        },

        // COLORIMETRIA
        {
          name: "Enjuague de cabello + Moldeo de peinado",
          price: 2000,
          durationMin: 15,
          category: "COLORIMETRIA",
          description: "Adicional a cualquier servicio",
          active: true,
        },
        {
          name: "Corte de cabello + Enjuague base negro",
          price: 42000,
          durationMin: 60,
          category: "COLORIMETRIA",
          active: true,
        },
        {
          name: "Mechas",
          price: 40000,
          durationMin: 90,
          category: "COLORIMETRIA",
          priceNote: "desde $40.000",
          active: true,
        },
        {
          name: "Platinados",
          price: 80000,
          durationMin: 120,
          category: "COLORIMETRIA",
          priceNote: "desde $80.000",
          active: true,
        },

        // KIDS
        {
          name: "Corte de cabello niño",
          price: 25000,
          durationMin: 25,
          category: "KIDS",
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
