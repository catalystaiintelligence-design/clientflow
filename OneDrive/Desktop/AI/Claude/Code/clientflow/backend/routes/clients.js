const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { sendPortalInvite } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/clients
router.get('/', async (req, res) => {
  const { status, search } = req.query;

  const where = { userId: req.user.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { id: true, name: true } },
      _count: { select: { tasks: true, submissions: true } },
    },
  });

  res.json(clients);
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      template: true,
      submissions: { orderBy: { submittedAt: 'desc' } },
      tasks: {
        include: { assignee: { select: { id: true, email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  res.json(client);
});

// POST /api/clients
router.post('/', async (req, res) => {
  const { name, email, templateId, sendInvite } = req.body;

  if (!name || !email) {
    throw new AppError('Name and email are required', 400);
  }

  const portalToken = uuidv4();

  const client = await prisma.client.create({
    data: {
      userId: req.user.id,
      name,
      email,
      templateId: templateId || null,
      portalToken,
      status: 'not_started',
    },
    include: {
      template: { select: { id: true, name: true } },
    },
  });

  // Send portal invite email
  if (sendInvite !== false) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const portalUrl = `${clientUrl}/portal/${portalToken}`;
    await sendPortalInvite({
      clientName: name,
      clientEmail: email,
      portalUrl,
    });
  }

  res.status(201).json(client);
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  const { name, email, status, templateId } = req.body;

  const existing = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!existing) {
    throw new AppError('Client not found', 404);
  }

  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(status !== undefined && { status }),
      ...(templateId !== undefined && { templateId }),
    },
    include: {
      template: { select: { id: true, name: true } },
    },
  });

  res.json(client);
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  const existing = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!existing) {
    throw new AppError('Client not found', 404);
  }

  await prisma.client.delete({ where: { id: req.params.id } });

  res.json({ message: 'Client deleted successfully' });
});

// POST /api/clients/:id/resend-invite
router.post('/:id/resend-invite', async (req, res) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const portalUrl = `${clientUrl}/portal/${client.portalToken}`;

  await sendPortalInvite({
    clientName: client.name,
    clientEmail: client.email,
    portalUrl,
  });

  res.json({ message: 'Invite sent successfully' });
});

module.exports = router;
