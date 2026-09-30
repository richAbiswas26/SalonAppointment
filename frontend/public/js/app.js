document.addEventListener('DOMContentLoaded',()=>{

  const slides=[...document.querySelectorAll('.hero-slide')];

  if(slides.length>1){
    let i=0;

    setInterval(()=>{
      slides[i].classList.remove('active');
      i=(i+1)%slides.length;
      slides[i].classList.add('active');
    },4500);
  }

  const date=document.querySelector('#date');
  const slot=document.querySelector('#slot');

  if(date&&slot){

    date.addEventListener('change',async()=>{

      slot.innerHTML='<option>Loading...</option>';

      const r=await fetch('/api/slots?date='+date.value);
      const data=await r.json();

      if(data.dayClosed){
        slot.innerHTML='<option value="">🔴 Salon Closed</option>';
        return;
      }

      slot.innerHTML=data.filter(x=>x.available)
        .map(x=>`<option value="${x.slot}">${x.slot}</option>`)
        .join('')
        ||'<option value="">No slots available</option>';

    });

  }

});