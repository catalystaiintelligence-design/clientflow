require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.task.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.client.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();

  const password1 = await bcrypt.hash('password123', 12);
  const password2 = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: { id: uuidv4(), email: 'alice@example.com', passwordHash: password1, fullName: 'Alice Johnson' },
  });
  const user2 = await prisma.user.create({
    data: { id: uuidv4(), email: 'bob@example.com', passwordHash: password2, fullName: 'Bob Smith' },
  });

  console.log('Created users:', user1.email, user2.email);

  const template1 = await prisma.template.create({
    data: {
      id: uuidv4(), userId: user1.id, name: 'Web Design Client Intake',
      fields: [
        { id: 'f1', type: 'text', label: 'Company Name', required: true },
        { id: 'f2', type: 'email', label: 'Primary Contact Email', required: true },
        { id: 'f3', type: 'phone', label: 'Phone Number', required: false },
        { id: 'f4', type: 'textarea', label: 'Project Description', required: true },
        { id: 'f5', type: 'select', label: 'Budget Range', required: true, options: ['$1k-5k', '$5k-15k', '$15k-50k', '$50k+'] },
        { id: 'f6', type: 'select', label: 'Timeline', required: true, options: ['1-2 months', '3-6 months', '6-12 months', 'Flexible'] },
        { id: 'f7', type: 'file', label: 'Brand Assets (logo, colors)', required: false },
        { id: 'f8', type: 'checkbox', label: 'I agree to the project terms', required: true },
      ],
      taskTemplates: ['Schedule kickoff call', 'Review brand assets', 'Create wireframes', 'Send project proposal', 'Set up project management board'],
    },
  });

  const template2 = await prisma.template.create({
    data: {
      id: uuidv4(), userId: user1.id, name: 'Freelance Contract Onboarding',
      fields: [
        { id: 'f1', type: 'text', label: 'Full Legal Name', required: true },
        { id: 'f2', type: 'email', label: 'Email Address', required: true },
        { id: 'f3', type: 'text', label: 'Business/LLC Name', required: false },
        { id: 'f4', type: 'textarea', label: 'Mailing Address', required: true },
        { id: 'f5', type: 'text', label: 'Tax ID / SSN (last 4)', required: true },
        { id: 'f6', type: 'file', label: 'Signed Contract', required: true },
        { id: 'f7', type: 'file', label: 'W-9 Form', required: true },
        { id: 'f8', type: 'checkbox', label: 'I confirm all information is accurate', required: true },
      ],
      taskTemplates: ['Verify tax documents', 'Set up payment method', 'Add to contractor list', 'Send welcome packet'],
    },
  });

  const template3 = await prisma.template.create({
    data: {
      id: uuidv4(), userId: user2.id, name: 'Marketing Agency Intake',
      fields: [
        { id: 'f1', type: 'text', label: 'Company Name', required: true },
        { id: 'f2', type: 'email', label: 'Marketing Contact Email', required: true },
        { id: 'f3', type: 'phone', label: 'Direct Phone', required: false },
        { id: 'f4', type: 'select', label: 'Industry', required: true, options: ['E-commerce', 'SaaS', 'Healthcare', 'Finance', 'Real Estate', 'Other'] },
        { id: 'f5', type: 'textarea', label: 'Current Marketing Challenges', required: true },
        { id: 'f6', type: 'textarea', label: 'Target Audience Description', required: true },
        { id: 'f7', type: 'select', label: 'Monthly Ad Budget', required: true, options: ['< $1k', '$1k-5k', '$5k-20k', '$20k+'] },
        { id: 'f8', type: 'file', label: 'Previous Campaign Examples', required: false },
        { id: 'f9', type: 'checkbox', label: 'I authorize access to ad accounts', required: true },
      ],
      taskTemplates: ['Audit existing ad accounts', 'Research competitor landscape', 'Draft 90-day marketing strategy', 'Schedule strategy presentation', 'Set up reporting dashboard'],
    },
  });

  console.log('Created templates:', template1.name, template2.name, template3.name);

  const client1 = await prisma.client.create({ data: { id: uuidv4(), userId: user1.id, name: 'Acme Corp', email: 'contact@acmecorp.com', status: 'submitted', templateId: template1.id, portalToken: uuidv4() } });
  const client2 = await prisma.client.create({ data: { id: uuidv4(), userId: user1.id, name: 'TechStart Inc', email: 'hello@techstart.io', status: 'not_started', templateId: template1.id, portalToken: uuidv4() } });
  const client3 = await prisma.client.create({ data: { id: uuidv4(), userId: user1.id, name: 'Global Media LLC', email: 'team@globalmedia.com', status: 'completed', templateId: template2.id, portalToken: uuidv4() } });
  const client4 = await prisma.client.create({ data: { id: uuidv4(), userId: user1.id, name: 'Summit Ventures', email: 'info@summitventures.co', status: 'in_progress', templateId: template1.id, portalToken: uuidv4() } });
  await prisma.client.create({ data: { id: uuidv4(), userId: user2.id, name: 'Bright Ideas Studio', email: 'studio@brightideas.com', status: 'submitted', templateId: template3.id, portalToken: uuidv4() } });

  console.log('Created clients:', client1.name, client2.name, client3.name, client4.name);

  await prisma.submission.create({
    data: {
      id: uuidv4(), clientId: client1.id,
      fieldData: { f1: 'Acme Corp', f2: 'contact@acmecorp.com', f3: '555-1234', f4: 'We need a complete redesign of our e-commerce website.', f5: '$15k-50k', f6: '3-6 months', f8: true },
      fileUrls: {},
    },
  });

  await prisma.task.createMany({ data: [
    { id: uuidv4(), clientId: client1.id, assignedTo: user1.id, title: 'Schedule kickoff call', status: 'done' },
    { id: uuidv4(), clientId: client1.id, assignedTo: user1.id, title: 'Review brand assets', status: 'in_progress' },
    { id: uuidv4(), clientId: client1.id, assignedTo: user1.id, title: 'Create wireframes', status: 'pending' },
    { id: uuidv4(), clientId: client1.id, assignedTo: user1.id, title: 'Send project proposal', status: 'pending' },
  ]});

  await prisma.task.createMany({ data: [
    { id: uuidv4(), clientId: client3.id, assignedTo: user1.id, title: 'Verify tax documents', status: 'done' },
    { id: uuidv4(), clientId: client3.id, assignedTo: user1.id, title: 'Set up payment method', status: 'done' },
    { id: uuidv4(), clientId: client3.id, assignedTo: user1.id, title: 'Add to contractor list', status: 'done' },
    { id: uuidv4(), clientId: client3.id, assignedTo: user1.id, title: 'Send welcome packet', status: 'done' },
  ]});

  await prisma.task.createMany({ data: [
    { id: uuidv4(), clientId: client4.id, assignedTo: user1.id, title: 'Schedule kickoff call', status: 'done' },
    { id: uuidv4(), clientId: client4.id, assignedTo: user1.id, title: 'Review brand assets', status: 'pending' },
  ]});

  console.log('\nSeed complete. Login: alice@example.com / password123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
