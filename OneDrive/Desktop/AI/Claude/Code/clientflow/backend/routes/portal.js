const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');
const { upload, uploadToStorage } = require('../utils/upload');
const { sendSubmissionNotification } = require('../utils/email');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/portal/:token - Get portal data (public, no auth)
router.get('/:token', async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { portalToken: req.params.token },
    include: {
      template: true,
      submissions: {
        orderBy: { submittedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!client) {
    throw new AppError('Portal not found', 404);
  }

  res.json({
    clientName: client.name,
    status: client.status,
    template: client.template,
    hasSubmission: client.submissions.length > 0,
    submittedAt: client.submissions[0]?.submittedAt || null,
  });
});

// POST /api/portal/:token - Submit portal form
router.post('/:token', upload.array('files', 10), async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { portalToken: req.params.token },
    include: {
      template: true,
      user: { select: { id: true, email: true, fullName: true } },
    },
  });

  if (!client) {
    throw new AppError('Portal not found', 404);
  }

  if (client.status === 'submitted' || client.status === 'completed') {
    throw new AppError('This form has already been submitted', 400);
  }

  // Parse field data from form body
  let fieldData = {};
  try {
    if (req.body.fieldData) {
      fieldData = JSON.parse(req.body.fieldData);
    } else {
      Object.keys(req.body).forEach((key) => {
        if (key !== 'fieldData') {
          fieldData[key] = req.body[key];
        }
      });
    }
  } catch (e) {
    fieldData = req.body;
  }

  // Process uploaded files
  const fileUrls = {};
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const stored = await uploadToStorage(file);
      const fieldKey = file.fieldname;
      if (!fileUrls[fieldKey]) fileUrls[fieldKey] = [];
      fileUrls[fieldKey].push(stored);
    }
  }

  // Create submission
  const submission = await prisma.submission.create({
    data: {
      clientId: client.id,
      fieldData,
      fileUrls,
    },
  });

  // Update client status
  await prisma.client.update({
    where: { id: client.id },
    data: { status: 'submitted' },
  });

  // Auto-create tasks from template task_templates
  const taskTemplates = client.template?.taskTemplates;
  if (taskTemplates && Array.isArray(taskTemplates) && taskTemplates.length > 0) {
    const tasksToCreate = taskTemplates.map((t) => ({
      clientId: client.id,
      assignedTo: client.userId,
      title: typeof t === 'string' ? t : t.title,
      status: 'pending',
    }));
    await prisma.task.createMany({ data: tasksToCreate });
  }

  // Send notification to account owner
  await sendSubmissionNotification({
    ownerEmail: client.user.email,
    clientName: client.name,
  });

  res.status(201).json({
    message: 'Form submitted successfully',
    submissionId: submission.id,
  });
});

module.exports = router;
