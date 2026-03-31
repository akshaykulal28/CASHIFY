const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
    ImageUrl: {
        type: String,
        required: true  
    },
    Title: {
        type: String,
        required: true
    },
    Type: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Home', homeschema);

