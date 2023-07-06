var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt');
const objectId = require('mongodb').ObjectId
const { ObjectId } = require('mongodb')
const moment=require('moment')
const { use } = require('../routes/admin')
module.exports = {
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {}
      let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email })
      if (admin) {
        bcrypt.compare(adminData.Password, admin.Password).then((status) => {
          if (status) {
            console.log("login success")
            response.admin = admin
            response.status = true
            resolve(response)

          } else {
            console.log("login failed")
            resolve({ status: false })
          }


        })

      } else {
        console.log("login failed")
        resolve({ status: false })
      }
    })
  },
  getAllUsers: (user) => {
    return new Promise(async (resolve, reject) => {
      let users = await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
      resolve(users)
    })
  },
  blockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { isBlocked: true } }, (err, res) => {
        if (err) {
          console.log("error :" + err)
          res.status(500).send("Error blocking")
        } else {
          console.log('User Blocked')
          resolve("success")
        }
      })
    })
  },
  unBlockUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { isBlocked: false } }, (err, res) => {
        if (err) {
          console.log("error :" + err)
          res.status(500).send("Error blocking")
        } else {
          console.log('User Unblocked')
          resolve("success")
        }
      })
    })
  },
  getAllUsersOrders: () => {
    return new Promise(async (resolve, reject) => {
      let usersOrders = await db.get().collection(collection.ORDER_COLLECTION)
        .find({})
        .sort({ _id: -1 }) // Sort by _id in descending order (newest first)
        .toArray();
  
      resolve(usersOrders);
    });
  },
  
  delivered: async (orderId) => {
    await new Promise(async (resolve, reject) => {
      await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, { $set: { 'status': 'Delivered' } })
    })
    resolve()
  },
  cancelOrder: (orderId, status) => {
    new Promise(async (resolve, reject) => {
      await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, { $set: { 'status': status } })
      resolve()
    })
  },
  getAllLatestOrders: () => {
    return new Promise(async (resolve, reject) => {
      let usersOrders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find({})
        .sort({ _id: -1 }) // Sort by descending order of _id (assuming _id represents the order creation timestamp)
        .limit(5) // Limit the result to 5 documents
        .toArray();
  
      resolve(usersOrders);
    });
  },

  getAllLatestUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({})
        .sort({ _id: -1 }) // Sort by descending order of _id (assuming _id represents the user creation timestamp)
        .limit(5) // Limit the result to 5 documents
        .toArray();
  
      resolve(users);
    });
  },

  totalUser:()=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collection.USER_COLLECTION).countDocuments({}, (err, count) => {
        if (err) {
          reject(err);
        }
        // Access the total count of products
        resolve(count);
      });
      
    })
  },

  totalProduct:()=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).countDocuments({}, (err, count) => {
        if (err) {
          reject(err);
        }
        // Access the total count of products
        resolve(count);
      });
      
    })
  },

  totalAmount:()=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 }
          }
        }
      ]).toArray((err, result) => {
        if (err) {
          reject(err);
        }
        // Access the total amount and total orders from the result
        const totalAmount = result[0].totalAmount;
        const totalOrders = result[0].totalOrders;
        resolve({ totalAmount, totalOrders });
      });
    
})
},
// getSellingProductInEachMonth:()=>{
//   return new Promise(async(resolve,reject)=>{
//   await db.get().collection(collection.ORDER_COLLECTION).aggregate([
//     {
//       $group: {
//         _id: { $month: { $toDate: "$date" } },
//         totalAmount: { $sum: "$totalAmount" }
//       }
//     }
//   ]).toArray((err, result) => {
//     if (err) {
//       // Handle the error
//       console.error(err);
//       return;
//     }

//     resolve(result)

//   });
//   })
// }

getSellingProductInEachMonth: () => {
return new Promise(async (resolve, reject) => {
await db.get().collection(collection.ORDER_COLLECTION).aggregate([
  {
    $group: {
      _id: { $month: { $toDate: "$date" } },
      totalAmount: { $sum: "$totalAmount" }
    }
  },
  {
    $sort: { "_id":1}
  }
]).toArray((err, result) => {
  if (err) {
    console.error(err);
    reject(err);
    return;
  }

  const totalAmounts = result.map(item => item.totalAmount);
  resolve(totalAmounts);
});
});
},
getAmountLastSevenDay: () => {
  return new Promise(async (resolve, reject) => {
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();

    try {
      const totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            date: {
              $gte: sevenDaysAgo
            }
          }
        },
        {
          $group: {
            _id: null,
            totalPrize: {
              $sum: "$totalAmount"
            }
          }
        }
      ]).toArray();
      console.log(totalPrize);
      

      if (totalPrize.length > 0) {
        resolve(totalPrize[0].totalPrize);
      } else {
        resolve(0); // No orders found in the last seven days
      }
    } catch (error) {
      reject(error);
    }
  });
},

getAmountLastMonth: () => {
  return new Promise(async (resolve, reject) => {
    const sevenDaysAgo = moment().subtract(30, 'days').toDate();

    let totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPrize: {
            $sum: "$totalAmount"
          }
        }
      }
    ]).toArray();
    console.log(totalPrize)
    resolve(totalPrize[0].totalPrize);
  });
},
getAmountLastYear: () => {
  return new Promise(async (resolve, reject) => {
    const sevenDaysAgo = moment().subtract(360, 'days').toDate();

    let totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPrize: {
            $sum: "$totalAmount"
          }
        }
      }
    ]).toArray();
    console.log(totalPrize)
    resolve(totalPrize[0].totalPrize);
  });
},
getTotalProductQuantityLastSevenDays:() => {
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(7, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: { $sum: "$products.quantity" } }
          }
        }
      ]).toArray();

      // Extract the total quantity from the result
      const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;
      console.log(totalQuantity)
      console.log('totalQuantity')
      resolve(totalQuantity);
    } catch (error) {
      reject(error);
    }
  });
},
getTotalProductQuantityLastMonth:() => {
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: { $sum: "$products.quantity" } }
          }
        }
      ]).toArray();

      // Extract the total quantity from the result
      const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;
      console.log(totalQuantity)
      console.log('totalQuantity')
      resolve(totalQuantity);
    } catch (error) {
      reject(error);
    }
  });
},
getTotalProductQuantityLastYear:() => {
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(360, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: { $sum: "$products.quantity" } }
          }
        }
      ]).toArray();

      // Extract the total quantity from the result
      const totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;
      console.log(totalQuantity)
      
      resolve(totalQuantity);
    } catch (error) {
      reject(error);
    }
  });
},

getOrderLastSevenDay:()=>{
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(7, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
       date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      console.log(orderCount)
      console.log('orderCount')
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });
},
getOrderLastMonth:()=>{
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      console.log(orderCount)
      console.log('orderCount')
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });
},
getOrderLastYear:()=>{
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(360, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
      console.log(orderCount)
      console.log('orderCount')
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });

},
getUserInLastSevenDay:()=>{
  return new Promise(async(resolve,reject)=>{
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();
    db.get().collection(collection.USER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]).toArray()
      .then((result) => {
        const userCount = result.length > 0 ? result[0].count : 0;
       
        resolve(userCount)
      })
      .catch((error) => {
        console.log('Error:', error);
      });
  })
},
getUserInLastMonth:()=>{
  return new Promise(async(resolve,reject)=>{
    const sevenDaysAgo = moment().subtract(30, 'days').toDate();
    db.get().collection(collection.USER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]).toArray()
      .then((result) => {
        const userCount = result.length > 0 ? result[0].count : 0;
       
        resolve(userCount)
      })
      .catch((error) => {
        console.log('Error:', error);
      });
  })
},
getUserInLastYear:()=>{
  return new Promise(async(resolve,reject)=>{
    const sevenDaysAgo = moment().subtract(360, 'days').toDate();
    db.get().collection(collection.USER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]).toArray()
      .then((result) => {
        const userCount = result.length > 0 ? result[0].count : 0;
       
        resolve(userCount)
      })
      .catch((error) => {
        console.log('Error:', error);
      });
  })
},
totalAmount:()=>{
  return new Promise(async(resolve,reject)=>{
    db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 }
        }
      }
    ]).toArray((err, result) => {
      if (err) {
        reject(err);
      }
      // Access the total amount and total orders from the result
      const totalAmount = result[0].totalAmount;
      const totalOrders = result[0].totalOrders;
      resolve({ totalAmount, totalOrders });
    });
    
})
},

  addBanner: (banner) => {
        return new Promise(async (resolve, reject) => {
          try {
            let data = await db.get().collection(collection.BANNER_COLLECTION).insertOne(banner);
            resolve(data.insertedId.toString());
          } catch (error) {
            reject(error);
          }
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

        deleteBanner: (bannerId) => {
          return new Promise((resolve, reject) => {
            db.get()
              .collection(collection.BANNER_COLLECTION)
              .deleteOne({ _id: ObjectId(bannerId) })
              .then((response) => {
                resolve(response);
              });
          })
        },

        addOffer: (offer) => {
          return new Promise((resolve) => {
            db.get()
              .collection(collection.PRODUCT_COLLECTION)
              .insertOne({ offer })
              .then((response) => {
                resolve(response);
              });
          });
        },


        paymentMethodCount: () => {
          return new Promise(async (resolve, reject) => {
            try {
              const codCount = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .countDocuments({ paymentMethod: "COD" });
        
              const onlineCount = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .countDocuments({ paymentMethod: "ONLINE" });
        
              resolve({ codCount, onlineCount });
            } catch (error) {
              reject(error);
            }
          });
        },
        
        // getItemCategoryCounts:()=> {
        //   return new Promise (async(resolve,reject)=>{
        //   try {
        //     const categoryCounts = await db
        //       .get()
        //       .collection(collection.ORDER_COLLECTION)
        //       .aggregate([
        //         { $unwind: "$products" },
        //         { $match: { "products.itemCategory": { $ne: null } } },
        //         { $group: { _id: "$products.itemCategory", count: { $sum: "$products.quantity" } } }
        //       ])
        //       .toArray();
        //     console.log(categoryCounts,"hhjhjj")
        //     return categoryCounts;
        //   } catch (error) {
        //     console.error('Error fetching item category counts:', error);
        //     throw error;
        //   }
        // })
        // },


        // sales report start //

getAmountLastSevenDay: () => {
  return new Promise(async (resolve, reject) => {
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();

    try {
      const totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $match: {
            date: {
              $gte: sevenDaysAgo
            },
            status:"Delivered"

          }
        },
        {
          $group: {
            _id: null,
            totalPrize: {
              $sum: "$totalAmount"
            }
          }
        }
      ]).toArray();
      console.log(totalPrize);
      

      if (totalPrize.length > 0) {
        resolve(totalPrize[0].totalPrize);
      } else {
        resolve(0); // No orders found in the last seven days
      }
    } catch (error) {
      reject(error);
    }
  });
},

getAmountLastMonth: () => {
  return new Promise(async (resolve, reject) => {
    const sevenDaysAgo = moment().subtract(30, 'days').toDate();

    let totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          },
          status:"Delivered"

        }
      },
      {
        $group: {
          _id: null,
          totalPrize: {
            $sum: "$totalAmount"
          }
        }
      }
    ]).toArray();
    console.log(totalPrize)
    resolve(totalPrize[0].totalPrize);
  });
},
getAmountLastYear: () => {
  return new Promise(async (resolve, reject) => {
    const sevenDaysAgo = moment().subtract(360, 'days').toDate();

    let totalPrize = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          },
          status:"Delivered"
        }
      },
      {
        $group: {
          _id: null,
          totalPrize: {
            $sum: "$totalAmount"
          }
        }
      }
    ]).toArray();
    console.log(totalPrize)
    resolve(totalPrize[0].totalPrize);
  });
},
getTotalProductQuantityLastSevenDays: () => {
  return new Promise(async (resolve, reject) => {
    const sevenDaysAgo = moment().subtract(7, "days").toDate();
    try {
      const result = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: {
              Date: {
                $gte: sevenDaysAgo
              },
              status:"Delivered"
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ]).toArray()

      // Extract the total quantity from the result
      const totalQuantity = result.length > 0 ? result[0].count : 0;
      resolve(totalQuantity);
    } catch (error) {
      reject(error);
    }
  });
},
getTotalProductQuantityLastMonth: () => {
  return new Promise(async (resolve, reject) => {
    const month = moment().subtract(30, "days").startOf("day").toDate();
    try {
      const result = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: {
              Date: {
                $gte: month
              },
              status:"Delivered"
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ]).toArray()

      // Extract the total quantity from the result
      const totalQuantity = result.length > 0 ? result[0].count : 0;

      resolve(totalQuantity);
    } catch (error) {
      reject(error);
    }
  });
},
getTotalProductQuantityLastYear: () => {
  return new Promise(async (resolve, reject) => {
    const year = moment().subtract(360, "days").startOf("day").toDate();

    try {
      const result = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: {
              Date: {
                $gte: year
              },
              status:"Delivered"
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ]).toArray()

      // Extract the total quantity from the result
      const totalQuantity = result.length > 0 ? result[0].count : 0;
      console.log(totalQuantity);

      resolve(totalQuantity);
    } catch (error) {
      reject(error);
    }
  });
},

getOrderLastSevenDay:()=>{
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(7, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
       date: {
          $gte: startDate,
          $lte: endDate
        },
        status:"Delivered"
      });
      console.log(orderCount)
      console.log('orderCount')
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });
},
getOrderLastMonth:()=>{
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(30, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        date: {
          $gte: startDate,
          $lte: endDate,
          
        },
        status:"Delivered"
      });
      console.log(orderCount)
      console.log('orderCount')
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });
},
getOrderLastYear:()=>{
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(360, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    try {
      const orderCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        date: {
          $gte: startDate,
          $lte: endDate,
          
        },
        status:"Delivered"
      });
      console.log(orderCount)
      console.log('orderCount')
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });

},
getUserInLastSevenDay:()=>{
  return new Promise(async(resolve,reject)=>{
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();
    db.get().collection(collection.USER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          }
        
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]).toArray()
      .then((result) => {
        const userCount = result.length > 0 ? result[0].count : 0;
       
        resolve(userCount)
      })
      .catch((error) => {
        console.log('Error:', error);
      });
  })
},
getUserInLastMonth:()=>{
  return new Promise(async(resolve,reject)=>{
    const sevenDaysAgo = moment().subtract(30, 'days').toDate();
    db.get().collection(collection.USER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          }
          
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]).toArray()
      .then((result) => {
        const userCount = result.length > 0 ? result[0].count : 0;
       
        resolve(userCount)
      })
      .catch((error) => {
        console.log('Error:', error);
      });
  })
},
getUserInLastYear:()=>{
  return new Promise(async(resolve,reject)=>{
    const sevenDaysAgo = moment().subtract(360, 'days').toDate();
    db.get().collection(collection.USER_COLLECTION).aggregate([
      {
        $match: {
          date: {
            $gte: sevenDaysAgo
          },

        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]).toArray()
      .then((result) => {
        const userCount = result.length > 0 ? result[0].count : 0;
       
        resolve(userCount)
      })
      .catch((error) => {
        console.log('Error:', error);
      });
  })
},
totalAmount:()=>{
  return new Promise(async(resolve,reject)=>{
    db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 }
        }
      }
    ]).toArray((err, result) => {
      if (err) {
        reject(err);
      }
      // Access the total amount and total orders from the result
      const totalAmount = result[0].totalAmount;
      const totalOrders = result[0].totalOrders;
      resolve({ totalAmount, totalOrders });
    });
    
})
},
orderLastWeek: () => {
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(7, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    try {
      const orderCount = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: "Delivered",
              date: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
        ]).toArray();
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });
},
orderLastMonth:() => {
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(30, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    try {
      const orderCount = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
        
          {
            $match: {
              status: "Delivered",
              date: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
        ]).toArray();
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });
},
orderLastYear:() => {
  return new Promise(async (resolve, reject) => {
    const startDate = moment().subtract(365, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    try {
      const orderCount = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
       
          {
            $match: {
             status: "Delivered",
              date: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
        ]).toArray();
      resolve(orderCount);
    } catch (error) {
      reject(error);
    }
  });
},

// date filter
orderInDate:(startDate,endDate) => {
    
  return new Promise(async (resolve, reject) => {
    try {
      const orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: "Delivered",
              date: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
        ]).toArray();
      resolve(orders);
    } catch (error) {
      reject(error);
    }
  })
}
// sales report end //
        
}