// timeline.js

// Initialiser Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAe9vP5Mn1b9wLpk-fnG9RL9mxKEgRyvE4",
  authDomain: "babybetting-10677.firebaseapp.com",
  projectId: "babybetting-10677",
  storageBucket: "babybetting-10677.firebasestorage.app",
  messagingSenderId: "668728354912",
  appId: "1:668728354912:web:51ec22e3abbd470d427b05",
};
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// Hent elementer
const babySavingsAmount = document.getElementById('baby-savings-amount');
const bettingPotAmount = document.getElementById('betting-pot-amount');
const container = document.getElementById('timeline');
const dateBettingPotAmount = document.getElementById('date-betting-pot-amount');
const timeBettingPotAmount = document.getElementById('time-betting-pot-amount');

// Initialiser tidslinjen
let timeline;
const items = new vis.DataSet([]);

// Tidslinjealternativer
const options = {
  orientation: 'top',
  showCurrentTime: true,
  stack: true,
  margin: {
    item: 20,
    axis: 10,
  },
  min: new Date('2024-10-22'),
  max: new Date('2025-02-22'),
  zoomKey: 'ctrlKey', // Krever ctrl-tast for zoom på desktop
  horizontalScroll: true,
  zoomable: false, // Deaktiver zoom på mobil
};

function formatDate(dateString) {
  const months = ['januar', 'februar', 'mars', 'april', 'mai', 'juni',
                  'juli', 'august', 'september', 'oktober', 'november', 'desember'];
  const date = new Date(dateString);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}


// Initialiser tellere
let totalContributions = 0;

// Funksjon for å animere telling
function animateValue(id, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    id.textContent = value;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Sanntidslytter
db.collection('bets').orderBy('timestamp').onSnapshot(snapshot => {
  totalContributions = 0;
  const betsData = [];

  // Legg til termindato på tidslinjen
  betsData.push({
    id: 'due-date',
    content: '<div>Termindato</div>',
    start: '2024-12-22',
    type: 'box',
    className: 'due-date',
  });

  snapshot.forEach(doc => {
    const bet = doc.data();
    totalContributions += 200; // Hvert veddemål er 150 NOK
    const betDateTime = `${bet.date}T${bet.time}`;
    const betDate = new Date(betDateTime);
    

    // Forbered data for tidslinjen
    let content = `<div class="text">${bet.name}</div>`;
    if (bet.selfieURL) {
      content = `<img src="${bet.selfieURL}" alt="${bet.name}">${content}`;
    }

    betsData.push({
      id: doc.id,
      content: content,
      start: betDateTime,
      type: 'box',
      className: 'guess',
      selfieURL: bet.selfieURL,
      betDate: bet.date,
      betTime: bet.time,
      name: bet.name,
    });
  });

  // Oppdater tellerne med animasjon
  const babySavings = totalContributions / 2; // 100 NOK per veddemål
  const dateBettingPot = (totalContributions / 2) * (75 / 100); // 75% av 100 NOK
  const timeBettingPot = (totalContributions / 2) * (25 / 100); // 25% av 100 NOK

  animateValue(babySavingsAmount, parseInt(babySavingsAmount.textContent) || 0, babySavings, 1000);
  animateValue(dateBettingPotAmount, parseInt(dateBettingPotAmount.textContent) || 0, dateBettingPot, 1000);
  animateValue(timeBettingPotAmount, parseInt(timeBettingPotAmount.textContent) || 0, timeBettingPot, 1000);


  // Oppdater tidslinjen
  items.clear();
  items.add(betsData);

  if (!timeline) {
    timeline = new vis.Timeline(container, items, options);

    // Hent modal elementer
    const modal = document.getElementById('betModal');
    const modalName = document.getElementById('modal-name');
    const modalDate = document.getElementById('modal-date');
    const modalImage = document.getElementById('modal-image');
    const closeBtn = modal.querySelector('.close');

    // Legg til hendelseslytter for klikk på elementer
    timeline.on('select', function (properties) {
      if (properties.items.length > 0) {
        const item = items.get(properties.items[0]);
        if (item.id !== 'due-date') {
          // Sett innhold i modal
          modalName.textContent = `${item.name} satser 200kr på at bebbi kommer ut av Nora den ${formatDate(item.betDate)} klokka ${item.betTime}`;

          modalDate.textContent =  `Valgt dato og tid: ${formatDate(item.betDate)} kl. ${item.betTime}`;
          if (item.selfieURL) {
            modalImage.src = item.selfieURL;
            modalImage.style.display = 'block';
          } else {
            modalImage.style.display = 'none';
          }

          // Vis modal
          modal.style.display = 'block';
        }
      }
    });

    // Lukk modal når 'X' klikkes
    closeBtn.onclick = function() {
      modal.style.display = 'none';
    };

    // Lukk modal når man klikker utenfor modalinnholdet
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
      }
    };
  } else {
    timeline.setItems(items);
  }
});