import { PrismaClient, UserRole, FieldType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      roles: [UserRole.ADMIN, UserRole.USER],
    },
  });

  console.log('Created admin user:', admin.email);

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      roles: [UserRole.USER],
    },
  });

  console.log('Created regular user:', user.email);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics' },
    }),
    prisma.tag.upsert({
      where: { name: 'Books' },
      update: {},
      create: { name: 'Books' },
    }),
    prisma.tag.upsert({
      where: { name: 'Furniture' },
      update: {},
      create: { name: 'Furniture' },
    }),
  ]);

  console.log('Created tags');

  // Create sample inventory
  const inventory = await prisma.inventory.create({
    data: {
      title: 'Office Equipment Inventory',
      description: 'Tracking all office equipment and supplies',
      category: 'Office',
      isPublic: true,
      ownerId: admin.id,
      tags: {
        create: [
          { tagId: tags[0].id },
        ],
      },
      fields: {
        create: [
          {
            type: FieldType.SINGLELINE,
            title: 'Model',
            description: 'Equipment model number',
            position: 1,
            showInTable: true,
          },
          {
            type: FieldType.NUMBER,
            title: 'Quantity',
            description: 'Number of items',
            position: 2,
            showInTable: true,
          },
          {
            type: FieldType.MULTILINE,
            title: 'Notes',
            description: 'Additional notes',
            position: 3,
            showInTable: false,
          },
          {
            type: FieldType.BOOL,
            title: 'In Stock',
            description: 'Is item currently in stock',
            position: 4,
            showInTable: true,
          },
        ],
      },
    },
    include: {
      fields: true,
    },
  });

  console.log('Created inventory:', inventory.title);

  // Create custom ID sequence
  await prisma.customIdSequence.create({
    data: {
      inventoryId: inventory.id,
      template: {
        elements: [
          { type: 'FIXED_TEXT', value: 'EQ-' },
          { type: 'SEQUENCE' },
        ],
      },
      nextValue: 1,
    },
  });

  // Create sample items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        inventoryId: inventory.id,
        customId: 'EQ-000001',
        createdById: admin.id,
        fieldValues: {
          create: [
            {
              fieldDefinitionId: inventory.fields[0].id,
              valueText: 'Dell XPS 15',
            },
            {
              fieldDefinitionId: inventory.fields[1].id,
              valueNumber: 5,
            },
            {
              fieldDefinitionId: inventory.fields[2].id,
              valueText: 'High-performance laptops for developers',
            },
            {
              fieldDefinitionId: inventory.fields[3].id,
              valueBool: true,
            },
          ],
        },
      },
    }),
    prisma.item.create({
      data: {
        inventoryId: inventory.id,
        customId: 'EQ-000002',
        createdById: admin.id,
        fieldValues: {
          create: [
            {
              fieldDefinitionId: inventory.fields[0].id,
              valueText: 'Herman Miller Chair',
            },
            {
              fieldDefinitionId: inventory.fields[1].id,
              valueNumber: 10,
            },
            {
              fieldDefinitionId: inventory.fields[2].id,
              valueText: 'Ergonomic office chairs',
            },
            {
              fieldDefinitionId: inventory.fields[3].id,
              valueBool: true,
            },
          ],
        },
      },
    }),
    prisma.item.create({
      data: {
        inventoryId: inventory.id,
        customId: 'EQ-000003',
        createdById: user.id,
        fieldValues: {
          create: [
            {
              fieldDefinitionId: inventory.fields[0].id,
              valueText: 'LG UltraWide Monitor',
            },
            {
              fieldDefinitionId: inventory.fields[1].id,
              valueNumber: 8,
            },
            {
              fieldDefinitionId: inventory.fields[2].id,
              valueText: '34-inch curved monitors',
            },
            {
              fieldDefinitionId: inventory.fields[3].id,
              valueBool: false,
            },
          ],
        },
      },
    }),
  ]);

  console.log(`Created ${items.length} items`);

  // Create discussion posts
  await prisma.discussionPost.create({
    data: {
      inventoryId: inventory.id,
      authorId: admin.id,
      markdownText: '# Welcome\n\nThis is the discussion area for this inventory.',
    },
  });

  await prisma.discussionPost.create({
    data: {
      inventoryId: inventory.id,
      authorId: user.id,
      markdownText: 'Thanks for setting this up! Looking forward to using it.',
    },
  });

  console.log('Created discussion posts');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
