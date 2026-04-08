const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

const STARTER_TEMPLATES = [
  {
    id: 'starter-web-design',
    name: 'Web Design Client Intake',
    description: 'Collect project details, budget, timeline, and brand assets from new web design clients.',
    category: 'Design',
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
    taskTemplates: ['Schedule kickoff call', 'Review brand assets', 'Create wireframes', 'Send project proposal', 'Set up project board'],
  },
  {
    id: 'starter-freelance',
    name: 'Freelance Contract Onboarding',
    description: 'Collect legal info, signed contracts, and tax documents from new freelancers or contractors.',
    category: 'Legal',
    fields: [
      { id: 'f1', type: 'text', label: 'Full Legal Name', required: true },
      { id: 'f2', type: 'email', label: 'Email Address', required: true },
      { id: 'f3', type: 'text', label: 'Business/LLC Name', required: false },
      { id: 'f4', type: 'textarea', label: 'Mailing Address', required: true },
      { id: 'f5', type: 'file', label: 'Signed Contract', required: true },
      { id: 'f6', type: 'file', label: 'W-9 Form', required: true },
      { id: 'f7', type: 'checkbox', label: 'I confirm all information is accurate', required: true },
    ],
    taskTemplates: ['Verify tax documents', 'Set up payment method', 'Add to contractor list', 'Send welcome packet'],
  },
  {
    id: 'starter-marketing',
    name: 'Marketing Agency Intake',
    description: 'Understand client goals, target audience, ad budget, and get access to ad accounts.',
    category: 'Marketing',
    fields: [
      { id: 'f1', type: 'text', label: 'Company Name', required: true },
      { id: 'f2', type: 'email', label: 'Marketing Contact Email', required: true },
      { id: 'f3', type: 'select', label: 'Industry', required: true, options: ['E-commerce', 'SaaS', 'Healthcare', 'Finance', 'Real Estate', 'Other'] },
      { id: 'f4', type: 'textarea', label: 'Current Marketing Challenges', required: true },
      { id: 'f5', type: 'textarea', label: 'Target Audience Description', required: true },
      { id: 'f6', type: 'select', label: 'Monthly Ad Budget', required: true, options: ['< $1k', '$1k-5k', '$5k-20k', '$20k+'] },
      { id: 'f7', type: 'checkbox', label: 'I authorize access to ad accounts', required: true },
    ],
    taskTemplates: ['Audit existing ad accounts', 'Research competitor landscape', 'Draft 90-day strategy', 'Schedule strategy presentation'],
  },
  {
    id: 'starter-saas',
    name: 'SaaS Client Setup',
    description: 'Onboard new SaaS customers with account setup, integrations, and goals.',
    category: 'SaaS',
    fields: [
      { id: 'f1', type: 'text', label: 'Company Name', required: true },
      { id: 'f2', type: 'email', label: 'Admin Email', required: true },
      { id: 'f3', type: 'select', label: 'Team Size', required: true, options: ['1-10', '11-50', '51-200', '200+'] },
      { id: 'f4', type: 'textarea', label: 'Primary Use Case', required: true },
      { id: 'f5', type: 'select', label: 'How did you hear about us?', required: false, options: ['Google', 'Referral', 'Social Media', 'Other'] },
      { id: 'f6', type: 'checkbox', label: 'I agree to the Terms of Service', required: true },
    ],
    taskTemplates: ['Send welcome email', 'Schedule onboarding call', 'Set up workspace', 'Send tutorial resources', 'Check in after 7 days'],
  },
  {
    id: 'starter-consulting',
    name: 'Consulting Discovery',
    description: 'Gather background info and goals before a consulting engagement kicks off.',
    category: 'Consulting',
    fields: [
      { id: 'f1', type: 'text', label: 'Company Name', required: true },
      { id: 'f2', type: 'email', label: 'Decision Maker Email', required: true },
      { id: 'f3', type: 'phone', label: 'Phone Number', required: false },
      { id: 'f4', type: 'textarea', label: 'Current Challenge or Problem', required: true },
      { id: 'f5', type: 'textarea', label: 'Desired Outcome', required: true },
      { id: 'f6', type: 'select', label: 'Engagement Budget', required: true, options: ['< $5k', '$5k-20k', '$20k-50k', '$50k+'] },
      { id: 'f7', type: 'select', label: 'Urgency', required: true, options: ['ASAP', 'Within 1 month', '1-3 months', 'Flexible'] },
      { id: 'f8', type: 'file', label: 'Relevant Documents', required: false },
    ],
    taskTemplates: ['Schedule discovery call', 'Prepare discovery questions', 'Send engagement proposal', 'Define project scope'],
  },
  {
    id: 'starter-real-estate',
    name: 'Real Estate Client Intake',
    description: 'Collect buyer/seller preferences, timeline, and financial readiness.',
    category: 'Real Estate',
    fields: [
      { id: 'f1', type: 'text', label: 'Full Name', required: true },
      { id: 'f2', type: 'email', label: 'Email', required: true },
      { id: 'f3', type: 'phone', label: 'Phone', required: true },
      { id: 'f4', type: 'select', label: 'I am looking to...', required: true, options: ['Buy', 'Sell', 'Both', 'Rent'] },
      { id: 'f5', type: 'select', label: 'Budget Range', required: true, options: ['< $200k', '$200k-500k', '$500k-1M', '$1M+'] },
      { id: 'f6', type: 'select', label: 'Timeline', required: true, options: ['ASAP', '1-3 months', '3-6 months', '6+ months'] },
      { id: 'f7', type: 'textarea', label: 'Preferred Neighborhoods or Areas', required: false },
      { id: 'f8', type: 'checkbox', label: 'I am pre-approved for financing', required: false },
    ],
    taskTemplates: ['Schedule intro call', 'Send property listings', 'Arrange viewings', 'Review offer strategy'],
  },
];

// GET /api/templates/starters - return pre-built templates
router.get('/starters', authenticate, (req, res) => {
  res.json(STARTER_TEMPLATES);
});

// POST /api/templates/clone/:starterId - clone a starter into user's account
router.post('/clone/:starterId', authenticate, async (req, res) => {
  const starter = STARTER_TEMPLATES.find((s) => s.id === req.params.starterId);
  if (!starter) throw new AppError('Starter template not found', 404);

  const template = await prisma.template.create({
    data: {
      userId: req.user.id,
      name: starter.name,
      fields: starter.fields,
      taskTemplates: starter.taskTemplates,
    },
  });

  res.status(201).json(template);
});

// All template routes require auth
router.use(authenticate);

// GET /api/templates
router.get('/', async (req, res) => {
  const templates = await prisma.template.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { clients: true } },
    },
  });
  res.json(templates);
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      _count: { select: { clients: true } },
    },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  res.json(template);
});

// POST /api/templates
router.post('/', async (req, res) => {
  const { name, fields, taskTemplates } = req.body;

  if (!name || !name.trim()) {
    throw new AppError('Template name is required', 400);
  }

  if (!fields || !Array.isArray(fields)) {
    throw new AppError('Fields must be an array', 400);
  }

  const template = await prisma.template.create({
    data: {
      userId: req.user.id,
      name: name.trim(),
      fields,
      taskTemplates: taskTemplates || [],
    },
  });

  res.status(201).json(template);
});

// PUT /api/templates/:id
router.put('/:id', async (req, res) => {
  const { name, fields, taskTemplates } = req.body;

  const existing = await prisma.template.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!existing) {
    throw new AppError('Template not found', 404);
  }

  const template = await prisma.template.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(fields !== undefined && { fields }),
      ...(taskTemplates !== undefined && { taskTemplates }),
    },
  });

  res.json(template);
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  const existing = await prisma.template.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!existing) {
    throw new AppError('Template not found', 404);
  }

  await prisma.template.delete({ where: { id: req.params.id } });

  res.json({ message: 'Template deleted successfully' });
});

module.exports = router;
