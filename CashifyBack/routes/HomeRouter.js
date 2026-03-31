const router = require('express').Router();
const Home = require('../models/Home');
const multer = require('multer');
const { randomUUID } = require('crypto');
const Path = require('path');
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

