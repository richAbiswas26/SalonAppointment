const mongoose=require('mongoose');

module.exports=mongoose.model('RewardHistory',new mongoose.Schema({
  customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  cycle:{type:Number,required:true},
  booking:{type:mongoose.Schema.Types.ObjectId,ref:'Booking'},
  visitsRequired:{type:Number,default:6},
  discountPercent:{type:Number,default:10},
  unlockedAt:{type:Date,default:Date.now}
},{timestamps:true}));
