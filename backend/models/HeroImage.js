const mongoose=require('mongoose');
module.exports=mongoose.model('HeroImage',new mongoose.Schema({title:String,subtitle:String,image:String,active:{type:Boolean,default:true},order:{type:Number,default:0}},{timestamps:true}));
