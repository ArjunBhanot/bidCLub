require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const hbs = require('hbs');
const multer = require('multer');
const Aws = require('aws-sdk')  
const nodemailer = require("nodemailer");
const AmazonS3URI = require('amazon-s3-uri');


require('./db/conn');
const Register = require('./models/register');
const Product = require('./models/product');
const ProductBid = require('./models/productbidder');
const ProductReport = require('./models/report');
const bcryptjs = require('bcryptjs');
const staticPath = path.join(__dirname, '../public');
const templatePath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');
const uploadsPath = path.join(__dirname, '../uploads');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');
const imagePath = path.join(__dirname,'../public/images');

app.use(express.static(imagePath));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticPath));
app.use('/uploads', express.static(uploadsPath));
app.set('view engine', 'hbs');
app.set('views', templatePath);
hbs.registerPartials(partialsPath);

var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);

let req_file_originalname = '';
let req_file_buffer = '';
let req_body_name = '';
let req_body_email = '';
let req_body_phone = '';
let req_body_password = '';
let req_body_cpassword = '';


// multer for images ****************************


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './uploads/');
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + file.originalname);
//     }
// })

const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
})


const fileFilter = (req, file, cb) => {
    // reject a file  
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}

const upload = multer({
    storage: storage, 
    fileFilter : fileFilter

});

// multer ends ********************************


// AWS **************************************

const s3 = new Aws.S3({
    accessKeyId : process.env.AWS_ACCESS_KEY_ID,              
    secretAccessKey : process.env.AWS_ACCESS_KEY_SECRET
})


// AWS ENDS *****************************************

const ObjectId = require('mongoose').Types.ObjectId;
  
// ID Validator function
function isValidObjectId(id){
      
    if(ObjectId.isValid(id)){
        if((String)(new ObjectId(id)) === id)
            return true;        
        return false;
    }
    return false;
}

//**********************************


app.get('/', (req, res) => {
    res.render('index')
})


app.get('/register', (req, res) => {
    res.render('register')
})



app.post('/report/:id', auth,  async (req, res) => {
    try {

        const prodDetails = await Product.findOne({ _id: req.params.id });


        const reportProd = new ProductReport({
            prodid: req.params.id,
            sellerid: prodDetails.sellerid,
            reportedby: req.user._id,
            reason: req.body.report,
            date: Date.now()
            })
   
        const reportedproduct = await reportProd.save();

        res.redirect('back');

    }
    catch(err)
    {
        console.log(err);
    }

})



app.post('/deleteprod/:id', auth,  async (req, res) => {
    try {

        const prodDetails = await Product.findOne({ _id: req.params.id });
    
        //  PRODUCT IMAGES DO NOT HAVE HTTPS ATTACHED TO THEM BY DEFAULT WHILE USER IMAGES DO HAVE
        var imageurls = new Array();
        let str1 = "https://" + prodDetails.image1;
        let str2 = "https://" + prodDetails.image2;
        let str3 = "https://" + prodDetails.image3;
        let str4 = "https://" + prodDetails.image4;
        imageurls.push(str1);
        imageurls.push(str2);
        imageurls.push(str3);
        imageurls.push(str4);
        

        // Delete images from s3

        try {
                for(var i=0; i<4; i++)
                {
                const urix0 = imageurls[i]
                
                const { region, bucket, key } = await AmazonS3URI(urix0)
                
                await s3.deleteObject({Bucket: process.env.AWS_BUCKET_NAME, Key: key}, function(err, dataDeleted) {
                if (err) 
                {
                    console.log(err);  // error
                }
                });
                }
            } catch (err) {
            console.log(err) // should not happen because `uri` is valid in that example
            }
        

                
            
            // Now delete product

        const prodDelete = await Product.deleteOne({_id : req.params.id}, async function (err, docs) {
            if (err){
                console.log(err)
            } 
            else{
                //console.log(docs);

                const bidDelete = await ProductBid.deleteMany({prodid: req.params.id}, function(err, d)
                {
                    if(err)
                    {
                        console.log(err);
                    }
                    else
                    {
                        res.redirect('back');
                    }

                }).clone();
            }
        }).clone();
    }
    catch(err)
    {
        console.log(err);
    }
})




// app.post('/deleteuser/:id', auth,  async (req, res) => {
//     try {
//         console.log('hello');
//         const userDelete = await Register.deleteOne({_id : req.params.id}, async function (err, docs) {
//             if (err){
//                 console.log(err)
//             } 
//             else{
//                 //console.log(docs);
//                 console.log('hello');
//                 const bidDelete = await ProductBid.deleteMany({ $or: [{sellerid : req.params.id},{bidderid : req.params.id}]}, async function(errx, d)
//                 {
//                     if(errx)
//                     {
//                         console.log(errx);
//                     }
//                     else
//                     {
//                         console.log('hello');
//                         const prodDelete = await Product.deleteMany({sellerid : req.params.id}, async function(e, df)
//                         {
//                             if(e)
//                             {
//                                 console.log(e);
//                             }
//                             else
//                             {
//                                 console.log('hello');
//                                 res.redirect('/');
//                             }
//                         }).clone();
//                     }

//                 }).clone();
//             }
//         }).clone();
//     }
//     catch(err)
//     {
//         console.log(err);
//     }
// })




app.get('/market', auth, async (req, res) => {
    let time_now = new Date();
    await Product.find().then((data) => {
        let prods = data;
        var sample = new Array();
        for (var i = 0; i < prods.length; i++) {
            let prod_time = new Date(prods[i].date);
            let active_seconds = (prods[i].activetime) * 60 * 60 * 1000;
            let time_difference = time_now.getTime() - prod_time.getTime();
            if (active_seconds > time_difference) {
                sample.push(prods[i]);
            }
        }

        //console.log(prods);
        //console.log(req.user);
        res.render('market', { data: sample})

    })
})

app.get('/market/:id', auth, async (req, res) => {

    // if time over and prodbidder table(w.r.t prod id and seller id) has more than 1 object => then this product is sold-> render soldforseller page for seller
            // render soldforwinner page for bid winner and render soldforothers page for others


            // if time over and prodbidder table(w.r.t prod id and seller id) has only 1 object => No bids placed -> place bid option is enabled for others and not for seller also
            // extend bid option is available for seller 

            // if time not over -> Then render simple product page with others having option to place bid and seller cannot

    if(!isValidObjectId(req.params.id))
    {
        res.render('404');
    }
    else
    {
     Product.findById(req.params.id, async (err, details) => {
        if (!err) {
            
            let time_now = new Date();
            let prod_time = new Date(details.date);
            let active_seconds = (details.activetime) * 60 * 60 * 1000;
            let time_difference = time_now.getTime() - prod_time.getTime();

            
            const prodBidDetails = await ProductBid.find({
                prodid: req.params.id,
                sellerid: details.sellerid
            });


            const prodReportDetails = await ProductReport.find({
                prodid: req.params.id,
                reportedby: req.user._id
            });

            var prodReport = {};
            if(prodReportDetails.length > 0)
            {
                var prodReport = { msg: 'Reported'};
            }

            /// idhr add krna hai  
              // Finding the highest bidder
       
              var findQuery = ProductBid.find({ prodid: req.params.id, sellerid: details.sellerid }).sort({ bidamount : -1 })
              findQuery.exec(async function  (err, finalprod)
              {
                  if (err) { return err; }
                  else
                  {



            if (active_seconds > time_difference)  // Time is left
            {
                var data = { msg: 'hello' };  // if the seller is visiting product page then he cannot bid while others can place bid
                var data2 = {};
                if (req.user._id.toString() === details.sellerid)
                {
                    data = {};
                    data2 = { msg: 'hello' };
                }
                //var initDate = new Date(details.date);
                //var activeTime = details.activetime;

                //var dateNow = new Date();
                
                //initDate.setHours(initDate.getHours() + activeTime);
                //var f = initDate.getTime() - dateNow.getTime();
                //console.log(f);

                if(req.user._id==finalprod[0].bidderid && (finalprod[0].sellerid != finalprod[0].bidderid))
                {
                    var highestBid = { msg : 'You are bidding the highest!'};
                }

                var biddercount = {};
                if(prodBidDetails.length > 1)
                {
                    biddercount = { count: prodBidDetails.length-1} ;
                }
                else
                {
                    biddercount = { countzero: 'This bid is currently active'} ;
                }

                res.render('product', { details: details, userid: req.user._id, prodId: details._id, flag: data, flag3 : data2,
                initDate: details.date, activetime: details.activetime, biddercount : biddercount, highestBid : highestBid, prodReport : prodReport
                });
            }

            else   // Time is over
            {
                
                
                if (prodBidDetails.length > 1)  // The product has been bid by others => product is sold to highest bidder
                {

                    // DELETING 3 IMAGES OF THE SOLD PRODUCT TO SAVE STORAGE

                    var imageurls = new Array();
                    let str1 = "https://" + details.image2;
                    let str2 = "https://" + details.image3;
                    let str3 = "https://" + details.image4;
                    imageurls.push(str1);
                    imageurls.push(str2);
                    imageurls.push(str3);
                    
            
                    // Delete images from s3
            
                    try {
                            for(var i=0; i<3; i++)
                            {
                            const urix0 = imageurls[i]
                            
                            const { region, bucket, key } = await AmazonS3URI(urix0)
                            
                            await s3.deleteObject({Bucket: process.env.AWS_BUCKET_NAME, Key: key}, function(err, dataDeleted) {
                            if (err) 
                            {
                                console.log(err);  // error
                            }
                            });
                            }
                        } catch (err) {
                        console.log(err) // should not happen because `uri` is valid in that example
                        }
                    





                  

                            // Creating the bidding table withe user bids and their images
                            let rex = [];
                                var bidamounts = new Array();
                                for (var i = 0; i < finalprod.length-1; i++)
                                {
                                var obj1 = {};
                                let bamount = finalprod[i].bidamount;
                                            
                                const userDetailsSearched = await Register.findById(finalprod[i].bidderid, (err, userDetails) => {
                                if (!err) 
                                {
                                    var sno = i+1;
                                    obj1 = {sno: sno, bidamount: bamount, name: userDetails.name, image: userDetails.userimage};
                                    rex.push(obj1);
                                }
                                else 
                                {
                                    console.log(err);
                                }
                                }).clone().catch(function(err)
                                {
                                    console.log(err);
                                }
                                ); 
                                }



                            // Winner opens the page
                            if (req.user._id.toString() === finalprod[0].bidderid) {

                                // Details of seller
                                Register.findById(details.sellerid, (err, details) => {
                                    if (!err) {
                                        // console.log(details);
                                        res.render('soldforwinner', { details: details });
                                    }
                                    else {
                                        console.log(err);
                                    }
                                })
                            }


                            // Seller opens the page
                            else if (req.user._id.toString() === details.sellerid) {

                                // details of winner
                                Register.findById(finalprod[0].bidderid, (err, details) => {
                                    if (!err) {
                                        res.render('soldforseller', { details: details, biddetails: rex });
                                    }
                                    else {
                                        console.log(err);
                                    }
                                })
                            }
                            // Other bidders open the page
                            else
                            {
                                
                                res.render('soldforothers', { biddetails: rex, details: details });  
                            }



                }
                else   // product has not been bid by others => the product is unsold  
                {
                    var data1 = {};
                    var data2 = { msg: 'hello' };
                    res.render('product', { message: 'Sorry, your product wasnt bidded. Try reducing the base price', flag : data1, flag2 : data2, prodId : details._id, details : details});
                }

            }

        }  //// **************** purana else
                        
    });  ///////********** purana findquery
            
        }  /// *********************************** isse phle khtm krde
        else {
            console.log(err);
        }
    })
}
})



app.get('/myproducts', auth, async (req, res) => {

    const prodDetails = await Product.find({
        sellerid: req.user._id
    });
    res.status(201).render('myproducts', { details: prodDetails });

})

app.get('/extend/:id', auth, (req, res) => {

    if(!isValidObjectId(req.params.id))
    {
        res.render('404');
    }
    else
    {

    Product.findById(req.params.id, (err, details) => {
        if (!err) {
            res.render('extend', { details: details, prodId: details._id,  initDate: details.date, activetime: details.activetime });
        }
        else {
            console.log(err);
        }
    })
}
})



app.post('/extend/:id', auth, async (req, res) => {

    try {
        const x = parseInt(req.body.extendTime);

        Product.findById(req.params.id, (err, prodDetails) => {
            if (!err) {
                let time_now = new Date();
                const y = parseInt(prodDetails.activetime);
                const z = x + y;

             
                let prod_time = new Date(prodDetails.date);
                let active_seconds = (prodDetails.activetime) * 60 * 60 * 1000;
                let time_difference = time_now.getTime() - prod_time.getTime();

                if (active_seconds > time_difference)  // time left -> active time = active time + extend time
                {
                    Product.findByIdAndUpdate(req.params.id, { activetime: z }, async function (err, doc) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            res.redirect('back');
                        }
                    })
                }
                else  // time over -> date = date.now() and active time = extend time
                {
                    Product.findByIdAndUpdate(req.params.id, { activetime: x, date : time_now }, async function (err, doc) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            res.redirect('back');
                        }
                    })
                }

            }
            else {
                console.log(err);
            }
        })

    }
    catch (err) {
        console.log(err);
    }
})

app.get('/profile', auth, (req, res) => {
    try {
        Register.findById(req.user._id, (err, userDetails) => {
            if (!err) {
                res.render('profile', { details: userDetails });
            }
            else {
                console.log(err);
            }
        })
    }
    catch (error) {
        console.log(error);
    }
})




app.get('/mybids', auth, async (req, res) => {
    try
    {
    const prodDetails = await ProductBid.find({
        bidderid: req.user._id
    });
  
    let data = prodDetails;
    var sample = new Array();
    for (var i = 0; i < data.length; i++) {
        if (req.user._id.toString() != data[i].sellerid) 
        {
           const sendProdDetails =  await Product.find({
               _id: data[i].prodid
            }).clone();
            sample.push(sendProdDetails[0]);
        }
    }

    // appending bidamount in product details
    for(var i=0; i<sample.length; i++)
    {
        sample[i].image2 = prodDetails[i].bidamount;
    }

    res.status(201).render('mybids', { prodDetails: sample });

    }

    catch (error) 
    {
        console.log(error);
    }

    

})





app.post('/market/:id', auth, async(req, res) => {
    try {
        Product.findById(req.params.id,(err, prodDetails) => {
            if (!err) {
                //console.log(prodDetails);
                if (prodDetails.currentbid < req.body.bid) {
                    Product.findByIdAndUpdate(req.params.id, { currentbid: req.body.bid }, async function (err, doc) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            // updating product vs bidder table

                            const bidderprodinfo = await ProductBid.findOne({
                                prodid: prodDetails._id,
                                sellerid: prodDetails.sellerid,
                                bidderid: req.user._id,
                            });

                            if (bidderprodinfo) {
                                ProductBid.findByIdAndUpdate(bidderprodinfo._id, { bidamount: req.body.bid }, async function (err, doc) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    else {
                                        //console.log('Updated bid');
                                    }
                                })
                                }
                            else {
                                try {
                                    const bidderProduct = new ProductBid({
                                        prodid: prodDetails._id,
                                        sellerid: prodDetails.sellerid,
                                        bidderid: req.user._id,
                                        bidamount: req.body.bid,
                                        date: Date.now()
                                    })

                                    const bidderprodDetails = await bidderProduct.save();
                                    //console.log(bidderprodDetails);
                                }
                                catch (err) {
                                    console.log(err);
                                }

                                
                            }
                            res.redirect('back');

                        }
                    })
                }
                else {
                    Product.findById(req.params.id, (err, details) => {
                        if (!err) {

                            var data = { msg: 'hello' };  // if the seller is visiting product page then he cannot bid while others can place bid
                            var data2 = {};
                            if (req.user._id.toString() === details.sellerid) {
                                data = {};
                                data2 = { msg: 'hello' };
                            }
                            res.render('product', { details: details, userid: req.user._id, prodId: details._id, flag: data, flag3: data2,initDate: details.date, activetime: details.activetime, message: 'Place higher bid' });
                            
                            
                        }
                        else {
                            console.log(err);
                        }
                    })

                    
                }
            }
            else {
                console.log(err);
            }
        })
        
    }
    catch (error) {
        res.status(400).send(error);
    }

})




app.get('/addproduct', auth, (req, res) => {
    res.render('addproduct', {user : req.user});
})

app.post('/addproduct',auth, upload.array('productimages', 4), async (req, res) => {
    try {
   
        const files = req.files;  // CHECK THE MINIMUM COUNT OF IMAGES
        const startingbid = req.body.startingbid;
        if (startingbid > 0) 
        {
                   //  PRODUCT IMAGES DO NOT HAVE HTTPS ATTACHED TO THEM BY DEFAULT WHILE USER IMAGES DO HAVE

            let imageArray = new Array();
            let tempArray = new Array();


            // CONSTRUCTING THE URL AS GIVEN BELOW 

            for(var i = 0; i<req.files.length; i++)
            {

                var fix = 'bidclub.s3.amazonaws.com/';
                var fileAddress = Date.now() + req.files[i].originalname;
                tempArray.push(fileAddress);
                var f = fix + fileAddress;
                imageArray.push(f);
            }

            //Adding to product List
            var i = 0;
            const resizePromises = await req.files.map(async (file) => { 
                try
                {
                        s3.upload({
                        Bucket : process.env.AWS_BUCKET_NAME,      // bucket that we made earlier
                        Key : tempArray[i],               // Name of the image
                        Body: file.buffer,                    // Body which will contain the image in buffer format
                        ContentType:"image/jpeg"                 // Necessary to define the image content-type to view the photo in the browser with the link

                    }, async (error,data)=>{
                        if(error){
                            res.status(500).send(error)  // if we get any error while uploading error message will be returned.
                        }
                        else{
                        }
                    })
                    i++;
                    
                }
                catch(err)
                {
                    console.log(err);
                }
                })

                    const addProd = new Product({
                        name: req.body.name,
                        sellerid: req.user._id,
                        activetime: req.body.activetime,
                        startingbid: req.body.startingbid,
                        currentbid: req.body.startingbid,
                        description: req.body.description,
                        image1: imageArray[0],
                        image2: imageArray[1],
                        image3: imageArray[2],
                        image4: imageArray[3],
                        date: Date.now()
                        })
               
                    const addedproduct = await addProd.save();

                    //Adding to Product Vs Bidder Table
                    const bidProd = new ProductBid({
                    prodid: addedproduct._id,
                    sellerid: req.user._id,
                    bidderid: req.user._id,
                    bidamount: addedproduct.startingbid,
                    date: Date.now()
                    })

                    const bidderdata = await bidProd.save();
                    res.status(201).redirect('market');
        }

            else {

                res.render('addproduct', { message: 'the starting bid should be greater than 0' })
            }
        }
    catch (error) {
        res.status(400).send(error);
    }

})


app.get('/editproduct/:id', auth, (req, res) => {

    if(!isValidObjectId(req.params.id))
    {
        res.render('404');
    }
    else
    {

    Product.findById(req.params.id, (err, details) => {
        if (!err) {
            res.render('editproduct', { details: details, prodId: details._id });
        }
        else {
            console.log(err);
        }
    })
    }
})

app.post('/editproduct/:id', auth, async (req, res) => {
    try {
        const time_extend = req.body.extendTime;
        const starting_bid = req.body.startingbid;
        const description = req.body.description;
        let time_now = new Date();
        Product.findByIdAndUpdate(req.params.id, { activetime: time_extend, startingbid: starting_bid, date : time_now, currentbid : starting_bid, description: description}, async function (err, doc) {
            if (err) {
                console.log(err);
            }
            else {
                const prodBidDetails = await ProductBid.find({
                    prodid: req.params.id,
                    sellerid: req.user._id
                });
                //console.log(prodBidDetails);
                ProductBid.findByIdAndUpdate(prodBidDetails[0]._id, { bidamount: starting_bid, date: time_now }, async function (err, doc) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // const prodDetails = await Product.find({
                        //     sellerid: req.user._id
                        // });
                        // res.render('myproducts', { message: 'Your Product has been listed again with updated details', details: prodDetails });

                        Product.findById(req.params.id, async (err, details) => {
                            if (!err) {
                                res.render('product', {message:'Your product has been listed again', details: details,initDate: details.date, activetime: details.activetime});
                            }
                            else
                            {
                                console.log(err);
                            }
                        })
                    }

                })
            }

        })
    }
    catch(err)
    {
        console.log(err);
    }
})


app.get('/logout', auth, async (req, res) => {
    try {

        req.user.tokens = req.user.tokens.filter((currElement) => {
            return currElement.token != req.token
        })

        res.clearCookie('jwt');
        //console.log('logged out');

        // req.user comes from auth.js
        await req.user.save();
        res.render('login');

    }
    catch (error) {
        res.status(500).send(error);
    }


})




app.get('/editprofile', auth, (req, res) => {
    Register.findById(req.user._id, (err, details) => {
        if (!err) {
            res.render('editprofile', { details: details});
        }
        else {
            console.log(err);
        }
    })
})


app.post('/editprofile', auth, upload.single('image'), async (req, res) => {
    try {
        let userimage = '';
        let name = '';
        let email = '';
        let phone = '';
        const currentDetails = await Register.findById(req.user._id, async (err, details) => {
            if (!err) {
                userimage = details.userimage;
                //console.log(userimage);
                if(req.body.name)
                {
                    name = req.body.name;
                }
                else
                {
                    name = details.name;
                }
                if(req.body.phone)
                {
                    phone = req.body.phone;
                }
                else
                {
                    phone = details.phone;
                }
                if(req.body.email)
                {
                    email = req.body.email;
                }
                else
                {
                    email = details.email;
                }

            }
            else{
                console.log(err);
            }
        }).clone()

      

        if(req.file)
        {
            //console.log(req.file);
            try{
                    const params = {
                    Bucket : process.env.AWS_BUCKET_NAME,      // bucket that we made earlier
                    Key : Date.now() + req.file.originalname,               // Name of the image
                    Body: req.file.buffer,                    // Body which will contain the image in buffer format
                    ContentType:"image/jpeg"                 // Necessary to define the image content-type to view the photo in the browser with the link
                };

                await s3.upload(params, async (error,data)=>{
                    if(error){
                        res.status(500).send(error)  // if we get any error while uploading error message will be returned.
                    }
                    else
                    {
                        // Delete old image
                        try {
                            const uri = userimage
                            const { region, bucket, key } = await AmazonS3URI(uri)
                            await s3.deleteObject({Bucket: process.env.AWS_BUCKET_NAME, Key: key}, function(err, dataDeleted) {
                                if (err) 
                                {
                                    console.log(err);  // error
                                }
                                else
                                {     
                                    // deleted
                                }
                                });
                            } catch (err) {
                            console.log(err) // should not happen because `uri` is valid in that example
                            }
    
                        //upload new 
    
                        const userUpdate = await Register.findByIdAndUpdate(req.user._id, { name: name, email : email, phone : phone, userimage : data.Location}, function (err, doc) {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                Register.findById(req.user._id, (err, details) => {
                                    if (!err) {
                                        res.render('profile',{message : 'Details Updated', details: details});
                                    }
                                    else {
                                        console.log(err);
                                    }
                                })
                                
                            }
                        }).clone()
                    }
                })




        
            }
            catch(err)
            {
                console.log(err);
            }

        }
        else
        {
            const userUpdate = await Register.findByIdAndUpdate(req.user._id, { name: name, email : email, phone : phone}, function (err, doc) {
                if (err) {
                    console.log(err);
                }
                else {
                    Register.findById(req.user._id, (err, details) => {
                        if (!err) {
                            res.render('profile',{message : 'Details Updated', details: details});
                        }
                        else {
                            console.log(err);
                        }
                    })
                    
                }
            }).clone()
        }

        

    }
    catch(err)
    {
        console.log(err);
    }
})


app.get('/about', (req, res) => {
})



app.get('/login', (req, res) => {
    res.render('login')
})


app.post('/register', upload.single('image'), async (req, res) => {
    try {
        
        const password = req.body.password;
        const cpassword = req.body.cpassword;
        const email = req.body.email;
        if (password === cpassword) {
            const userDetails = await Register.findOne({ email: email });
            if (userDetails == null) {


            let transporter = nodemailer.createTransport({
                service : 'Gmail',
                auth: {
                  user: process.env.EMAIL_ID,
                  pass: process.env.EMAIL_PASSWORD,
                }
                
            });

            var mailOptions = {
                to: req.body.email,
                subject: "BidClub Verification",
                html: "<div style='font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2'><div style='margin:50px auto;width:70%;padding:20px 0'><div style='border-bottom:1px solid #eee'><a href='https://bid-club.herokuapp.com/' style='font-size:1.4em;color: purple;text-decoration:none;font-weight:600'>BidClub</a></div><p style='font-size:1.1em'>Hi,</p><p>Thank you for choosing BidClub. Use the following OTP to complete your Sign Up procedure. </p><h2 style='background: #b19cd9;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;'>" + otp + "</h2><p style='font-size:0.9em;'>Regards,<br />Team BidClub</p><hr style='border:none;border-top:1px solid #eee' /><div style='float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300'><p>BidClub</p><p>Rudrapur</p><p>Uttarakhand, India</p></div></div></div>"
            };
        
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }

            });
            res.render('verify');



            
            //********************************************************** ****************************
            
            req_file_originalname = req.file.originalname;
            req_file_buffer = req.file.buffer;
            req_body_name = req.body.name;
            req_body_email = req.body.email;
            req_body_phone = req.body.phone;
            req_body_password = req.body.password;
            req_body_cpassword = req.body.cpassword;


             //********************************************************** ****************************

            }
            else {
                res.render('register', {message:'This email id is already registered'})
            }
        }
        else {
            res.render('register', {message: 'The passwords are not matching'});
        }

    }
    catch (err) {
        res.status(400).send(err);
    }

})



app.get('/verify', (req, res) => {
    res.render('verify');
})


app.post('/verify', upload.single('image'), async (req, res) => {
    try 
    {
        //console.log('Verify: ',otp);
        //console.log('req.body.otp', req.body.otp);

        if(req.body.otp == otp)
        {
            // otp matched, user verified ******************

            try
            {
                    const params = {
                    Bucket : process.env.AWS_BUCKET_NAME,      // bucket that we made earlier
                    Key : Date.now() + req_file_originalname,               // Name of the image
                    Body: req_file_buffer,                    // Body which will contain the image in buffer format
                    ContentType:"image/jpeg"                 // Necessary to define the image content-type to view the photo in the browser with the link
                    };
    
    
                    // uplaoding the photo using s3 instance and saving the link in the database.

                    s3.upload(params, async (error,data)=>{
                    if(error){
                        res.status(500).send(error)  // if we get any error while uploading error message will be returned.
                    }
                    else
                    {
                        const regUser = new Register({
                        name: req_body_name,
                        email: req_body_email,
                        phone: req_body_phone,
                        password: req_body_password,
                        cpassword: req_body_cpassword,
                        userimage: data.Location,
                        active: true,
                        date: Date.now()
                        })

                        const token = await regUser.generateAuthToken();

                        res.cookie('jwt', token, {
                            expires: new Date(Date.now() + 600000),
                            httpOnly: true
                        })

                        const registered = await regUser.save();
                        res.status(201).render('login');
                    }
                    })
            
            }
            catch(err)
            {
                console.log(err);
            }
        }
        else  /// otp does not match
        {
            res.render('verify',{message: 'OTP does not match'});
        }
    }
    catch(err)
    {
        console.log(err);
    }

})


app.post('/login', async (req, res)=> {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userEmail= await Register.findOne({
            email: email
        });

        const isMatch = await bcryptjs.compare(password, userEmail.password);
        const token = await userEmail.generateAuthToken();
        //console.log(token);

        res.cookie('jwt', token, {
            expires: new Date(Date.now() + 600000),
            httpOnly: true })

        if (isMatch) {
            if(userEmail.active)
            {
                res.status(201).redirect('market');
            }
            else
            {
                res.render('verify');
            }
        }
        else {
            res.render('login', {message:'Invalid Credentials'});
        }
        
    }
    catch (error) {
        res.render('login', { message: 'Invalid Credentials' });
    }

})



// $or: [{sellerid : req.params.id},{bidderid : req.params.id}]
app.post('/search', auth, async (req, res) => {
    try{
    let searched = req.body.prods;
    const ans = await Product.find({ $or: [{name : {$regex: searched, $options: '$i'}}, {description : {$regex: searched, $options: '$i'}}]})
    .then(data => {
        let time_now = new Date();
        let prods = data;
        var sample = new Array();
        for (var i = 0; i < prods.length; i++) {
            let prod_time = new Date(prods[i].date);
            let active_seconds = (prods[i].activetime) * 60 * 60 * 1000;
            let time_difference = time_now.getTime() - prod_time.getTime();
            if (active_seconds > time_difference) {
                sample.push(prods[i]);
            }
        }
        var msg = "Here are your matching products:";
        if(sample.length == 0)
        {
            msg = "Oops, no products found!";
        }
        res.render('market', { data: sample, message: msg});
    })
    }
    catch(err)
    {
        console.log(err);
    }
})



app.get('/*', (req, res) => {
    res.render('404');
})

app.listen(PORT, () => {
})