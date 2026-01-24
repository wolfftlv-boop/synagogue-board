import { doc, onSnapshot, collection, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = window.db;
let slideTimes = [15000, 15000, 15000, 15000, 15000];
let currentSlide = 0;

// טעינת הגדרות
onSnapshot(doc(db, "settings", "global"), (snap) => {
    if (snap.exists()) {
        const data = snap.data();
        document.getElementById('shul-name-display').innerText = data.shul_name;
        document.getElementById('ticker-text').innerText = data.ticker;
        if (data.logo) document.getElementById('shul-logo').src = data.logo;
        if (data.times) slideTimes = data.times;
    }
});

// לוגיקת החלפת שקופיות עם זמנים משתנים
function rotate() {
    const slides = document.querySelectorAll('.slide');
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
    
    setTimeout(rotate, slideTimes[currentSlide] || 15000);
}

// זמני היום (תל אביב) ותאריך עברי
async function updateZmanim() {
    try {
        const res = await fetch(`https://www.hebcal.com/zmanim?cfg=json&city=IL-TelAviv`);
        const data = await res.json();
        const list = document.getElementById('zmanim-list');
        list.innerHTML = '';
        
        const keys = {sunrise: 'נץ החמה', sofer_st_shma: 'סוף שמע', chatzot: 'חצות', sunset: 'שקיעה', tzeit: 'צאת כוכבים'};
        for (let [k, v] of Object.entries(keys)) {
            const time = new Date(data.times[k]).toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'});
            list.innerHTML += `<div class="card-item"><span>${v}</span><b>${time}</b></div>`;
        }

        const hRes = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${new Date().getFullYear()}&gm=${new Date().getMonth()+1}&gd=${new Date().getDate()}&g2h=1`);
        const hData = await hRes.json();
        document.getElementById('heb-date').innerText = hData.hebrew;
        
        const pRes = await fetch(`https://www.hebcal.com/shabbat?cfg=json&city=IL-TelAviv`);
        const pData = await pRes.json();
        const parasha = pData.items.find(i => i.category === 'parashat');
        document.getElementById('parasha').innerText = parasha ? `פרשת ${parasha.hebrew}` : '';
    } catch(e) {}
}

// עדכון שעון
setInterval(() => {
    document.getElementById('digital-clock').innerText = new Date().toLocaleTimeString('he-IL');
}, 1000);

// הפעלה
updateZmanim();
setTimeout(rotate, slideTimes[0]);
setInterval(updateZmanim, 3600000);