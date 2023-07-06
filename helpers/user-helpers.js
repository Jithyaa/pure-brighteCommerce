var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt');
const alert = require('alert')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
var instance = new Razorpay({
  key_id: 'rzp_test_tTpovSbQmrfVAw',
  key_secret: 'rMF7UcJRtbYLK3V5Zp30WUNd',
});
// const nodemailer = require('nodemailer');
const { response } = require('../app');
const { resolve } = require('path');
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      if (!userData.password || userData.password.trim() === '') {
        reject(new Error('Password field is required'));
        return;
      }

      try {
        userData.password = await bcrypt.hash(userData.password, 10);
        const data = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
        resolve(data);
      } catch (err) {
        reject(err);
      }

    });
  },
  //  doSignup: (userData) => {
  //       return new Promise(async (resolve, reject) => {

  //         let userExist = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
  //         console.log(userExist);
  //         if(!userExist){
  //         if (!userData.Password || userData.Password.trim() === '') {
  //           reject(new Error('Password field is required'));
  //           return;
  //         }

  //         try {
  //           userData.Password = await bcrypt.hash(userData.Password, 10);
  //           const data = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);
  //           resolve(data);
  //         } catch (err) {
  //           reject(err);
  //         }}else{
  //          resolve(1)
  //         }
  //       });
  //     },



  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {}
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })

      if (user) {
        if (!user.isBlocked) {
          bcrypt.compare(userData.Password, user.password).then((status) => {
            if (status) {
              console.log("login success")
              response.user = user
              response.status = true
              resolve(response)

            } else {
              console.log("login failed")
              resolve({ status: false })
            }


          })

        } else {
          console.log("you are blocked")
          resolve(1)
        }
      } else {
        console.log("login failed 2")
        resolve({ status: false })
      }

    });

  },

  doMailVarify: (userEmail) => {

    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ Email: userEmail }, { $set: { isBlocked: true } }, (err, result) => {
        if (err) {
          console.log("error :" + err)
          res.status(500).send("Error blocking")
        } else {

          resolve()
        }
      })
    })

  },

  doMailVarifySuccess: (userOtp) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ otp: userOtp.otp }, { $set: { isBlocked: false } }, (err, result) => {
        if (err) {
          console.log("error :" + err)
          res.status(500).send("Error blocking")
        } else {
          console.log('User Blocked')
          resolve("success")
          alert("Account successfully created")
        }
      })
    })

  },

  doMailCheck: (userOtp) => {

    return new Promise(async (resolve, reject) => {
      let response = {}
      let getOtp = await db.get().collection(collection.USER_COLLECTION).findOne({ otp: userOtp.otp })

      if (getOtp) {

        response.status = true
        resolve(response)
      }
      else {
        response.status = false
        resolve(response)
      }
    })

  },

  insertOtp: (userData, userotp) => {

    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ Email: userData.Email }, { $set: { otp: userotp } }, (err, result) => {
        if (err) {
          console.log("error :" + err)
          res.status(500).send("Error blocking")
        } else {
          console.log("otp successfully created")
          resolve("success")
        }
      })
    })
  },



  AllProductsPagination: (val) => {
    return new Promise(async (resolve, reject) => {
      console.log(val)
      let products = await db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .skip((val - 1) * 3)
        .limit(3)
        .toArray()
      resolve(products)
    })
  },

// cart// 

  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let pro=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
      proObj.itemName=pro.name
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
    // return new Promise(async (resolve, reject) => {
    //   let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
      if (userCart) {
        let proExist = userCart.products.findIndex(product => product.item == proId)
        console.log(proExist);
        if (proExist != -1) {
          db.get().collection(collection.CART_COLLECTION)
            .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
              {
                $inc: { 'products.$.quantity': 1 }
              }
            ).then(() => {
              resolve()
            })
        } else {
          db.get().collection(collection.CART_COLLECTION)
            .updateOne({ user: objectId(userId) },
              {

                $push: { products: proObj }

              }
            ).then((response) => {
              resolve()
            })
        }

      } else {
        let cartObj = {
          user: objectId(userId),
          products: [proObj]
        }
        db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
          resolve()
        })
      }
    })
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
        {
          $match: { user: objectId(userId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity',
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
          }
        }

      ]).toArray()

      resolve(cartItems)
    })
  },
  getUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
      resolve(user)
    })
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
      if (cart) {
        count = cart.products.length
      }
      resolve(count)
    })
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity)
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
          {
            $pull: { products: { item: objectId(details.product) } }
          }
        ).then((response) => {
          resolve({ removeProduct: true })
        })
      } else {
        db.get().collection(collection.CART_COLLECTION)
          .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
            {
              $inc: { 'products.$.quantity': details.count }
            }
          ).then((response) => {

            resolve({ status: true })
          })
      }
    })
  },
  removeFromCart: (details) => {
    details.quantity = parseInt(details.quantity)

    return new Promise((resolve, reject) => {
      db.get().collection(collection.CART_COLLECTION)
        .updateOne({ _id: objectId(details.cart) },
          {
            $pull: { products: { item: objectId(details.product) } }
          }
        ).then((response) => {
          resolve(true)
        })
    })
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
          // aggregation pipeline stages

          {
            $match: { user: objectId(userId) }
          },
          {
            $unwind: '$products'
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'item',
              foreignField: '_id',
              as: 'product'
            }
          },
          {
            $project: {
              item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
            }
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: {
                $mergeObjects: [
                  '$product',
                  { price: { $toInt: '$product.offerPrice' } }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$quantity', '$product.offerPrice'] } }
            }
          }
        ]).toArray();

        if (total.length > 0 && total[0].total) {
          resolve(total[0].total);
        } else {
          resolve(0); // or any default value you want to set
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(order, products, total);
      let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          address: order.address,
          phone: order.phone,
          pin: order.pin,
          couponDiscount:order.couponAmount,
          walletDiscount:order.walletAmount
        },
        userId: objectId(order.userId),
        paymentMethod: order['payment-method'],
        products: products,
        totalAmount: total,
        status: status,
        // date : moment(new Date())
        date: new Date()

      }
      db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
        db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
        // console.log("order id:",response.ops[0]._id)
        resolve(response.insertedId)
      })

    })

  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
      resolve(cart.products)
    })
  },
  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let orders = await db.get().collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .sort({ _id: -1 }) // Sort by '_id' field in descending order
        .toArray();
      console.log(orders);
      resolve(orders);
    });
  },
  
  getUserOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      console.log(userId);
      let orders = await db.get()
        .collection(collection.ORDER_COLLECTION)
        .find({ userId: objectId(userId) })
        .sort({ createdAt: -1 })
        .toArray(); // Find all orders for the user and sort them by createdAt in descending order
  
      console.log(orders);
      resolve(orders); // Return the array of orders
    });
  },
  
  
  
  
  
  



  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: { _id: objectId(orderId) }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ['$product', 0] }

          }
        }


      ]).toArray()
      resolve(orderItems)
    })
  },
  cancelOrder: (orderId, status) => {
    new Promise(async (resolve, reject) => {
      await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { 'status': status } })
      resolve()
    })
  },


  userAddresses: (userId) => {
    return new Promise(async (resolve, reject) => {
      let existAddress = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
      resolve(existAddress)
    })
  },
  addNewAddress: (userId, address) => {
    return new Promise(async (resolve, reject) => {
      const userAddressCollection = db.get().collection(collection.USER_ADDRESS_COLLECTION);
      const userAddress = {
        userId: userId,
        address: address
      };
      await userAddressCollection.insertOne(userAddress)
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });

    })
  },
  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      const addresses = await db.get().collection(collection.USER_ADDRESS_COLLECTION).find({ userId: userId }).toArray();

      if (addresses) {
        resolve(addresses)
      } else {
        resolve('empty')
      }
    })
  },
  getOneAddress: (id) => {
    return new Promise(async (resolve, reject) => {
      const address = await db.get().collection(collection.USER_ADDRESS_COLLECTION).findOne({ _id: objectId(id) })

      if (address) {
        resolve(address)
      } else {
        resolve('empty')
      }
    })
  },
  editAddress: (Id, address) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.USER_ADDRESS_COLLECTION).updateOne(
          { _id: objectId(Id) },
          {
            $set: {
              address
            }
          },
          { upsert: false }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.USER_ADDRESS_COLLECTION).deleteOne({ _id: objectId(userId) }).then((response) => {
        resolve({ removeAddress: true })
      })
    })
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log("New order :", order);
          resolve(order)
        }
      });

    })
  },
  verifyPayment: (details, order) => {
    return new Promise((resolve, reject) => {
      const crypto = require('crypto');
      let hmac = crypto.createHmac('sha256', 'rMF7UcJRtbYLK3V5Zp30WUNd')
      hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
      hmac = hmac.digest('hex')
      if (hmac == details['payment[razorpay_signature]']) {
        resolve()
      } else {
        reject()
      }

    })
  },
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
        {
          $set: {
            status: 'placed'
          }
        }
      ).then(() => {
        resolve()
      })
    })
  },
  //online payment end//



  // wishlist start //
addToWishlist: (prodId, userId) => {
  let prooObj = {
    item: objectId(prodId),
   
  }
  return new Promise(async (resolve, reject) => {
    let pro=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)})
    
    prooObj.itemName=pro.name
    prooObj.itemPrice=pro.price
    prooObj.itemphotos=pro.photos

    let userWishlist = await db
      .get()
      .collection(collection.WISHLIST_COLLECTION)
      .findOne({ user: objectId(userId) });
      if (userWishlist) {
         db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:objectId(userId)},
        {

            $addToSet:{products:prooObj}

        }
        ).then((response)=>{
          resolve()
        })
       
      } else {
        let cartObj = {
          user: objectId(userId),
          products: [prooObj],
        };
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
        }
      })
    },

    getWishlistProducts: (userId) => {
      return new Promise(async (resolve, reject) => {
        let wishlistItems = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .findOne({user:objectId(userId)})
          console.log(wishlistItems);
         resolve(wishlistItems);
      });
    },

removeFromwishlist:(details)=>{
 console.log(details); 
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.WISHLIST_COLLECTION)
    .updateOne({_id:objectId(details.id)},
    {
      $pull:{products:{item:objectId(details.product)}}
    }
    ).then((response)=>{
      resolve(true)
    })
  })
},
// wishlist end //


  //coupon management //
  addCouponUser: (userId, coupon) => {
    return new Promise(async (resolve, reject) => {
      let coupons = await db.get().collection(collection.USER_COLLECTION)
        .aggregate([
          { $match: { _id: objectId(userId) } },
          { $unwind: "$couponCodes" },
          { $match: { "couponCodes.coupon": coupon } },
        ]).toArray();
      console.log(coupons.length);
      if (coupons.length) {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId), "couponCodes.coupon": coupon },
            { $inc: { "couponCodes.$.count": 1 } }
          );
      } else {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId) },
            { $push: { couponCodes: { coupon, count: 1 } } }
          )
          .then(() => {
            resolve();
          });
      }
    });
  },

  deleteCoupon: (userId, usedCoupon) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userCollection = db.get().collection(collection.USER_COLLECTION);
        const user = await userCollection.findOne({ _id: objectId(userId) });
        const couponCodes = user.couponCodes;

        // Find the index of the first occurrence of the coupon code
        const index = couponCodes.indexOf(usedCoupon);

        // Remove the coupon code from the array at the specified index
        if (index > -1) {
          couponCodes.splice(index, 1);
        }

        // Update the user document with the modified couponCodes array
        await userCollection.updateOne(
          { _id: objectId(userId) },
          { $set: { couponCodes: couponCodes } }
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  // coupon management end //

  totalUser: () => {
    return new Promise(async (resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).countDocuments({}, (err, count) => {
        if (err) {
          reject(err);
        }
        // Access the total count of products
        resolve(count);
      });

    })
  },
  cancelOrder: (orderId, status) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne({ _id: objectId(orderId) }, { $set: { status: status } });
      resolve();
    });
  },

  addAmountWallet: (amount, userId) => {
    db.get()
      .collection(collection.USER_COLLECTION)
      .updateOne({ _id: objectId(userId) }, { $inc: { walletAmount: amount } });
  },
  deductAmountWallet: (amount, userId) => {
    db.get()
      .collection(collection.USER_COLLECTION)
      .updateOne({ _id: objectId(userId) }, { $set: { walletAmount: amount } });
  },
  addRefWallet: (refCode) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.USER_COLLECTION).updateOne(
        { referralCode: refCode },
        { $inc: { wallet: 100 } }, // Increment the wallet field by 100
        (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );
    });
  },
  
  getOrder: (id) => {
    return new Promise(async (resolve) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(id) });
      resolve(order);
    });
  },
  getBanners: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray();
        
        resolve(banners);
        console.log(banners);
      } catch (error) {
        reject(error);
      }
    });
  },
}



