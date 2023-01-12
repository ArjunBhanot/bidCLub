const mongoose = require('mongoose');


const prodDetail = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    sellerid: {
        type: String,
        required: true,
    },
    activetime: {
        type: Number,
        required: true,
    },
    startingbid: {
        type: Number,
        required: true
    },
    currentbid: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image1: {
        type: String,
        required: true,
        default: 'i.pinimg.com/originals/f9/11/d3/f911d38579709636499618b6b3d9b6f6.jpg'
    },
    image2: {
        type: String,
        required: true,
        default: 'i.pinimg.com/originals/f9/11/d3/f911d38579709636499618b6b3d9b6f6.jpg'
    },
    image3: {
        type: String,
        required: true,
        default: 'i.pinimg.com/originals/f9/11/d3/f911d38579709636499618b6b3d9b6f6.jpg'
    },
    image4: {
        type: String,
        required: true,
        default: 'i.pinimg.com/originals/f9/11/d3/f911d38579709636499618b6b3d9b6f6.jpg'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now()
    }
})


const Product = new mongoose.model("Product", prodDetail);
module.exports = Product;


