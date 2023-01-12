const jwt = require('jsonwebtoken');
const Register = require('../models/register');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.SECRET_KEY);
        //console.log(verifyUser);
      
        //Now we access the user from the token he provided, as there is an id attached to each token which is same as user's id in the db
        const user = await Register.findOne({ _id: verifyUser._id });
        //console.log(user.name);

        // for logout
        req.token = token;
        req.user = user;

        next(); 
    }
    catch (error) {
        res.render('login', {message: 'please login to continue'});
    }
}

module.exports = auth;