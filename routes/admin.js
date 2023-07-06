var express = require('express');
var router = express.Router();
const {AdminverifyLogin}=require('../helpers/middleware')
const multer=require('multer')
const PDFDocument = require("pdfkit");
const upload = multer({ dest:'public/images'});
const path = require("path");
const fs = require("fs");
const { ORDER_COLLECTION } = require('../config/collections');
const { log } = require('console');
const { response } = require('../app');

const{viewprodget,viewprodpost,dashboardget,dwnldpost,addprodget,addprodpost,
     dltprodget,editprodget,editprodpost,loginget,loginpost,logout,alluserget,blockuser,
     unblock,hidecat,unhide,viewcat,addcateget,addcatepost,editcateget,editcatepost,userorder,
    stschange,viewcpn,editcpnget,editcpnpost,addcpnget,addcpnpost,dltcpn,banner,bannerget,
    addbannerget,addbannerpost,dltbanner,offerget,addOfferpost,error, salesReport,salesReports,
    dateFilterPost}=require('../controller/admin-controller')


// router.get('/admin',(req, res)=> {
//   if (req.session.admin) {
//     res.redirect("/admin");
//   } else {
//     res.render("admin/login", { loginErr: req.session.adminLoginErr });
//     req.session.adminLoginErr = false;
//   }
// })

// router.post('/admin/login', (req, res) => {
//   adminHelper.doLogin(req.body).then((response) => {
//     if (response.status) {
//       console.log("Admin is successfully loged in ");
//       req.session.admin = response.admin;
//       req.session.admin.loggedIn = true;
//       res.redirect("/admin");
//     } else {
//       req.session.adminLoginErr = "Invalid username or password";
//       res.redirect("/admin/adminLogin");
// }
// })
// })


/* GET users listing. */
router.get('/', AdminverifyLogin, viewprodget)



router.post('/', AdminverifyLogin, viewprodpost)



router.get('/dashboard',AdminverifyLogin,dashboardget)


router.post('/download',dwnldpost)


// add products 

router.get('/add-products', AdminverifyLogin, addprodget)
// router.post('/add-products', verifyLogin, (req, res) => {
//   productHelper.addProduct(req.body, (insertedId) => {
//     let image = req.files.Image;
//     image.mv('./public/product-images/' + insertedId + '.jpg', (err) => {
//       if (!err) {
//         res.render("admin/add-products");
//       } else {
//         console.log(err);
//         res.status(500).send("Error uploading the image.");
//       }
//     });
//   });
// });

router.post("/add-products", upload.array("image", 4), addprodpost)


// delete products

router.get('/delete-product/:id',dltprodget)
// edit product

router.get('/edit-product/:id', AdminverifyLogin, editprodget)


router.post("/edit-product/:id",AdminverifyLogin, upload.array("image", 4),editprodpost)

//  admin login page

router.get('/adminLogin', loginget)


router.post('/adminLogin',loginpost)

//  user information

router.get('/user-data', AdminverifyLogin, alluserget)
// admin logout

router.get('/adminLogout', AdminverifyLogin, logout)

//  block and unblock user

router.get('/block-user/:id', AdminverifyLogin, blockuser)

router.get('/unblock-user/:id', AdminverifyLogin,unblock)



//  category management

router.get('/hide-category/:id', AdminverifyLogin, hidecat)

router.get('/unhide-category/:id', AdminverifyLogin, unhide)

router.get('/view-category', AdminverifyLogin, viewcat)

router.get('/add-category', AdminverifyLogin, addcateget)

router.post('/add-category',AdminverifyLogin,upload.array("image", 1), addcatepost)

router.get('/edit-category/:id', AdminverifyLogin, editcateget)

router.post('/edit-category/:id', AdminverifyLogin, upload.array("image", 1),editcatepost)

//--category management end--//

router.get('/user-order', AdminverifyLogin, userorder)

router.get("/status-change", stschange) 

//--coupon management--//

router.get('/view-coupon',AdminverifyLogin,viewcpn)

router.get('/edit-coupon/:id',AdminverifyLogin, editcpnget)

router.post('/edit-coupon', editcpnpost)

router.get('/add-coupon',AdminverifyLogin, addcpnget)

router.post('/add-coupon',AdminverifyLogin, addcpnpost)

router.post('/delete-coupon',AdminverifyLogin, dltcpn)

//--coupon management end--//

//------Banner Management------//

router.get('/banner', banner)

router.get('/add-banner', bannerget)

router.get('/addBanner', addbannerget)

router.post('/addBanner', addbannerpost)

 router.get('/delete-banner/:id',AdminverifyLogin ,dltbanner)
// banner mangement end//

router.get('/offer',AdminverifyLogin, offerget)

// router.get('/offers', addofferget)

router.post('/offers/:id',addOfferpost)

router.get('/error',error)

// sales report  start//

router.get('/sales',salesReport)

router.get('/sales-report',salesReports)

router.post('/date-filter',dateFilterPost)

// sales report end //
module.exports = router;
