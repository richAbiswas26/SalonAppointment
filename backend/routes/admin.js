const router=require('express').Router();
const c=require('../controllers/adminController');
const {requireAdmin}=require('../middleware/auth');
const upload=require('../middleware/upload');

router.use(requireAdmin);

router.get('/',c.dashboard);
router.get('/bookings',c.bookings);
router.post('/bookings/:id/cancel',c.cancelBooking);
router.post('/bookings/:id/complete',c.completeBooking);

router.get('/categories',c.categories);
router.post('/categories',(req,res,next)=>{req.uploadFolder='categories';next();},upload.single('image'),c.createCategory);
router.get('/categories/:id/edit', c.editCategory);
router.post(
    '/categories/:id/edit',
    (req,res,next)=>{
        req.uploadFolder='categories';
        next();
    },
    upload.single('image'),
    c.updateCategory
);
router.post('/categories/:id/delete',c.deleteCategory);

router.get('/services',c.services);
router.post('/services',(req,res,next)=>{req.uploadFolder='services';next();},upload.single('image'),c.createService);
router.post('/services/:id/delete',c.deleteService);

router.get('/hero',c.hero);
router.post('/hero',(req,res,next)=>{req.uploadFolder='hero';next();},upload.single('image'),c.createHero);
router.post('/hero/:id/delete',c.deleteHero);

router.get('/slots',c.slots);
router.post('/slots/toggle',c.toggleSlot);
router.post('/slots/day-toggle',c.toggleDay);

router.get('/revenue',c.revenue);
router.get('/customers',c.customers);
router.get('/rewards',c.customerRewards);

router.get('/messages',c.messages);
router.get('/profile',c.profile);
router.post('/profile',c.updateProfile);

module.exports=router;
