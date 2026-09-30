const mongoose=require('mongoose');

module.exports=mongoose.model('SlotSetting',new mongoose.Schema({
    date:{type:Date,required:true},
    slot:{type:String,default:''},
    closed:{type:Boolean,default:false},
    dayClosed:{type:Boolean,default:false},
    reason:String
},{timestamps:true}));