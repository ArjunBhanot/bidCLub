const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL).then(() => {
 
}).catch((e) => { console.log(e);})
