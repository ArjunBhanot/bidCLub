const mongoose = require('mongoose');


const prodReport = new mongoose.Schema({
    prodid: {
        type: String,
        required: true
    },
    sellerid: {
        type: String,
        required: true,
    },
    reportedby: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now()
    }
})


const ProductReport = new mongoose.model("ProductReport", prodReport);
module.exports = ProductReport;


