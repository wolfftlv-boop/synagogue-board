const firebaseConfig = {
    apiKey: "AIzaSyDe31VHniTkz_grYpA2e_RXx4g5Cnxa1ng",
    authDomain: "synagogue-board-tlv.firebaseapp.com",
    projectId: "synagogue-board-tlv",
    storageBucket: "synagogue-board-tlv.firebasestorage.app",
    messagingSenderId: "794671855844",
    appId: "1:794671855844:web:3e44c92b15f833784c14f1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let slideTimes = [10000, 12000, 15000, 10000, 10000];

// האזנה להגדרות
db.collection("settings").doc("global").onSnapshot(doc => {
    if (doc.exists) {
        const data = doc.data();
        document.getElementById('display-shul-name').innerText = data.shul_name || "ישיבת חזון אליהו";
        document.getElementById('ticker-text').innerText = data.ticker || "";
        if (data.times) slideTimes = data.times;
    }
});

// האזנה לתפילות, הודעות והקדשות
const sync = (col, elId, templateFunc) => {
    db.collection(col).onSnapshot(snap => {
        let html = '';
        snap.forEach(d => html += templateFunc(d.data()));
        document.getElementById(elId).innerHTML = html;
    });
};

sync("prayers", "prayers-list", p => `<div class="prayer-card"><span class="text-6xl font-bold text-amber-600">${p.time}</span><span class="text-5xl font-bold">${p.name}</span></div>`);
sync("messages", "msgs-area", m => `<div class="mb-8">● ${m.text}</div>`);
sync("dedications", "deds-area", d => `<div class="ded-card">${d.text}</div>`);

// שיעורים יומיים מחב"ד (RSS)
async function updateDailyStudy() {
    const feeds = [
        {title: "היום יום", url: "https://he.chabad.org/tools/rss/yom-yom.xml"},
        {title: "חת\"ת", url: "https://he.chabad.org/tools/rss/hitat.xml"},
        {title: "רמב\"ם", url: "https://he.chabad.org/tools/rss/rambam.xml"}
    ];
    let html = '';
    for(let f of feeds) {
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(f.url)}`);
            const json = await res.json();
            const parser = new DOMParser();
            const xml = parser.parseFromString(json.contents, "text/xml");
            const item = xml.querySelector("item");
            html += `<div class="bg-white p-6 rounded-2xl shadow border-r-8 border-amber-500">
                <h4 class="text-3xl font-bold text-amber-800 underline">${f.title}:</h4>
                <p class="text-3xl mt-2">${item.querySelector("title").textContent}</p>
            </div>`;
        } catch(e) {}
    }
    document.getElementById('study-area').innerHTML = html;
}

// זמני היום ותאריך
async function updateHebDate() {
    const res = await fetch("https://www.hebcal.com/shabbat?cfg=json&geonameid=293397&m=50");
    const data = await res.json();
    document.getElementById('heb-date').innerText = data.items.find(i => i.category === 'hebdate').memo;
    document.getElementById('parasha').innerText = "פרשת " + data.items.find(i => i.category === 'parashat').hebrew;
    
    const zRes = await fetch("https://www.hebcal.com/zmanim?cfg=json&geonameid=293397");
    const zData = await zRes.json();
    const sel = { sunrise: 'נץ החמה', sof_zman_shma: 'סוף זמן ק"ש', sunset: 'שקיעה', tzeit: 'צאת הכוכבים' };
    let zHtml = '';
    for(let [k,v] of Object.entries(sel)) {
        const t = new Date(zData.times[k]).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
        zHtml += `<div class="zman-card"><span class="text-6xl font-bold text-amber-700">${t}</span><span class="text-5xl font-bold">${v}</span></div>`;
    }
    document.getElementById('zmanim-list').innerHTML = zHtml;
}

// ניהול שקופיות
let cur = 0;
function rotate() {
    const slides = document.querySelectorAll('.slide');
    slides[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('active');
    setTimeout(rotate, slideTimes[cur] || 10000);
}

setInterval(() => {
    document.getElementById('digital-clock').innerText = new Date().toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit', hour12:false});
}, 1000);

updateHebDate(); updateDailyStudy(); setTimeout(rotate, 10000);