const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { randomUUID } = require('crypto');

const PhoneSubmission = require('../models/PhoneSubmission');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${randomUUID()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });




router.post('/add', upload.array('images', 10), async (req, res) => {
  try {
    const { brand, model, condition, batteryLife, durationUsed, damage, description, email, phone } = req.body;

    if (!brand || !model || !condition || !batteryLife || !durationUsed || !damage || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    
    const images = req.files ? req.files.map(file => file.filename) : [];

    if (images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    const phoneSubmission = new PhoneSubmission({
      brand,
      model,
      condition,
      batteryLife,
      durationUsed,
      damage,
      description: description || '',
      images,
      email,
      phone,
    });

    await phoneSubmission.save();
    res.status(201).json({ message: 'Phone submission added successfully', submission: phoneSubmission });
  } catch (error) {
    console.error('Error adding phone submission:', error);
    res.status(500).json({ error: 'Failed to add phone submission' });
  }
});



router.get('/all', async (req, res) => {
  try {
    const submissions = await PhoneSubmission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const submission = await PhoneSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});


router.patch('/:id/status', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['pending', 'reviewing', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const submission = await PhoneSubmission.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes: adminNotes || '' },
      { new: true, runValidators: true }
    );

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ message: 'Status updated successfully', submission });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const submission = await PhoneSubmission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    submission.images.forEach(imageName => {
      const imagePath = path.join(__dirname, '../uploads', imageName);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await PhoneSubmission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

module.exports = router;
