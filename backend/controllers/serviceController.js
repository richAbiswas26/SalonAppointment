const Category=require('../models/Category');const Service=require('../models/Service');
exports.list=async(req,res)=>res.render('services/index',{categories:await Category.find({active:true}).sort('name')});
exports.category=async(req,res)=>{const category=await Category.findOne({_id:req.params.id,active:true});if(!category)return res.status(404).render('error',{message:'Category not found'});const services=await Service.find({category:category._id,active:true}).sort('name');res.render('services/category',{category,services});};
