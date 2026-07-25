import prisma from './database';

async function seedRoles() {
  const roles = ['Admin', 'Sales Manager', 'Agent'];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  console.log('✅ Roles seeded successfully');
}

async function seedPipelineStages() {
  const stages = [
    { name: 'New Lead', order: 1 },
    { name: 'Contacted', order: 2 },
    { name: 'Proposal Sent', order: 3 },
    { name: 'Negotiation', order: 4 },
    { name: 'Won', order: 5 },
    { name: 'Lost', order: 6 },
  ];

  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      where: { id: stage.name },
      update: {},
      create: stage,
    });
  }

  console.log('✅ Pipeline stages seeded successfully');
}

async function main() {
  await seedRoles();
  await seedPipelineStages();
  await prisma.$disconnect();
}

main().catch(console.error);