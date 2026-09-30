const mongoose=require('mongoose');
module.exports=mongoose.model('Revenue',new mongoose.Schema({booking:{type:mongoose.Schema.Types.ObjectId,ref:'Booking',required:true},amount:{type:Number,required:true},month:String,paidAt:{type:Date,default:Date.now}},{timestamps:true}));
