const firebaseConfig = {
    apiKey: "AIzaSyDe31VHniTkz_grYpA2e_RXx4g5Cnxa1ng",
    authDomain: "synagogue-board-tlv.firebaseapp.com",
    projectId: "synagogue-board-tlv"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 1. שעון
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute: '2-digit', hour12: false});
}, 1000);

// 2. זמנים, תאריך ופרשה (Hebcal)
async function updateExternalData() {
    try {
        const res = await fetch("https://www.hebcal.com/shabbat?cfg=json&geonameid=293397&m=50");
        const data = await res.json();
        const hebDate = data.items.find(i => i.category === 'hebdate').memo;
        const parasha = data.items.find(i => i.category === 'parashat').hebrew;
        document.getElementById('heb-date').innerText = hebDate;
        document.getElementById('parasha').innerText = "פרשת " + parasha;

        const zRes = await fetch("https://www.hebcal.com/zmanim?cfg=json&geonameid=293397");
        const zData = await zRes.json();
        const sel = { sunrise: 'נץ החמה', sof_zman_shma: 'סוף זמן ק"ש', sunset: 'שקיעה', tzeit: 'צאת הכוכבים' };
        let zHtml = '';
        for(let [k,v] of Object.entries(sel)) {
            const t = new Date(zData.times[k]).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
            zHtml += `<div class="bg-white p-6 rounded-2xl shadow-md border-r-8 border-amber-500 flex justify-between items-center">
                <span class="text-5xl font-bold text-slate-700">${v}</span>
                <span class="text-6xl font-black text-amber-600">${t}</span>
            </div>`;
        }
        document.getElementById('zmanim-list').innerHTML = zHtml;
    } catch(e) { console.error(e); }
}

// 3. סנכרון Firebase - הגדרות, תפילות, סדר יום (לפי יום)
db.collection("settings").doc("global").onSnapshot(doc => {
    if(doc.exists) {
        document.getElementById('shul-name-display').innerText = doc.data().shul_name || "";
        document.getElementById('ticker-display').innerText = doc.data().ticker || "";
    }
});

function syncContent() {
    const today = new Date().getDay().toString();
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    document.getElementById('day-name').innerText = days[today];

    // סדר יום - מסונן לפי יום
    db.collection("schedule").where("day", "==", today).onSnapshot(snap => {
        let html = '';
        snap.forEach(d => {
            const s = d.data();
            html += `<div class="bg-white p-8 rounded-3xl border-r-8 border-blue-500 flex justify-between text-5xl font-bold shadow-lg">
                <span>${s.act}</span><span class="text-blue-600">${s.time}</span>
            </div>`;
        });
        document.getElementById('schedule-list').innerHTML = html;
    });

    // תפילות
    db.collection("prayers").onSnapshot(snap => {
        let html = '';
        snap.forEach(d => {
            const p = d.data();
            html += `<div class="bg-white p-6 rounded-2xl border-r-8 border-amber-600 flex justify-between text-5xl font-bold shadow-md">
                <span>${p.name}</span><span class="text-amber-600">${p.time}</span>
            </div>`;
        });
        document.getElementById('prayers-list').innerHTML = html;
    });
}

// 4. סליידר
let cur = 0;
function rotate() {
    const slides = document.querySelectorAll('.slide');
    slides[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('active');
}

updateExternalData();
syncContent();
setInterval(rotate, 15000);
setInterval(updateExternalData, 3600000);
