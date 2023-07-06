var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var adminHelper = require('../helpers/admin-helpers')
var categoryHelper = require('../helpers/category-helpers')
var couponHelper = require('../helpers/coupon-helpers')
var userHelper = require('../helpers/user-helpers')
const { AdminverifyLogin } = require('../helpers/middleware')
const multer = require('multer')
const PDFDocument = require("pdfkit");
const upload = multer({ dest: 'public/images' });
const path = require("path");
const fs = require("fs");
const { ORDER_COLLECTION } = require('../config/collections');
const { log } = require('console');
const { response } = require('../app');


function viewprodget(req, res, next) {
  let admin = req.session.admin
  let val = Number(req.query.p)
  productHelper.getAllProductsPagination(val).then((products) => {
    console.log(products)
    res.render('admin/view-products', { admin: true, products });

  })

};

function viewprodpost(req, res, next) {
  const admin = req.session.admin;
  let searchq = String(req.body.search);
  productHelper.searchProducts(searchq).then((products) => {
    res.render('admin/view-products', { products, admin });
  })
    .catch((err) => {
      console.log(err);
      res.render('admin/view-products', { err, admin });
    })
};

async function dashboardget(req, res) {
  let latestorder = await adminHelper.getAllLatestOrders();
  let latestuser = await adminHelper.getAllLatestUsers();
  let totaluser = await adminHelper.totalUser();
  let totalproduct = await adminHelper.totalProduct();
  let totalAmount = await adminHelper.totalAmount();
  let monthlydata = await adminHelper.getSellingProductInEachMonth();
  let paymentCounts = await adminHelper.paymentMethodCount()
  // let categoryCounts = await adminHelper.getItemCategoryCounts()

  res.render("admin/dashboard", {
    admin: true,
    latestorder,
    latestuser,
    totaluser,
    totalproduct,
    totalAmount,
    monthlydata,
    paymentCounts,
    // categoryCounts
  });
};

async function dwnldpost(req, res) {
  let totalPricesevenday = await adminHelper.getAmountLastSevenDay();
  let totalPricemonth = await adminHelper.getAmountLastMonth();
  let totalPriceyear = await adminHelper.getAmountLastYear();

  let totalQuatitysevenday =
    await adminHelper.getTotalProductQuantityLastSevenDays();
  let totalQuatitymonth = await adminHelper.getTotalProductQuantityLastMonth();
  let totalQuatityyear = await adminHelper.getTotalProductQuantityLastYear();

  let totalOrdersevenday = await adminHelper.getOrderLastSevenDay();
  let totalOrdermonth = await adminHelper.getOrderLastMonth();
  let totalOrderyear = await adminHelper.getOrderLastYear();

  let totalUsersevenday = await adminHelper.getUserInLastSevenDay();
  let totalUsermonth = await adminHelper.getUserInLastMonth();
  let totalUseryear = await adminHelper.getUserInLastYear();

  let totalAmounts = await adminHelper.totalAmount();
  let totalAmount = totalAmounts.totalAmount;
  let totalOrder = totalAmounts.totalOrders;
  let totalCustomer = await userHelper.totalUser();

  const data = [
    {
      days: "A week",
      sales: totalPricesevenday,
      orders: totalOrdersevenday,
      products: totalQuatitysevenday,
      customers: totalCustomer,
    },
    {
      days: "A month",
      sales: totalPricemonth,
      orders: totalOrdermonth,
      products: totalQuatitymonth,
      customers: totalCustomer,
    },
    {
      days: "A year",
      sales: totalPriceyear,
      orders: totalOrderyear,
      products: totalQuatityyear,
      customers: totalCustomer,
    },
  ];

  const doc = new PDFDocument();

  // Set the response headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");

  // Create the table header
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Days", 50, 50);
  doc.text("Sales (rupees)", 150, 50);
  doc.text("Orders", 250, 50);
  doc.text("Products", 350, 50);
  doc.text("Customers", 450, 50);
  let y = 70;
  // Create the table rows
  doc.font("Helvetica").fontSize(20);
  doc.text("Pure Bright", 210, y + -55);
  doc.font("Helvetica").fontSize(10);

  data.forEach((row) => {
    doc.text(row.days, 50, y);
    doc.text(row.sales.toString(), 150, y);
    doc.text(row.orders.toString(), 250, y);
    doc.text(row.products.toString(), 350, y);
    doc.text(row.customers.toString(), 450, y);
    y += 20;
  });

  let date = new Date();
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Total Income:", 250, y + 20);
  doc.text(totalAmount, 350, y + 20);
  doc.text("Total Orders:", 250, y + 40);
  doc.text(totalOrder, 350, y + 40);
  doc.text("Total Customers:", 250, y + 60);
  doc.text(totalCustomer, 350, y + 60);
  doc.text("Date:", 250, y + 80);
  doc.text(date, 350, y + 80);

  // Pipe the PDF document to the response
  doc.pipe(res);

  // End the document
  doc.end();
};

async function addprodget(req, res) {
  let admin = req.session.admin
  let category = await categoryHelper.getAllCategory()
  res.render('admin/add-products', { admin, category })
};

async function addprodpost(req, res) {
  console.log(req.files)

  const {
    name,
    Category,
    price,
    description

  } = req.body;
  console.log(req.body)
  console.log(req.file)

  const photos = req.files.map((file) => {
    const oldPath = `${file.path}`;
    const newPath = `${file.path}.png`;
    if (fs.existsSync(oldPath)) {
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
        console.log('file renamed')
      })
    } else {
      console.log(('not renamed'));
    }
    return {
      // id:  path.basename(newPath),
      title: file.originalname,

      fileName: newPath.replace(/public/gi, "")
      //  filepath: file.path.replace(/views/gi,"")
    };
  })
  console.log(photos)


  productHelper.addProduct({ name: name, category: Category, price: price, description: description, photos: photos }, (id) => {

    req.session.admin.loggedIn = true
    res.redirect('/view-product')

  })
};

function dltprodget(req, res) {
  let proId = req.params.id
  console.log(proId)
  productHelper.deleteProduct(proId).then((response) => {
    res.redirect('/admin/')
  })

};

// async function editprodget(req, res) {
//   let product = await productHelper.getProductDetails(req.params.id)
//   console.log(product)
//   res.render('admin/edit-product', { product })
// };

async function editprodget(req, res) {
  try {
    const product = await productHelper.getProductDetails(req.params.id);
    res.render('admin/edit-product', { product });
  } catch (error) {
    // Handle any errors that occur
    console.log(error);
    res.redirect("/admin"); // Redirect to an appropriate error page or display a flash message
  }
}



async function editprodpost(req, res) {
  const { name, Category, price, description, updatePhoto } = req.body;

  try {
    const product = await productHelper.getProductDetails(req.params.id);
    const existingPhotos = product.photos;
    let photos = [];

    // Check if the updatePhoto checkbox is selected and files were uploaded
    if (updatePhoto === 'true' && req.files && req.files.image) {
      // Handle the uploaded file
      const file = req.files.image;
      const oldPath = `${file.path}`;
      const newPath = `${file.path}.png`;
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        const newPhoto = {
          id: path.basename(newPath),
          title: file.originalname,
          fileName: newPath.replace(/public/gi, ""),
        };
        photos.push(newPhoto);
      }
    } else {
      // If updatePhoto checkbox is not selected or no files uploaded, retain the existing photos
      photos = existingPhotos;
    }

    // Update the product with the new photos
    await productHelper.updateProduct(req.params.id, {
      name: name,
      category: Category,
      price: price,
      description: description,
      photos: photos,
    });

    res.redirect("/admin");
  } catch (error) {
    // Handle any errors that occur
    console.log(error);
    res.redirect("/admin"); // Redirect to an appropriate error page or display a flash message
  }
}




// function editprodpost(req, res) {
//   const { name, Category, price, description,updatePhoto } = req.body;
//   const photos = req.files.map((file) => {
//     const oldPath = `${file.path}`;
//     const newPath = `${file.path}.png`;
//     if (fs.existsSync(oldPath)) {
//       fs.rename(oldPath, newPath, function (err) {
//         if (err) throw err;
//       });
//       return {
//         id: path.basename(newPath),
//         title: file.originalname,
//         fileName: newPath.replace(/public/gi, ""),
//       };
//     } else {
//       return null; // Return null for the file that was not uploaded
//     }
//   });

//   productHelper
//     .getProductDetails(req.params.id) // Fetch the existing product
//     .then((product) => {
//       const existingPhotos = product.photos; // Get the existing photos

//       // Replace the existing photo with the newly uploaded photo, if available
//       const updatedPhotos = photos.length > 0 ? photos : existingPhotos;

//       productHelper
//         .updateProduct(req.params.id, {

//           name: name,
//           category: Category,
//           price: price,
//           description: description,
//           photos: updatedPhotos,
          
//         })
//         .then(() => {
//           res.redirect("/admin");
//         });
//     });
// }



function loginget(req, res) {
  console.log(req.session.admin)
  if (req.session.admin) {
    res.redirect('/admin/dashboard')
  } else {

    res.render('admin/login', { "loginErr": req.session.adminLoginErr })
    req.session.adminLoginErr = false
  }
};

function loginpost(req, res) {
  adminHelper.doLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.admin = response.admin;
        req.session.admin.loggedIn = true;
        res.render('admin/dashboard', { admin: true });
      } else {
        req.session.adminLoginErr = "Invalid username or password";
        res.redirect('/admin/adminLogin');
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error logging in.");
    });
};

function logout(req, res) {
  req.session.admin = null
  req.session.destroy()
  res.redirect('/admin/adminLogin')
};

async function alluserget(req, res) {
  let users = await adminHelper.getAllUsers(req.session)
  res.render('admin/all-users', { admin: true, users })
};

function blockuser(req, res) {
  let userId = req.params.id
  adminHelper.blockUser(userId).then(() => {
    res.redirect('/admin/user-data')
  })
};

function unblock(req, res) {
  let userId = req.params.id
  adminHelper.unBlockUser(userId).then(() => {
    res.redirect('/admin/user-data')
  })
};

function hidecat(req, res) {
  let catId = req.params.id
  categoryHelper.hideCategory(catId).then(() => {
    res.redirect('/admin/view-category')
  })
};

function unhide(req, res) {
  let catId = req.params.id
  categoryHelper.unHideCategory(catId).then(() => {
    res.redirect('/admin/view-category')
  })
};

function viewcat(req, res, next) {
  categoryHelper.getAllCategory().then((category) => {
    console.log(category)
    res.render('admin/view-category', { admin: true, category });

  })

};

function addcateget(req, res) {
  res.render('admin/add-category', { catError: req.session.catError })
  req.session.catError = false;
};

async function addcatepost(req, res) {


  const {
    Category,



  } = req.body;
  console.log(req.body)
  console.log(req.files);

  const photos = req.files.map((file) => {
    const oldPath = `${file.path}`;
    const newPath = `${file.path}.png`;
    if (fs.existsSync(oldPath)) {
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
        //  console.log('file renamed')
      })
    } else {
      console.log(('not renamed'));
    }
    return {
      // id:  path.basename(newPath),
      title: file.originalname,

      fileName: newPath.replace(/public/gi, "")
      //  filepath: file.path.replace(/views/gi,"")
    };
  })
  console.log(photos)


  categoryHelper.addCategory({ category: Category, photos: photos }).then((data) => {
    if (data) {
      res.redirect('/admin/add-category')
    } else {

      req.session.catError = "category already exist"
      res.redirect('/admin/add-category')

    }

  })

};

async function editcateget(req, res) {
  let category = await categoryHelper.getCategoryDetails(req.params.id)
  // let product = await productHelper.findProCat(catId); 
  console.log(category)
  res.render('admin/edit-category', { category })
};

function editcatepost(req, res) {
  const { Category } = req.body;
  const photos = req.files.map((file) => {
    const oldPath = `${file.path}`;
    const newPath = `${file.path}.png`;
    if (fs.existsSync(oldPath)) {
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err;
      });
    } else {
    }
    return {
      id: path.basename(newPath),
      title: file.originalname,
      fileName: newPath.replace(/public/gi, ""),
      // fileName: newPath,
    };
  });
  // let caName = Name.toUpperCase();

  categoryHelper.updateCategory(req.params.id, {

    category: Category,
    photos: photos,
  })
    .then(() => {
      res.redirect("/admin/view-category");
    });
};

async function userorder(req, res) {
  let usersOrders = await adminHelper.getAllUsersOrders()
  res.render('admin/user-order', { admin: true, usersOrders })
};

async function stschange(req, res) {
  let id = req.query.id;
  let status = req.query.st
  adminHelper.cancelOrder(id, status);
  res.redirect("/admin/user-order");
};

function viewcpn(req, res) {
  let admin = req.session.admin
  couponHelper.getCoupons().then((response) => {
    res.render("admin/view-coupon", { response, admin });
  });
};

function editcpnget(req, res) {
  let id = req.params.id;
  couponHelper.getOneCoupon(id).then((coupon) => {
    res.render('admin/edit-coupon', { coupon })
  })
};

function editcpnpost(req, res) {
  let couponCode = req.body.couponCode.toUpperCase()
  let discount = parseInt(req.body.discount)
  let maxPurchase = parseInt(req.body.maxPurchase)
  let id = req.body.id

  let data = {
    couponCode: couponCode,
    expiryDate: req.body.expiryDate,
    discount: discount,
    maxPurchase: maxPurchase
  }
  couponHelper.editCoupon(id, data).then((response) => {
    res.json({ response });
  });
};

function addcpnget(req, res) {
  let admin = req.session.admin
  res.render("admin/add-coupon", { admin });
};

function addcpnpost(req, res) {
  req.body.couponCode = req.body.couponCode.toUpperCase()
  req.body.discount = parseInt(req.body.discount)
  req.body.maxPurchase = parseInt(req.body.maxPurchase)

  couponHelper.addcoupon(req.body).then((response) => {
    res.json({ response });
  })
};

function dltcpn(req, res) {
  let id = req.body.id
  console.log(req.body)
  couponHelper.deleteCoupon(id).then((response) => {
    res.json({ response })
  })
};

async function banner(req, res) {
  let banners = await adminHelper.getBanners();
  res.render('admin/banner', { admin: true, banners });
};

async function bannerget(req, res) {
  let banners = await adminHelper.getBanners();
  res.render('admin/banner', { admin: true, banners });
};

function addbannerget(req, res) {
  res.render('admin/add-banner', { admin: true })
};

function addbannerpost(req, res) {
  upload.array('Image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred during file upload
      console.log(err);
      res.redirect('/admin/addBanner');
    } else if (err) {
      // An unknown error occurred during file upload
      console.log(err);
      res.redirect('/admin/addBanner');
    } else {
      if (!req.files || req.files.length === 0) {
        // Image file is not selected
        console.log('No image selected');
        res.redirect('/admin/addBanner');
        return;
      }

      const photos = req.files.map((file) => {
        const oldPath = file.path;
        const newPath = `${file.path}.png`;
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          console.log('File renamed');
        } else {
          console.log('File not renamed');
        }
        return {
          title: file.originalname,
          fileName: newPath.replace(/public/gi, ''),
        };
      });
      try {
        const insertedId = await adminHelper.addBanner({ photos: photos });
        req.session.admin.loggedIn = true;
        res.redirect('/admin/addBanner');
      } catch (error) {
        console.log(error);
        res.redirect('/admin/addBanner');
      }
    }
  });
};

function dltbanner(req, res) {
  let bannerId = req.params.id;
  adminHelper.deleteBanner(bannerId).then((response) => {
    res.redirect('/admin/banner');
  });
};

async function offerget(req, res) {
  let category = await categoryHelper.getAllCategory()
  //  adminHelper.getOffer()
  res.render('admin/offer', { admin: true, category })
};

//  function addofferget(req,res) {
//   res.render('admin/offer',{admin:true})
// };

function addOfferpost(req, res) {
  try {
    const catName = req.params.id;
    const offerPer = req.body.offerPercentage;
    productHelper.findProCat(catName, offerPer);
    res.redirect('/admin/offer');
  } catch (error) {
    console.error(error);
    res.redirect('/admin/error');
  }
};

function error(req, res) {
  res.render('admin/error')
}


// sales report start ///
  async function salesReport (req, res)  {
  filter = req.query.range;
  let latestorder = await adminHelper.getAllLatestOrders();
  let latestuser = await adminHelper.getAllLatestUsers();
  let totaluser = await adminHelper.totalUser();
  let totalproduct = await adminHelper.totalProduct();
  let totalAmount = await adminHelper.totalAmount();
  let monthlydata = await adminHelper.getSellingProductInEachMonth();
  let paymentCounts = await adminHelper.paymentMethodCount()
  let sales
  let range
  if (filter == "week") {
    sales = await adminHelper.orderLastWeek()
    // date formate //
    sales.forEach((sale) => {
      const dateParts = sale.date.toISOString().substring(0, 10).split("-");
      sale.date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    });
    // date formate //
    range = "Week"
  } else if (filter == "month") {
    sales = await adminHelper.orderLastMonth()
    // date formate //
    sales.forEach((sale) => {
      const dateParts = sale.date.toISOString().substring(0, 10).split("-");
      sale.date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    });
    // date formate //
    range = "Month"
  } else {
    sales = await adminHelper.orderLastYear()
    // date formate //
    sales.forEach((sale) => {
      const dateParts = sale.date.toISOString().substring(0, 10).split("-");
      sale.date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    });
    // date formate //
    range = "Year"
  }
  res.render("admin/sales-report", {
    admin: true,
    latestorder,
    latestuser,
    totaluser,
    totalproduct,
    totalAmount,
    monthlydata,
    paymentCounts,
    sales,
    range
  });
}




  async function salesReports (req, res)  {

  let sales = await adminHelper.orderLastWeek()
  sales.forEach((sale) => {
    const dateParts = sale.date.toISOString().substring(0, 10).split("-");
    sale.date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  });
  res.render('admin/sales-report', { sales, admin: true })
}

async function dateFilterPost(req, res) {
  let startDate = req.body.startDate
  let endDate = req.body.endDate
  startDate = new Date(startDate);
  endDate = new Date(endDate)


  let sales = await adminHelper.orderInDate(startDate, endDate)
  // date formate //
  sales.forEach((sale) => {
    const dateParts = sale.date.toISOString().substring(0, 10).split("-");
    sale.date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  });
  // date formate //

  res.render("admin/sales-report", { admin: true, sales });
}


// sales report end//


module.exports = {
  viewprodget, viewprodpost, dashboardget, dwnldpost, addprodget, addprodpost, dltprodget,
  editprodget, editprodpost, loginget, loginpost, logout, alluserget, blockuser, unblock,
  hidecat, unhide, viewcat, addcateget, addcatepost, editcateget, editcatepost, userorder,
  stschange, viewcpn, editcpnget, editcpnpost, addcpnget, addcpnpost, dltcpn, banner, bannerget,
  addbannerget, addbannerpost, dltbanner, offerget, addOfferpost, error,salesReport,salesReports,
  dateFilterPost,
}