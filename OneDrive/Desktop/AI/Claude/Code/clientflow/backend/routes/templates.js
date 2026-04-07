const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

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
