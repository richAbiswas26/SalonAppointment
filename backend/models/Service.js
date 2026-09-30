const mongoose=require('mongoose');
module.exports=mongoose.model('Service',new mongoose.Schema({category:{type:mongoose.Schema.Types.ObjectId,ref:'Category',required:true},name:{type:String,required:true},description:String,image:String,price:{type:Number,required:true,min:0},active:{type:Boolean,default:true}},{timestamps:true}));
