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

async function main() {
  await seedRoles();
  // Pipeline stages are user-managed — NOT seeded here
  await prisma.$disconnect();
}

main().catch(console.error);