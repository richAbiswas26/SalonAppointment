function bookingCode(){return 'SAL-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();}
module.exports=bookingCode;
