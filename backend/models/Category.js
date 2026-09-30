const mongoose=require('mongoose');
module.exports=mongoose.model('Category',new mongoose.Schema({name:{type:String,required:true,unique:true},description:String,image:String,active:{type:Boolean,default:true}},{timestamps:true}));
