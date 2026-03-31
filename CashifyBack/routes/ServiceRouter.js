const router = require('express').Router();
const multer = require('multer');
const { randomUUID } = require('crypto');
const Path = require('path');
const Services = require('../models/Servies');
const fs = require('fs');

const storage = multer.diskStorage({
    destination : function (req,file ,cb){
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb){
        cb(null, randomUUID() + '-' + Date.now() + Path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
});

router.post('/add', upload.single("image"), (req , res) =>{
    if (!req.file) {
        return res.status(400).json({ message: 'Image file is required' });
    }
    const ImageUrl = req.file.filename;
    const Title = req.body.title;

    const newServices = {
        ImageUrl,
        Title
    }
    const services = new Services(newServices);
        services.save().then(() => res.json('Service Added')).catch(err => res.status(400).json('Error: ' + err));
});

router.get('/all', async (req, res) => {
    try {
        const services = await Services.find()
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error1', error: error.message });
    }
});

module.exports = router;