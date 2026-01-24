let currentSlide = 0;
let msgIndex = 0;
const slides = document.querySelectorAll('.slide');

function nextSlide() {
    slides.forEach(s => s.classList.remove('active'));
    currentSlide = (currentSlide + 1) % slides.length;
    
    // החלפת הודעות בתוך שקופית ההודעות
    if (slides[currentSlide].id === 'slide-messages') {
        const msgEl = document.getElementById('message-text');
        if (window.customMessages && window.customMessages.length > 0) {
            msgEl.innerText = window.customMessages[msgIndex];
            msgIndex = (msgIndex + 1) % window.customMessages.length;
        } else {
            msgEl.innerText = "ברוכים הבאים לבית הכנסת";
        }
    }
    slides[currentSlide].classList.add('active');
}

// משיכת נתונים
async function fetchAll() {
    // 1. זמני היום (תל אביב)
    try {
        const res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://he.chabad.org/tools/rss/zmanim.xml?city=263"));
        const data = await res.json();
        const xml = new DOMParser().parseFromString(data.contents, "text/xml");
        const items = xml.getElementsByTagName("item");
        for (let item of items) {
            const title = item.getElementsByTagName("title")[0].textContent;
            const desc = item.getElementsByTagName("description")[0].textContent;
            const time = desc.match(/(\d{1,2}:\d{2})/)?.[0];
            if (!time) continue;
            if (title.includes("נץ החמה")) document.getElementById('sunrise').innerText = time;
            if (title.includes("קריאת שמע")) document.getElementById('shema').innerText = time;
            if (title.includes("תפילה")) document.getElementById('tefila').innerText = time;
            if (title.includes("חצות")) document.getElementById('noon').innerText = time;
            if (title.includes("מנחה גדולה")) document.getElementById('mincha').innerText = time;
            if (title.includes("שקיעה")) document.getElementById('sunset').innerText = time;
            if (title.includes("צאת הכוכבים")) document.getElementById('stars').innerText = time;
        }
    } catch (e) {}

    // 2. תאריך עברי
    try {
        const hRes = await fetch("https://www.hebcal.com/converter?cfg=json&gy=" + new Date().getFullYear() + "&gm=" + (new Date().getMonth()+1) + "&gd=" + new Date().getDate() + "&g2h=1");
        const hData = await hRes.json();
        document.getElementById('heb-date').innerText = hData.hebrew;
        
        const pRes = await fetch("https://www.hebcal.com/shabbat?cfg=json&m=0&geonameid=293397");
        const pData = await pRes.json();
        const parasha = pData.items.find(i => i.category === "parashat");
        if(parasha) document.getElementById('parasha-name').innerText = "פרשת " + parasha.hebrew;
    } catch(e) {}

    // 3. שיעורים
    const lessons = ["chumash", "tehillim", "tanya", "rambam"];
    for (let l of lessons) {
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://he.chabad.org/tools/rss/daily_lesson.xml?lesson=${l}`)}`);
            const data = await res.json();
            const xml = new DOMParser().parseFromString(data.contents, "text/xml");
            const title = xml.getElementsByTagName("title")[1]?.textContent || "—";
            document.getElementById(`lesson-${l}`).innerText = title.replace("חת\"ת - ", "").replace("רמב\"ם - ", "");
        } catch (e) {}
    }
}

setInterval(() => {
    document.getElementById('clock-time').innerText = new Date().toLocaleTimeString('he-IL');
}, 1000);

setInterval(nextSlide, 15000); // מעבר כל 15 שניות
setInterval(fetchAll, 3600000); // עדכון נתונים פעם בשעה

fetchAll();