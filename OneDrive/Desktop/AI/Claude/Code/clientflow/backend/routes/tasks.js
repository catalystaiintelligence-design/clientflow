const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/tasks
router.get('/', async (req, res) => {
  const { clientId, status, assignedTo } = req.query;

  // Build where clause - only get tasks for clients owned by this user
  const where = {
    client: { userId: req.user.id },
  };

  if (clientId) where.clientId = clientId;
  if (status) where.status = status;
  if (assignedTo) where.assignedTo = assignedTo;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, email: true, fullName: true } },
    },
  });

  res.json(tasks);
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  const task = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      client: { userId: req.user.id },
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, email: true, fullName: true } },
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.json(task);
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const { clientId, title, assignedTo, status } = req.body;

  if (!clientId || !title) {
    throw new AppError('Client ID and title are required', 400);
  }

  // Verify client belongs to user
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: req.user.id },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const task = await prisma.task.create({
    data: {
      clientId,
      title,
      assignedTo: assignedTo || req.user.id,
      status: status || 'pending',
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, email: true, fullName: true } },
    },
  });

  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  const { title, status, assignedTo } = req.body;

  const existing = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      client: { userId: req.user.id },
    },
  });

  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(status !== undefined && { status }),
      ...(assignedTo !== undefined && { assignedTo }),
    },
    include: {
      client: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, email: true, fullName: true } },
    },
  });

  // If all tasks for a client are done, update client status to 'completed'
  if (status === 'done') {
    const pendingTasks = await prisma.task.count({
      where: { clientId: task.clientId, status: { not: 'done' } },
    });
    if (pendingTasks === 0) {
      await prisma.client.update({
        where: { id: task.clientId },
        data: { status: 'completed' },
      });
    }
  }

  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const existing = await prisma.task.findFirst({
    where: {
      id: req.params.id,
      client: { userId: req.user.id },
    },
  });

  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  await prisma.task.delete({ where: { id: req.params.id } });

  res.json({ message: 'Task deleted successfully' });
});

// GET /api/tasks/stats/summary
router.get('/stats/summary', async (req, res) => {
  const [total, pending, inProgress, done] = await Promise.all([
    prisma.task.count({ where: { client: { userId: req.user.id } } }),
    prisma.task.count({ where: { client: { userId: req.user.id }, status: 'pending' } }),
    prisma.task.count({ where: { client: { userId: req.user.id }, status: 'in_progress' } }),
    prisma.task.count({ where: { client: { userId: req.user.id }, status: 'done' } }),
  ]);

  res.json({ total, pending, inProgress, done });
});

module.exports = router;
