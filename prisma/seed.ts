import { PrismaClient, UserRole, ClientStatus, CampaignStatus, CampaignType, TaskStatus, TaskPriority, InvoiceStatus, PaymentStatus, ExpenseStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.file.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.clientContact.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('👥 Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@crm.com',
      password: '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', // password: admin123
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.admin,
      emailVerified: true,
      isActive: true,
    },
  });

  const managers = await Promise.all(
    Array.from({ length: 3 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', // password: password123
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: UserRole.manager,
          emailVerified: true,
          isActive: true,
          phone: faker.phone.number(),
        },
      })
    )
  );

  const teamMembers = await Promise.all(
    Array.from({ length: 50 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: UserRole.team_member,
          emailVerified: true,
          isActive: true,
          phone: faker.phone.number(),
        },
      })
    )
  );

  const financeUsers = await Promise.all(
    Array.from({ length: 2 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: UserRole.finance,
          emailVerified: true,
          isActive: true,
        },
      })
    )
  );

  const allUsers = [admin, ...managers, ...teamMembers, ...financeUsers];
  const allManagers = [admin, ...managers];

  // Create clients
  console.log('🏢 Creating clients...');
  const clients = await Promise.all(
    Array.from({ length: 100 }).map(() =>
      prisma.client.create({
        data: {
          name: faker.company.name(),
          industry: faker.company.buzzNoun(),
          website: faker.internet.url(),
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
          status: faker.helpers.arrayElement(Object.values(ClientStatus)),
          contractValue: faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 }),
          contractStart: faker.date.past(),
          contractEnd: faker.date.future(),
          notes: faker.lorem.paragraph(),
          ownerId: faker.helpers.arrayElement(allManagers).id,
        },
      })
    )
  );

  // Create client contacts
  console.log('📞 Creating client contacts...');
  for (const client of clients) {
    const contactCount = faker.number.int({ min: 1, max: 4 });
    await Promise.all(
      Array.from({ length: contactCount }).map((_, index) =>
        prisma.clientContact.create({
          data: {
            clientId: client.id,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            title: faker.person.jobTitle(),
            isPrimary: index === 0,
            notes: faker.lorem.sentence(),
          },
        })
      )
    );
  }

  // Create campaigns
  console.log('📊 Creating campaigns...');
  const campaigns = await Promise.all(
    Array.from({ length: 300 }).map(() =>
      prisma.campaign.create({
        data: {
          clientId: faker.helpers.arrayElement(clients).id,
          name: faker.company.catchPhrase(),
          type: faker.helpers.arrayElement(Object.values(CampaignType)),
          status: faker.helpers.arrayElement(Object.values(CampaignStatus)),
          description: faker.lorem.paragraph(),
          budget: faker.number.float({ min: 5000, max: 100000, fractionDigits: 2 }),
          actualSpend: faker.number.float({ min: 0, max: 100000, fractionDigits: 2 }),
          startDate: faker.date.past(),
          endDate: faker.date.future(),
          kpiTarget: JSON.stringify({
            impressions: faker.number.int({ min: 10000, max: 1000000 }),
            clicks: faker.number.int({ min: 100, max: 10000 }),
            conversions: faker.number.int({ min: 10, max: 1000 }),
          }),
          kpiActual: JSON.stringify({
            impressions: faker.number.int({ min: 0, max: 1000000 }),
            clicks: faker.number.int({ min: 0, max: 10000 }),
            conversions: faker.number.int({ min: 0, max: 1000 }),
          }),
          notes: faker.lorem.paragraph(),
          createdById: faker.helpers.arrayElement(allManagers).id,
          assignedToId: faker.helpers.arrayElement(teamMembers).id,
        },
      })
    )
  );

  // Create tasks
  console.log('✅ Creating tasks...');
  const tasks: any[] = [];
  for (const campaign of campaigns.slice(0, 200)) {
    const taskCount = faker.number.int({ min: 3, max: 10 });
    const campaignTasks = await Promise.all(
      Array.from({ length: taskCount }).map(() =>
        prisma.task.create({
          data: {
            campaignId: campaign.id,
            title: faker.lorem.sentence(),
            description: faker.lorem.paragraph(),
            status: faker.helpers.arrayElement(Object.values(TaskStatus)),
            priority: faker.helpers.arrayElement(Object.values(TaskPriority)),
            dueDate: faker.date.future(),
            startDate: faker.date.past(),
            completedDate: faker.datatype.boolean() ? faker.date.past() : null,
            estimatedHours: faker.number.float({ min: 1, max: 40, fractionDigits: 2 }),
            actualHours: faker.number.float({ min: 0, max: 40, fractionDigits: 2 }),
            assignedToId: faker.helpers.arrayElement(teamMembers).id,
            createdById: faker.helpers.arrayElement(allManagers).id,
            notes: faker.lorem.sentence(),
          },
        })
      )
    );
    tasks.push(...campaignTasks);
  }

  // Create task dependencies (for Gantt)
  console.log('🔗 Creating task dependencies...');
  for (let i = 0; i < tasks.length - 1; i++) {
    if (faker.datatype.boolean({ probability: 0.3 })) {
      try {
        await prisma.taskDependency.create({
          data: {
            taskId: tasks[i + 1].id,
            dependsOnId: tasks[i].id,
            type: faker.helpers.arrayElement(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']),
          },
        });
      } catch (error) {
        // Skip circular dependencies
      }
    }
  }

  // Create invoices
  console.log('💰 Creating invoices...');
  let invoiceCounter = 1;
  const invoices = await Promise.all(
    Array.from({ length: 500 }).map(() => {
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${invoiceCounter.toString().padStart(4, '0')}`;
      invoiceCounter++;
      
      const subtotal = faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 });
      const tax = subtotal * 0.1;
      const discount = faker.number.float({ min: 0, max: subtotal * 0.1, fractionDigits: 2 });
      const total = subtotal + tax - discount;

      return prisma.invoice.create({
        data: {
          clientId: faker.helpers.arrayElement(clients).id,
          invoiceNumber,
          status: faker.helpers.arrayElement(Object.values(InvoiceStatus)),
          issueDate: faker.date.past(),
          dueDate: faker.date.future(),
          paidDate: faker.datatype.boolean({ probability: 0.3 }) ? faker.date.past() : null,
          subtotal,
          tax,
          discount,
          total,
          paymentStatus: faker.helpers.arrayElement(Object.values(PaymentStatus)),
          notes: faker.lorem.sentence(),
          createdById: faker.helpers.arrayElement([...allManagers, ...financeUsers]).id,
        },
      });
    })
  );

  // Create expenses
  console.log('💸 Creating expenses...');
  await Promise.all(
    Array.from({ length: 200 }).map(() =>
      prisma.expense.create({
        data: {
          description: faker.commerce.productName(),
          amount: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
          category: faker.helpers.arrayElement(['Travel', 'Meals', 'Software', 'Marketing', 'Office Supplies', 'Other']),
          status: faker.helpers.arrayElement(Object.values(ExpenseStatus)),
          receiptUrl: faker.datatype.boolean() ? faker.internet.url() : null,
          expenseDate: faker.date.past(),
          notes: faker.lorem.sentence(),
          createdById: faker.helpers.arrayElement(teamMembers).id,
          approvedById: faker.datatype.boolean({ probability: 0.7 }) ? faker.helpers.arrayElement(allManagers).id : null,
          approvedAt: faker.datatype.boolean({ probability: 0.7 }) ? faker.date.past() : null,
        },
      })
    )
  );

  // Create activities
  console.log('📝 Creating activities...');
  const activityTypes = ['call', 'email', 'meeting', 'note', 'task_created', 'task_completed', 'campaign_created', 'campaign_updated', 'invoice_sent', 'payment_received'];
  await Promise.all(
    Array.from({ length: 1000 }).map(() =>
      prisma.activity.create({
        data: {
          type: faker.helpers.arrayElement(activityTypes) as any,
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          userId: faker.helpers.arrayElement(allUsers).id,
          clientId: faker.datatype.boolean({ probability: 0.7 }) ? faker.helpers.arrayElement(clients).id : null,
          campaignId: faker.datatype.boolean({ probability: 0.5 }) ? faker.helpers.arrayElement(campaigns).id : null,
          taskId: faker.datatype.boolean({ probability: 0.3 }) ? faker.helpers.arrayElement(tasks).id : null,
          invoiceId: faker.datatype.boolean({ probability: 0.2 }) ? faker.helpers.arrayElement(invoices).id : null,
          metadata: {},
        },
      })
    )
  );

  // Create notification preferences for all users
  console.log('🔔 Creating notification preferences...');
  for (const user of allUsers) {
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        email: true,
        inApp: true,
        push: false,
        taskAssigned: true,
        taskDeadline: true,
        taskOverdue: true,
        campaignUpdate: true,
        invoiceSent: true,
        invoiceOverdue: true,
        paymentReceived: true,
      },
    });
  }

  console.log('✅ Seeding completed!');
  console.log(`   - ${allUsers.length} users`);
  console.log(`   - ${clients.length} clients`);
  console.log(`   - ${campaigns.length} campaigns`);
  console.log(`   - ${tasks.length} tasks`);
  console.log(`   - ${invoices.length} invoices`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

