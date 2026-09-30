const Category=require('../models/Category');const HeroImage=require('../models/HeroImage');
exports.home=async(req,res)=>{const categories=await Category.find({active:true}).sort('name');const heroes=await HeroImage.find({active:true}).sort('order');res.render('home',{categories,heroes});};
