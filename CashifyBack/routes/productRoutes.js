const router = require('express').Router();
const multer = require('multer');
const { randomUUID } = require('crypto');
const Path = require('path');
const Product = require('../models/Product');
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
    const imageUrl = req.file.filename;
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const originalPrice = req.body.originalPrice;
    const rating = req.body.rating;
    const tag = req.body.tag;
    const category = req.body.category;
    const brand = req.body.brand;
    const type = req.body.type;
    const varity = req.body.varity;


    const newProduct = {
        imageUrl,
        name,
        description,
        price,
        originalPrice,
        rating,
        tag,
        category,
        brand,
        type,
        varity
    }
    const product = new Product(newProduct);

        product.save().then(() => res.json('Product Added')).catch(err => res.status(400).json('Error: ' + err));

});




// all products
router.get('/all', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error1', error: error.message });
    }
});

router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const existingProduct = await Product.findById(req.params.id);
        if (!existingProduct) return res.status(404).json({ message: 'Product not found' });

        const imageUrl = req.file ? req.file.filename : existingProduct.imageUrl;
        const {
            name,
            description,
            price,
            originalPrice,
            rating,
            tag,
            category,
            brand,
            type,
            varity
        } = req.body;

        if (!imageUrl || !name || !description || !price || !originalPrice || !rating || !tag || !category || !brand || !type || !varity) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const parsedPrice = Number(price);
        const parsedOriginalPrice = Number(originalPrice);
        const parsedRating = Number(rating);

        if (Number.isNaN(parsedPrice) || Number.isNaN(parsedOriginalPrice) || Number.isNaN(parsedRating)) {
            return res.status(400).json({ message: 'Price, originalPrice and rating must be numbers' });
        }

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            {
                imageUrl,
                name,
                description,
                price: parsedPrice,
                originalPrice: parsedOriginalPrice,
                rating: parsedRating,
                tag,
                category,
                brand,
                type,
                varity
            },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Product not found' });

        if (req.file && existingProduct.imageUrl && existingProduct.imageUrl !== imageUrl) {
            fs.unlink(`./uploads/${existingProduct.imageUrl}`, (err) => {
                if (err) console.error('Failed to delete old image:', err);
            });
        }

        res.status(200).json({ message: 'Product updated successfully', product: updated });
    } catch (error) {
        res.status(500).json({ message: 'Server error2', error: error.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const mul = await Product.findById(req.params.id);
        if (!mul) return res.status(404).json({ message: 'Product not found' });
        fs.unlink("./uploads/" + mul.imageUrl, (err) => {
            if (err) console.error('Failed to delete image:', err);
        });
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error3', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);

    } catch (error) {
        res.status(500).json({ message: 'Server error4', error: error.message });
    }
});

//refurbishhed product

router.get('/phone', async (req, res) => {
    try {
        const products = await Product.find({ type: "Phone" }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error5', error: error.message });
    }
});


router.get('/laptop', async (req, res) => {
    try {
        const products = await Product.find({ type : "Laptop" }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error6', error: error.message });
    }
});

module.exports = router;