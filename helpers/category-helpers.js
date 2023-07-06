var db = require('../config/connection')
var collection = require('../config/collections')

var objectId = require('mongodb').ObjectId
// const { Logger } = require('mongodb')
module.exports = {
    // addCategory: (category, callback) => {
    //     // console.log(product);
    //     db.get().collection('category').insertOne(category).then((data) => {

    //         callback(data.insertedId)

    //     })
    // },

    addCategory:(category)=>{
        return new Promise(async (resolve,reject)=>{
            let catExist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({Category:category.category})
         
            if(!catExist){

                let data = await db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category)
                console.log(data.Category)
                resolve(data);
                
            } else {
                let data = false
                resolve(data)
            }
        })
  
    },

    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)

        })

    },
   
    getCategoryDetails: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) }).then((category) => {
                resolve(category)
            })
        })
    },
    updateCategory: (catId, catDetails) => {
        return new Promise(async (resolve, reject) => {
            let catExist = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ Category: catDetails.Category })
            if (!catExist) {

                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, {
                    $set: {
                        Category: catDetails.Category,
                        photos: catDetails.photos,
                        // offer: catDetails.offer
                        // category:proDetails.category
                    }
                }).then((response) => {
                    resolve(response)
                })
            } else {
                let response = false;
                resolve(response)
            }

        })
    },
    hideCategory: (catId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, { $set: { isHide: true } }, (err, res) => {
                if (err) {
                    console.log("error :" + err)
                    res.status(500).send("Error blocking")
                } else {
                    console.log('Ctegory Hide')
                    resolve("success")
                }
            })
        })
    },
    unHideCategory: (catId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) }, { $set: { isHide: false } }, (err, res) => {
                if (err) {
                    console.log("error :" + err)
                    res.status(500).send("Error blocking")
                } else {
                    console.log('Category Unhide')
                    resolve("success")
                }
            })
        })
    },



}