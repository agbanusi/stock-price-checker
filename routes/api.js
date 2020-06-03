/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';
var https =require('https')
var expect = require('chai').expect;
var MongoClient = require('mongodb');
var request = require('request')

//const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app,db) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      let stock=req.query.stock
      let likes = req.query.like=='true'
      var ipaddres = req.clientIp;
      var result=[];
      if (Array.isArray(stock)){
          stock.map((i,index)=>{
          request('https://repeated-alpaca.glitch.me/v1/stock/'+i+'/quote',{json:true},(err,response,body)=>{
            db.collection('stocks').findOne({stock:body.symbol},(err,doc)=>{
            db.collection('stocks').findOneAndUpdate({stock:body.symbol},{$set:{stock:body.symbol,price:body.latestPrice},$push:{ip:likes?(doc? (!doc.ip.includes(ipaddres)?ipaddres:''):''):''},$inc:{likes:likes?(doc?(!doc.ip.includes(ipaddres)? 1: 0):0):0}},{upsert:true,returnNewDocument:true},(err,docss)=>{
              let docs=docss.value || null
              //console.log(likes)
              let liker=likes?(docs?(!docs.ip.includes(ipaddres)? docs.likes+1:docs.likes):1):docs?docs.likes:0
              result.push({stock:body.symbol,price:body.latestPrice,rel_likes:liker})
              //console.log(liker)
          })
        })
          }); 
        });
        setTimeout(()=>{
          let action=result.reverse().map((obj,i)=>{
            //console.log(obj)
            return {...obj,rel_likes:obj.rel_likes-(result[(i+1)%2].rel_likes)
                   }
          })
          //console.log(action);
          res.json({stockData:action})
        },250)        
        
      }
      else{
      request('https://repeated-alpaca.glitch.me/v1/stock/'+stock+'/quote',{json:true},(err,response,body)=>{
        db.collection('stocks').findOne({stock:body.symbol},(err,doc)=>{
          db.collection('stocks').findOneAndUpdate({stock:body.symbol},{$set:{stock:body.symbol,price:body.latestPrice},$push:{ip:likes && doc? (!doc.ip.includes(ipaddres)?ipaddres:''):''},$inc:{likes:likes==true && doc!==null?!doc.ip.includes(ipaddres)? 1: 0 :0}},{upsert:true,returnNewDocument:true},(err,docss)=>{
            let docs=docss.value
            //console.log(req.query.like)
            res.json({stockData:{stock:body.symbol,price:body.latestPrice,likes:likes==true?(docs!==null?(!docs.ip.includes(ipaddres)? docs.likes+1:doc.likes) :1 ):docs!==null?doc.likes:0}})
          })
        })
      })
            }
    });
    
};
