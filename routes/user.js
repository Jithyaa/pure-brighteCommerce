var express = require('express');
var router = express.Router();
const userHelper = require('../helpers/user-helpers');
const {verifyLogin}=require('../helpers/middleware')
const controller=require('../controller/user-controller')
const { response } = require('../app');
const { route } = require('./admin');
const otpGenerator = require('otp-generator')
// const PDFDocument = require("pdfkit");
const twilio=require('twilio')
const SendOtp = require('sendotp');
const sendOtp = new SendOtp('398767AgUKE4j2SNBa64886fc7P1');
const { resolveContent } = require('nodemailer/lib/shared');

const{homeget,prolistget,userlogin,cartget,addtocrtget,wishlistget,addtowishget,remwishpost,
chngproqnt,placeorderget,placeorderpost,useadrsget,odrscsget,invoicedwnld,usewalletpost,orderget,
viewordrprdctget,verifypaymntpost,useExist,addnewadrspost,dltadrsget,rmvfromcart,prodetailsget,
productlistget,userprofget,addnewadrsprofilepost,editadrsget,editadrspost,dltprofileadrs,cancelorder,
returnorder,applycpnpost, walletget,reffget,error}

=require('../controller/user-controller');
const productHelpers = require('../helpers/product-helpers');



/* GET home page. */
router.get('/', homeget)



router.post('/product-list',prolistget)


// user login


router.get('/login', userlogin)
//  user signup


router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {
  // userHelper.doSignup(req.body).then((response) => {
  //   if (response == 1) {
  //     req.session.loginErr = "Email already used"
  //     res.redirect('/signup')
  //   }
  //   if (response != 1) {
  //     userHelper.doMailVarify(req.body.email) //*****  
  //     const { name, Email, password } = req.body; //---1 
  //     const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false }); //----2 
  //     // req.session.UserOtp=otp;      //==== 
  //     userHelper.insertOtp(req.body, otp) //-----3 
  //     const transporter = nodemailer.createTransport({
  //       host: 'smtp.ethereal.email',
  //       port: 587,
  //       auth: {
  //           user: 'yadira41@ethereal.email',
  //           pass: 'snB6qsvpmAvTXg7m11'
  //       }
  //   });
  //     const mailOptions = {
  //       from: 'yadira41@ethereal.email',
  //       to: Email,
  //       subject: 'OTP for sign up',
  //       text: `Your OTP is ${otp}`
  //     };
  //     transporter.sendMail(mailOptions, (err, info) => {
  //       if (err) {
  //         console.log(err);
  //         res.status(500).send({ message: 'Error sending OTP email' });
  //         client.close();
  //         return;
  //       }
  //     })
  
  userHelper.doSignup(req.body).then((response) => {
    if (response == 1) {
      req.session.loginErr = "Email already used"
      res.redirect('/signup')
    }
    if (response != 1) {
      userHelper.doMailVarify(req.body.email) //*****  
      const { name, Email, password,number } = req.body; //---1 
      const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false }); //----2 
      // req.session.UserOtp=otp;      //==== 
      userHelper.insertOtp(req.body, otp) //-----3 
       
  
      const accountSid = process.env.MY_ACC;
      const authToken = process.env.MY_AUTH;



      const client = twilio(accountSid, authToken);

      client.messages
        .create({
          body: `Your OTP is ${otp}`,
          to:  `+91${number}`, // Text your number
          from: `${process.env.MY_PH}`, // From a valid Twilio number
        })
        .then((message) => {
          console.log("Message is Succesfully Sent");
          
        });

            req.session.user = response
            req.session.user.loggedIn = true

            res.render('user/otp') //*** */ 
          }
        })
})
router.post('/otp', (req, res) => {
  

  userHelper.doMailCheck(req.body).then((status) => {

    if (status.status) {

      userHelper.doMailVarifySuccess(req.body)
      res.redirect("/login")

    } else {
      console.log("wrong otp" + req.session.UserOtp)
      alert("Wrong otp")
      res.redirect('/signup')
    }
  })
  // if(req.session.UserOtp==req.body.otp){ //==== 
  //   res.redirect('/login') 
  // }else{ 
  //   alert('wrong otp') 
  //   res.redirect('/signup') 
  //   req.session.UserOtp=null; 
  // } 
})
//     console.log(response)
//     res.redirect('/login')
//   })
// })
// router.post('/signup', async (req, res) => {
//   try {
//     const response = await userHelper.doSignup(req.body);
//     console.log(response);
//     res.redirect('/login');
//   } catch (err) {
//     console.log(err);
//     res.status(500).send("Error signing up.");
//   }
// });


router.get('/otp', (req, res) => {
  res.render('user/otp')
})
router.get('/mobile-otp',(req,res)=>{
  res.render('user/mobile-otp')
})
router.post('/')



router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.loggedIn = true
      res.redirect('/')
     
    }else if(response==1){
      req.session.blockError="you are blocked"
      res.redirect('/login')
    }
     else {
      req.session.loginErr = "Invalid username or password"
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})


router.get('/cart', verifyLogin,cartget)

router.get('/add-to-cart/:id',verifyLogin,addtocrtget)


router.get('/wishlist', verifyLogin, wishlistget)


router.get('/add-to-wishlist/:id', verifyLogin, addtowishget)

router.post('/remove-from-wishlist',remwishpost)


router.post('/change-product-quantity', chngproqnt)


router.get('/place-order',verifyLogin,placeorderget)


router.post('/place-order',placeorderpost)

router.get('/use_address',verifyLogin,useadrsget)

router.get('/order-success',verifyLogin,odrscsget)


router.post('/download-invoice',invoicedwnld)

router.post('/use-wallet',verifyLogin,usewalletpost)

router.get('/order',verifyLogin,orderget)

router.get('/view-order-product/:id',verifyLogin,viewordrprdctget)

router.post('/verify-payment',verifypaymntpost)

router.get('/use_address' ,verifyLogin,useExist)

router.post('/add-new-address',addnewadrspost)
//   let userId = req.body.userId;
//   let addressobj = {
//     name:req.body.name,
//     address:req.body.address,
//     pincode:req.body.pincode,
//     phone:req.body.phone
//   }
//   userHelper.addNewAddress(userId,addressobj).then(()=>{
//     res.redirect('/place-order')
// })

router.get('/delete-address',verifyLogin,dltadrsget)



router.post('/remove-from-cart',rmvfromcart)


router.get('/productdetails/:id',verifyLogin, prodetailsget)
// router.post('/logout',(req,res)=>{
//   req.session.destroy((err)=>{
//     if(err)console.log(err)
//       res.redirect('/')
//   })
// })

router.get('/product-list', productlistget)

router.get('/user-profile',verifyLogin,userprofget)

router.post('/add-new-address-profile',addnewadrsprofilepost)

router.get('/edit-address',verifyLogin,editadrsget)

router.post('/edit-address',editadrspost)

router.get('/delete-profile-address',dltprofileadrs )

router.get('/cancel-order',verifyLogin,cancelorder)

router.get('/return-order',verifyLogin,returnorder)


router.post('/apply-coupon',verifyLogin,applycpnpost)


router.get('/wallet',verifyLogin, walletget)


router.get("/refferal-link", verifyLogin,reffget)

router.get('/product',(req,res)=>{

  res.render('user/product')
})

router.post('addToProduct/:id',async(req,res)=>{
 let products= await productHelpers.getProduct(req.params.id)
    res.render('user/product',{products})

  
})

router.get('/error',error)











module.exports = router;
