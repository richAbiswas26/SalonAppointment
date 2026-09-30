const mongoose=require('mongoose');
module.exports=mongoose.model('ContactMessage',new mongoose.Schema({name:String,email:String,phone:String,message:String,status:{type:String,enum:['new','read','resolved'],default:'new'}},{timestamps:true}));
