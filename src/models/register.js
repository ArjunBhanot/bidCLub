const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cpassword: {
        type: String,
        required: true
    },
    userimage: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        required: true,
        default: Date.now()
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

// jwt token generation 
userSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign({ _id: this._id.toString() }, 'iamdevelopingusingnodejsandmongo');
        this.tokens = this.tokens.concat({ token: token });
        const f = await this.save();
        return token;
    }
    catch (error) {
        res.send(error);
        console.log(error);
    }
}


// converting password to hash
userSchema.pre('save', async function (next) {

    if (this.isModified('password')) {
        this.password = await bcryptjs.hash(this.password, 10);
        this.cpassword = await bcryptjs.hash(this.cpassword, 10);
    }
    next();
})


const Register = new mongoose.model("Register", userSchema);
module.exports = Register;


 