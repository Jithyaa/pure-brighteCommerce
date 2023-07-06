var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const userHelper = require('../helpers/user-helpers');
const categoryHelper=require('../helpers/category-helpers')
const couponHelper=require('../helpers/coupon-helpers')
const {verifyLogin}=require('../helpers/middleware')
const { response } = require('../app');
// const { route } = require('./admin');
const otpGenerator = require('otp-generator')
// const PDFDocument = require("pdfkit");
const twilio=require('twilio')

function userlogin (req, res) {
    console.log(req.session.user)
    if (req.session.userloggedIn) {
      res.redirect('/')
    } else {
  
      res.render('user/login', { "loginErr": req.session.loginErr, "blockError":req.session.blockError })
      req.session.loginErr = false
      req.session.blockError = false
  
    }
  };



async function homeget (req, res, next) {
    let user = req.session.user
    // let val = Number(req.query.p)
    console.log(user);
    let cartCount=null
    let banners=await userHelper.getBanners()
    if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
    }
    productHelper.getLatestProducts().then((products)=>{
    categoryHelper.getAllCategory().then((Category) => { let val = Number(req.query.p)
      // productHelper.getAllProductsPagination(val).then((products)=>{
    // productHelper.getAllProducts().then((products)=>{
      res.render('user/view-products', { Category, user,products,guest:true,cartCount,banners});
  })
  // })
  })
  };

  //----product-list---//
  // async function prolistget (req, res, next) {
  //   const user = req.session.user;
  //   let searchq = String(req.body.search);
  //   productHelper.searchProducts(searchq).then((products) => {
  //       res.render('user/product-list', { products, user });
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       res.render('user/product-list', { err, user });
  // })
  // };


  async function prolistget(req, res, next) {
    const user = req.session.user;
    const searchq = String(req.body.search);
  
    try {
      const products = await productHelper.searchProducts(searchq);
  
      if (products.length === 0) {
        // Redirect to the error page
        res.redirect('/error');
      } else {
        // Render the product list page with the search results
        res.render('user/product-list', { products, user });
      }
    } catch (err) {
      console.log(err);
      res.render('user/product-list', { err, user });
    }
  }
  
  
  //----cart---//

  async function cartget (req, res)  {
    let userId=req.session.user._id
    let user =await userHelper.getUser(userId)
    let products=await userHelper.getCartProducts(user._id)
    if(products.length){
    let total=await userHelper.getTotalAmount(user._id)
    // req.session.usedCoupon=null
    // req.session.user.pAmount=total
    // user.pAmount=total
    console.log(products);
    res.render('user/cart',{products,user,total})
    }else{
      req.session.cartEmpty="your cart is empty"
      let emptyError=req.session.cartEmpty
      res.render('user/cart',{user,emptyError})
    }
  };
  function addtocrtget(req,res){
    userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
     res.json({status:true})
    })
  }

  //---wishlist--//
  async function wishlistget (req, res)  {
    let userId=req.session.user._id
    let user = await userHelper.getUser(userId)
   let list= await userHelper.getWishlistProducts(userId)
   if(list){
   // let total=await userHealpers.getTotalAmount(user._id)
   // req.session.user.pAmount=total;
   //  user.pAmount=total
    res.render('user/wishlist',{list,user})
   }
   else{
    req.session.cartEmpty = "Your cart is empty"
    let emptyError = req.session.cartEmpty
    res.render('user/wishlist',{user:req.session.user,emptyError})
  }
  };
  function addtowishget(req, res) {
    userHelper.addToWishlist(req.params.id,req.session.user._id).then(()=>{
      res.json({status:true})
     
     })
    };

    function remwishpost(req,res){
        userHelper.removeFromwishlist(req.body).then((response)=>{
          res.json(response)
      })
      }

      function chngproqnt(req,res,next){
        console.log(req.body)
        userHelper.changeProductQuantity(req.body).then(async(response)=>{
        response.total=await userHelper.getTotalAmount(req.body.user)
          res.json(response)
        })
      };

      // async function placeorderget(req,res){
      //   let user=req.session.user
      //   let userAddresses=await userHelper.getUserAddress(user._id)
      //   let total= req.session.user.pAmount
      //   // let total=await userHelper.getTotalAmount(req.session.user._id)
      //   res.render('user/place-order',{user,total,userAddresses})
      // };


     async function placeorderget (req, res)  {
        try {
          const userId = req.session.user._id;
          const [user, userAddresses, total] = await Promise.all([
            userHelper.getUser(userId),
            userHelper.getUserAddress(userId),
            userHelper.getTotalAmount(userId)
          ]);
      
          req.session.usedCoupon = null;
          req.session.user.pAmount = total;
      
          res.render('user/place-order', { user, userAddresses, total });
        } catch (error) {
          // Handle and respond to the error
          res.status(500).json({ error: 'Something went wrong' });
        }
      };



      async function placeorderpost(req,res){
        userId=req.session.user._id
        let couponAmount=await couponHelper.getCouponAmount(req.session.usedCoupon)
        console.log("ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd")
        console.log(couponAmount)
        console.log("ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd")
        let walletAmount=await couponHelper.getWalletAmount(userId)
        let products=await userHelper.getCartProductList(req.body.userId)
        let total=req.session.user.pAmount
        req.body.couponAmount=couponAmount;

        req.body.walletAmount=walletAmount;
       userHelper.placeOrder(req.body,products,total).then((orderId)=>{
        req.session.orderId=orderId
        if(req.body['payment-method']=='COD'){
        res.json({codSuccess:true})
        }else{
          userHelper.generateRazorpay(orderId,total).then((response)=>{
            res.json(response)
      
          })
        }
      
       })
       console.log("jreirthruty")
        console.log(req.body)
      };
      // async function useadrsget(req,res){
      //   let Id = req.query.id;
      //   let user = req.session.user;
      //   let userAddresses = await userHelper.getUserAddress(user._id);
      //   let userAddress = await userHelper.getOneAddress(Id);
      //   // let total = await userHelper.getTotalAmount(user._id);
      //   let total= req.session.user.pAmount
      //   if(req.session.couponDiscount){
      //   total = total-req.session.couponDiscount
      //   }
      //   res.render('user/place-order', { userAddress, user,total, userAddresses });
      // };


      async function useadrsget (req, res){
        let Id = req.query.id;
        let userId = req.session.user._id
        // let user= await userHelpers.getUser(userId)
        // let userAddresses = await userHelpers.getUserAddress(userId)
        // let userAddress =  await userHelpers.getOneAddress(Id)
        // let total = await userHelpers.getTotalAmount(user._id);
        const [user,userAddresses,userAddress,total]=await Promise.all([
          userHelper.getUser(userId),
          userHelper.getUserAddress(userId),
          userHelper.getOneAddress(Id),
          userHelper.getTotalAmount(userId)
          
      
        ])
        req.session.usedCoupon=null
        res.render('user/place-order', { userAddress, user, total,userAddresses });
      }


      async function odrscsget(req,res){
        let orders=await userHelper.getUserOrders(req.session.user._id)
        let user = req.session.user;
        let price = req.session.user.pAmount;
        let amount=req.session.user.walletBalance;
        let id=req.session.orderId;
      
        if(req.session.walletApply){
          userHelper.deductAmountWallet(amount,user._id)
          req.session.walletApply=false;
          req.session.walletBalance = 0;
        }
      
        if (req.session.usedCoupon) {
          let user= req.session.user;
          let usedCoupon = req.session.usedCoupon;
          userHelper.deleteCoupon(user._id, usedCoupon);
          req.session.usedCoupon = null;
          req.session.couponDiscount = false;
        }
      
        let coupon = await couponHelper.giveCoupon(price);
        if (coupon) {
          let userId = user._id;
          userHelper.addCouponUser(userId, coupon);
        }
        req.session.user.pAmount = 0;
        let order=await userHelper.getUserOrder(id)
        // productHelper.changeQuantity(order.products)
        req.session.orderId=null;
      
        res.render('user/order-success',{user,orders,coupon,order})
      
      };


      async function invoicedwnld(req,res){
        let id = req.query.id
        try {
         let order=await userHelper.getOrder(id)
         console.log(order);
        
          const data = [
            
              order// Your invoice data here
          
            
          ];
      
          const doc = new PDFDocument();
      
          // Set the response headers for PDF download
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            "attachment; filename=sales_report.pdf"
          );
      
          // Create the table header
          doc.font("Helvetica-Bold").fontSize(12);
          doc.text("Product ID", 2, 50);
          doc.text("Date", 150, 50);
          doc.text("Address", 250, 50);
          doc.text("Mobile Number", 350, 50);
          doc.text("Amount", 450, 50);
          doc.text("Pay Method", 540, 50);
      
          let y = 70;
      
          
       
      
          // Create the table rows
          doc.font("Helvetica").fontSize(20);
          doc.text("Pure Bright", 215, y + -65);
          doc.font("Helvetica").fontSize(10);
      
      
      
          data.forEach((order) => {
            doc.text(order.products[0].itemName, 2, y);
            doc.text(order.date.toLocaleDateString(), 150, y);
            doc.text(order.deliveryDetails.address, 250, y);
            doc.text(order.deliveryDetails.phone, 350, y);
            doc.text(order.totalAmount.toString(), 450, y);
            doc.text(order.paymentMethod, 550, y);
      
            y += 20;
          });
      
          let date = new Date();
        doc.font("Helvetica-Bold").fontSize(12);
        doc.text("Total Amount:", 250, y + 20);
        doc.text(order.totalAmount, 350, y + 20);
        doc.text("Date:", 250, y + 80);
        doc.text(date, 350, y + 80);
      
          // Pipe the PDF document to the response
          doc.pipe(res);
      
          // End the document
          doc.end();
        } catch (error) {
          console.error(error);
          res.status(500).send("An error occurred while generating the invoice.");
      }
      };

      async function usewalletpost (req,res){
        let wallet=req.body.wallet;
        let Amount = req.session.user.pAmount
        let balance 
        let walletBalance 
        if(wallet > Amount){
          balance = 0;
          walletBalance = Math.abs(Amount-wallet);
        } else {
          balance = Math.abs(Amount-wallet);
          walletBalance = 0
        }
        req.session.user.pAmount = balance;
        req.session.user.walletBalance = walletBalance
        req.session.walletApply=true;
      
        let response={}
        response.total = balance;
        response.walletBalance = walletBalance
        res.json(response)
      
      };

      async function orderget(req,res){
        let orders=await userHelper.getUserOrders(req.session.user._id)
        res.render('user/order',{user:req.session.user,orders})
      };

      async function viewordrprdctget(req,res){
        let products=await userHelper.getOrderProducts(req.params.id)
        let orders=await userHelper.getOrder(req.params.id)
        res.render('user/view-order-product',{user:req.session.user,products,orders})
      }

      function verifypaymntpost(req,res){
        console.log(req.body);
        userHelper.verifyPayment(req.body).then(()=>{
          userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
            console.log("Payment successfull")
            res.json({status:true})
          })
        }).catch((err)=>{
          console.log(err);
          res.json({status:false,errMsg:''})
        })
      };

      async function useExist(req, res){
        let Id = req.query.id;
        let user = req.session.user;
        let userAddresses = await userHelper.getUserAddress(user._id);
        let userAddress = await userHelper.getOneAddress(Id)
        let total = await userHelper.getTotalAmount(user._id);
        if(req.session.couponDiscount){
          total=total-req.session.couponDiscount
        }
        res.render('user/place-order', { userAddress, user, total,userAddresses  });
      };

      function addnewadrspost(req,res){
        let userId = req.body.userId;
            let addressobj = {
             name:req.body.name,
             address:req.body.address,
             pincode:req.body.pincode,
             phone:req.body.phone
        }
        userHelper.addNewAddress(userId,addressobj).then(()=>{
          res.redirect('/place-order')
        })
      };

      function dltadrsget (req,res){
        let Id=req.query.id
            userHelper.deleteAddress(Id)
            res.redirect('/place-order')
      };

      function rmvfromcart(req,res){
        userHelper.removeFromCart(req.body).then((response)=>{
          res.json(response)
        })
      };

      async function prodetailsget (req, res)  {
        let product = await productHelper.getProductDetails(req.params.id)
        let user = req.session.user
        console.log(product + "gay")
        res.render("user/product-details.hbs", { product, user: true, guest: true, user })
      
      };

      function productlistget(req, res, next) {
        let user = req.session.user;
        let val = Number(req.query.p);
        userHelper.AllProductsPagination(val).then((products) => {
          console.log(products);
          res.render('user/product-list', { user: true, products, guest: true, user });
        }).catch((error) => {
          console.log(error);
          res.redirect('/error'); // Handle the error by redirecting to the home page or an error page
        });
      };

      async function userprofget(req,res){
        let user = req.session.user
        // let user = await userHelpers.userDetails(userSession._id)
        let userAddresses = await userHelper.getUserAddress(user._id)
        // let orderDetails = await userHelpers.getOrderDetails(userSession._id)
        console.log(user) 
        res.render('user/user-profile',{user,userAddresses})
      }


      function addnewadrsprofilepost(req,res){
        let userId = req.body.userId;
        let addressobj = {
          name:req.body.name,
          address:req.body.address,
          pincode:req.body.pincode,
          phone:req.body.phone
        }
        userHelper.addNewAddress(userId,addressobj).then(()=>{
          res.redirect('/user-profile')
        })
      };

     function editadrsget (req,res){
        let Id = req.query.id;
        let addressobj = {
          name:req.body.name,
          address:req.body.address,
          pincode:req.body.pincode,
          phone:req.body.phone
       }
       userHelper.editAddress(Id,addressobj) 
       res.redirect('user/edit-address')
       };

       function editadrspost(req,res){
        let Id = req.query.id;
        let addressobj = {
          name:req.body.name,
             address:req.body.address,
             pincode:req.body.pincode,
             phone:req.body.phone
       }
       userHelper.editAddress(Id,addressobj) 
       res.redirect('/user-profile')
       };

      function dltprofileadrs (req,res){
        let Id = req.query.id;
       userHelper.deleteAddress(Id) 
      res.redirect('/user-profile')
      };

      async function cancelorder(req,res){
        let id=req.query.id;
        let status=req.query.st;
        await userHelper.cancelOrder(id,status)
        res.redirect('/order')
      };

      async function returnorder (req,res){
        let id = req.query.id;
        let status = req.query.st;
        let userId = req.session.user._id;
        userHelper.cancelOrder(id, status);
      
        let order = await userHelper.getOrder(id) 
        let amount = order.totalAmount
        userHelper.addAmountWallet(amount,userId)
      
        res.redirect("/order");
      };

      async function applycpnpost (req,res){
        let couponCode = req.body.coupon;
        console.log(couponCode);
        const currDate = new Date();
        let userCoupon = await couponHelper.applyCoupon(couponCode);
        if(userCoupon && !req.session.usedCoupon){
          let endDate = new Date(userCoupon.expiryDate);
        if (endDate > currDate) {
          let total=req.session.user.pAmount;
          let response={}
          req.session.usedCoupon = userCoupon.couponCode;
          response.response=true;
          response.discountAmount= userCoupon.discount
          response.newTotal=(total - userCoupon.discount)
          req.session.user.pAmount=(total- userCoupon.discount)
          res.json(response);
        } else {
          res.json({ response: false });
        }
      }else{
        res.json({ response: false });
      }
      };

      async function walletget (req,res){
        let userId=req.session.user._id
          let user= await userHelper.getUser(userId)
          res.render('user/wallet',{user})
      };

      function reffget(req, res) {
        users = req.session.user;
        cartCount = req.session.cartCount
        res.render("user/refferal-link", { user: true, users, cartCount });
      };

      function error(req, res) {
        res.render('admin/error')
      }
     



  module.exports={userlogin,homeget,prolistget,cartget,addtocrtget,wishlistget,addtowishget,remwishpost,
                chngproqnt,placeorderget,placeorderpost,useadrsget,odrscsget,invoicedwnld,usewalletpost,
                orderget,viewordrprdctget,verifypaymntpost,useExist,addnewadrspost,dltadrsget,rmvfromcart,
                prodetailsget, productlistget,userprofget,addnewadrsprofilepost,editadrsget,editadrspost,
                dltprofileadrs,cancelorder,returnorder,applycpnpost,walletget,reffget,error }