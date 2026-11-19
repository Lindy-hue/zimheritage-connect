// --- 1. REGISTER SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => console.log('Service Worker registered:', reg.scope))
      .catch((err) => console.error('Service Worker failed:', err));
  });
}

// --- 2. NETWORK STATUS DETECTION (OFFLINE BANNER) ---
function updateOnlineStatus() {
  const banner = document.getElementById('offline-banner');
  if (!navigator.onLine) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// --- 3. COMMUNITY TOURISM DATASET ---
const experiences = [
  {
    id: 'ZM-DOM-01',
    title: 'Domboshava San Rock Art & Sacred Forest Walk',
    province: 'Mashonaland East',
    guide: 'Sekuru Taurai Mhlanga (ZTA Verified Custodian)',
    guidePhone: '+263 77 200 4192',
    priceUSD: 15,
    coords: [-17.6136, 31.1353],
    trail: [
      [-17.6136, 31.1353],
      [-17.6110, 31.1380],
      [-17.6095, 31.1402]
    ],
    duration: '3 Hours',
    description: 'Explore 6,000-year-old San rock paintings, geological granite domes, and traditional rainmaking caves.'
  },
  {
    id: 'ZM-CHI-02',
    title: 'Chimanimani Bridal Veil to Skeleton Pass Trail',
    province: 'Manicaland',
    guide: 'Chipo Sithole (Mountain Rescue & Eco-Guide)',
    guidePhone: '+263 71 450 8821',
    priceUSD: 25,
    coords: [-19.7989, 32.8631],
    trail: [
      [-19.7989, 32.8631],
      [-19.7920, 32.8710],
      [-19.7850, 32.8805]
    ],
    duration: '5 Hours',
    description: 'Guided alpine hike through endemic protea flora and quartz peaks with offline GPS waypoint support.'
  },
  {
    id: 'ZM-MAT-03',
    title: 'Matobo Hills Ndebele Homestead & Silozwane Cave',
    province: 'Matabeleland South',
    guide: 'Bhekinkosi Ndlovu (Matobo Heritage Trust)',
    guidePhone: '+263 78 312 9044',
    priceUSD: 20,
    coords: [-20.5500, 28.5000],
    trail: [
      [-20.5500, 28.5000],
      [-20.5560, 28.5080],
      [-20.5612, 28.5145]
    ],
    duration: '4 Hours',
    description: 'Experience traditional painted Ndebele architecture, local sorghum cuisine, and ancient granite shelters.'
  }
];

let currentCurrency = 'USD';
const ZIG_RATE = 26.50; // Indicative USD to ZiG exchange rate
let selectedExperience = null;
let leafletMap = null;

// --- 4. CURRENCY & RENDERING ENGINE ---
function formatPrice(usdAmount) {
  if (currentCurrency === 'USD') {
    return `$${usdAmount.toFixed(2)} USD`;
  }
  return `ZiG ${(usdAmount * ZIG_RATE).toFixed(2)}`;
}

function setCurrency(currency) {
  currentCurrency = currency;
  const btnUsd = document.getElementById('btn-usd');
  const btnZig = document.getElementById('btn-zig');

  if (currency === 'USD') {
    btnUsd.className = 'px-3 py-1 rounded text-xs font-bold bg-amber-500 text-emerald-950 transition';
    btnZig.className = 'px-3 py-1 rounded text-xs font-bold text-emerald-100 hover:text-white transition';
  } else {
    btnZig.className = 'px-3 py-1 rounded text-xs font-bold bg-amber-500 text-emerald-950 transition';
    btnUsd.className = 'px-3 py-1 rounded text-xs font-bold text-emerald-100 hover:text-white transition';
  }
  renderExperiences();
}

function renderExperiences(filter = 'ALL') {
  const grid = document.getElementById('experiences-grid');
  grid.innerHTML = '';

  const filtered = filter === 'ALL'
    ? experiences
    : experiences.filter((item) => item.province === filter);

  filtered.forEach((exp) => {
    const card = document.createElement('article');
    card.className = 'bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between';
    card.innerHTML = `
      <div>
        <div class="flex justify-between items-center text-xs font-semibold text-emerald-700 mb-2">
          <span>${exp.province}</span>
          <span class="bg-stone-100 text-stone-600 px-2 py-0.5 rounded">${exp.duration}</span>
        </div>
        <h3 class="text-lg font-bold text-stone-900 mb-1">${exp.title}</h3>
        <p class="text-xs text-stone-500 mb-3">Guide: ${exp.guide}</p>
        <p class="text-sm text-stone-600 mb-4">${exp.description}</p>
      </div>
      <div class="pt-4 border-t border-stone-100 flex items-center justify-between">
        <div>
          <span class="text-xs text-stone-400 block">From</span>
          <span class="text-lg font-extrabold text-emerald-900">${formatPrice(exp.priceUSD)}</span>
        </div>
        <button onclick="openBookingModal('${exp.id}')" class="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition">
          View Trail & Book
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterExperiences() {
  const province = document.getElementById('province-filter').value;
  renderExperiences(province);
}

// --- 5. LEAFLET INTERACTIVE TRAIL MAP & MODAL ---
function openBookingModal(id) {
  selectedExperience = experiences.find((e) => e.id === id);
  if (!selectedExperience) return;

  document.getElementById('modal-province').textContent = selectedExperience.province;
  document.getElementById('modal-title').textContent = selectedExperience.title;
  document.getElementById('modal-guide').textContent = `Custodian: ${selectedExperience.guide}`;

  const base = selectedExperience.priceUSD;
  const levy = base * 0.10;
  const total = base + levy;

  document.getElementById('modal-base-price').textContent = formatPrice(base);
  document.getElementById('modal-levy-price').textContent = formatPrice(levy);
  document.getElementById('modal-total-price').textContent = formatPrice(total);

  document.getElementById('booking-modal').classList.remove('hidden');

  // Initialize or update Leaflet Map
  setTimeout(() => {
    if (leafletMap) {
      leafletMap.remove();
    }
    leafletMap = L.map('trail-map').setView(selectedExperience.coords, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);

    // Plot Trail Polyline & Start Marker
    L.polyline(selectedExperience.trail, { color: '#065f46', weight: 4 }).addTo(leafletMap);
    L.marker(selectedExperience.coords)
      .addTo(leafletMap)
      .bindPopup(`<b>Trailhead:</b> ${selectedExperience.title}`)
      .openPopup();
  }, 150);
}

function cacheTrailOffline() {
  const btn = document.getElementById('cache-map-btn');
  localStorage.setItem(`offline_trail_${selectedExperience.id}`, JSON.stringify(selectedExperience));
  btn.textContent = 'Saved Offline ✓';
  btn.className = 'text-xs bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded';
}

// --- 6. ESCROW CHECKOUT, SMS DISPATCH & OFFLINE QR PASS ---
function processBooking(event) {
  event.preventDefault();
  const touristName = document.getElementById('tourist-name').value;
  const gateway = document.getElementById('payment-gateway').value;
  const bookingRef = 'ZH-' + Math.floor(100000 + Math.random() * 900000);

  const ticketData = {
    ref: bookingRef,
    tourist: touristName,
    experience: selectedExperience.title,
    guide: selectedExperience.guide,
    guidePhone: selectedExperience.guidePhone,
    gateway: gateway,
    amount: formatPrice(selectedExperience.priceUSD * 1.10),
    timestamp: new Date().toLocaleDateString()
  };

  // Persist booking locally for offline access
  localStorage.setItem('active_zimheritage_pass', JSON.stringify(ticketData));

  closeModal('booking-modal');
  openTicketModal();
}

function openTicketModal() {
  const saved = localStorage.getItem('active_zimheritage_pass');
  const qrContainer = document.getElementById('qrcode-container');
  const smsLog = document.getElementById('sms-log');
  qrContainer.innerHTML = '';

  if (saved) {
    const pass = JSON.parse(saved);
    document.getElementById('ticket-badge').classList.remove('hidden');
    document.getElementById('pass-title').textContent = pass.experience;
    document.getElementById('pass-meta').textContent = `Ref: ${pass.ref} • Guest: ${pass.tourist} • Paid via ${pass.gateway}`;

    // Generate Scannable QR Code for Guide Escrow Release
    new QRCode(qrContainer, {
      text: JSON.stringify({ ref: pass.ref, tourist: pass.tourist, status: 'ESCROW_FUNDED' }),
      width: 160,
      height: 160,
      colorDark: '#064e3b',
      colorLight: '#ffffff'
    });

    // Display Simulated Low-Bandwidth SMS Webhook Confirmation
    smsLog.classList.remove('hidden');
    smsLog.innerHTML = `<strong>SMS Gateway Dispatched to ${pass.guidePhone}:</strong><br/>"ZimHeritage #${pass.ref}: ${pass.tourist} booked ${pass.experience}. Escrow ${pass.amount} held. Reply 1 to confirm."`;
  }

  document.getElementById('ticket-modal').classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// Initialize app on load
renderExperiences();
if (localStorage.getItem('active_zimheritage_pass')) {
  document.getElementById('ticket-badge').classList.remove('hidden');
}