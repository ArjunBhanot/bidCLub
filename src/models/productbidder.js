const mongoose = require('mongoose');


const prodBidder = new mongoose.Schema({
    prodid: {
        type: String,
        required: true
    },
    sellerid: {
        type: String,
        required: true,
    },
    bidderid: {
        type: String,
        required: true,
    },
    bidamount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    }
})


const ProductBid = new mongoose.model("ProductBid", prodBidder);
module.exports = ProductBid;


