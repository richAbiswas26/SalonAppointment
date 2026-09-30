const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
 name:{type:String,required:true,trim:true},adminId:{type:String,unique:true,sparse:true,trim:true},username:{type:String,trim:true,unique:true,sparse:true},email:{type:String,lowercase:true,trim:true,sparse:true},phone:{type:String,trim:true},passwordHash:String,googleId:String,authProvider:{type:String,enum:['local','google'],default:'local'},role:{type:String,enum:['customer','admin'],default:'customer'},rewardCycle:{type:Number,default:0},rewardCount:{type:Number,default:0},rewardDiscount:{type:Number,default:10},resetTokenHash:String,resetTokenExpiresAt:Date
},{timestamps:true});
module.exports=mongoose.model('User',userSchema);
