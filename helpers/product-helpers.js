var db=require('../config/connection')
var collection=require('../config/collections')

var objectId=require('mongodb').ObjectId
// const { Logger } = require('mongodb')
module.exports={
    // addProduct:(product,callback)=>{
    //     // console.log(product);
    //     db.get().collection('product').insertOne(product).then((data)=>{
           
    //         callback(data.insertedId)

    //     })
    // },

    addProduct: (product, callback) => {
        db.get()
          .collection("product")
          .insertOne(product)
          .then((data) => {
            console.log("this is the id :" + data.insertedId);
            callback(data.insertedId);
    });
    },
          getProductDetails:(proId)=>{
            return new Promise((resolve,reject)=>{
              db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
              })
            })
          },
          updateProduct:((proId,proDetails)=>{
            return new Promise((resolve,reject)=>{
              db.get().collection(collection.PRODUCT_COLLECTION)
              .updateOne({_id:objectId(proId)},{
  
                 $set:{
                  // No:proDetails.No,
                  name:proDetails.name,
                  description:proDetails.description,
                  category:proDetails.category,
                  price:proDetails.price,
                  photos:proDetails.photos
                 }
  
              }).then((response)=>{
                resolve()
              })
            })
          }),

    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            
        })

    },
    
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
                // console.log(response);
                resolve(response)
            })
        })
    },
//    getProductDetails:(proId)=>{
//     return new Promise((resolve,reject)=>{
//         db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
//             resolve(product)
//         })
//     })
//    },
  //  updateProduct:(proId,proDetails)=>{
  //   return new Promise((resolve,reject)=>{
  //       db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
  //           $set:{
  //               name:proDetails.name,
  //               description:proDetails.description,
  //               price:proDetails.price,
  //               category:proDetails.category,
  //               photos:proDetails.photos
  //           }
  //       }).then((response)=>{
  //           resolve()
  //       })
  //   })
  //  },
   getLatestProducts:()=>{
    return new Promise(async(resolve,reject)=>{
        let ltstProducts = await db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .sort({_id: -1})  //Sort by _id field in descending order
        .limit(6)   // Limit the result to 8 documents
        .toArray();
        resolve(ltstProducts) 
    })
},
getAllProductsPagination:(val)=>{
    return new Promise(async(resolve,reject)=>{
      console.log(val)
      let products = await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .find()
      .skip((val - 1)*6)
      .limit(6)
      .toArray()
      resolve(products)
    })
  },
  searchProducts:(search)=>{
    return new Promise(async (resolve,reject)=>{
      let products = await db.get().collection(collection.PRODUCT_COLLECTION)
      .find(   {$or: [
        { category: { $regex: new RegExp('^' + search + '.*', 'i') } },
        { name: { $regex: new RegExp('^' + search + '.*', 'i') } },
        { price: { $regex: new RegExp('^' + search + '.*', 'i') } },
        // Add more fields as needed
      ]})
      .toArray()
      if(products.length){
        resolve(products)
        console.log(products)
      } else {
        let sErr = "No such item found" 
        reject(sErr)
      }
     
 })
},
findProCat: async (catName, offerPer) => {
  try {
    const products = await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .find({ category: catName })
      .toArray();

    const updatedProducts = products.map((product) => {
      // const offerPrice = product.price - (product.price * offerPer) / 100;
      const offerPrice = Math.round(product.price - (product.price * offerPer) / 100)
      return { ...product, offerPrice };
    });

    // Update the documents in the collection with the new offer prices
    await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .updateMany(
        { category: catName },
        { $set: { offerPrice: 0 } } // Initial value of offerPrice field
      );

    // Bulk write operation to update offerPrice for each product
    const bulkWriteOperations = updatedProducts.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { offerPrice: product.offerPrice } },
      },
    }));

    await db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .bulkWrite(bulkWriteOperations);

    return updatedProducts;
  } catch (error) {
    throw error;
  }
},

// findProduct: async(catename)=>{
//   try {
//     const product= await db.get()
//     .collection(collection.PRODUCT_COLLECTION)
//     .find({product:catename})
//   }

// }

getProduct: (catId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.PRODUCT_COLLECTION)
      .find({ categoryId: objectId(catId) })
      .toArray()
      .then((products) => {
        resolve(products);
      })
      .catch((error) => {
        reject(error);
      });
  });
},

  
  
}