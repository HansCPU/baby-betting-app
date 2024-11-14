// app.js
function formatDate(dateString) {
  const months = ['januar', 'februar', 'mars', 'april', 'mai', 'juni',
                  'juli', 'august', 'september', 'oktober', 'november', 'desember'];
  const date = new Date(dateString);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}


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
const storage = firebase.storage();

// Hent elementer
const betForm = document.getElementById('bet-form');
const loadingSpinner = document.getElementById('loading-spinner');
const confirmationModal = document.getElementById('confirmationModal');
const modalImage = document.getElementById('modal-image');
const modalDate = document.getElementById('modal-date');
const closeBtn = document.getElementsByClassName('close')[0];
const modalMessage = document.getElementById('modal-message');


// Lukk modal når 'X' klikkes
closeBtn.onclick = function() {
  confirmationModal.style.display = 'none';
};

// Lukk modal når man klikker utenfor modalinnholdet
window.onclick = function(event) {
  if (event.target == confirmationModal) {
    confirmationModal.style.display = 'none';
  }
};

// Håndter tilpasset filopplasting
const fileInput = document.getElementById('selfie');
const button = fileInput.nextElementSibling;
const label = button.nextElementSibling;

button.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  let fileName = 'Ingen fil valgt';
  if (fileInput.files.length > 0) {
    fileName = fileInput.files[0].name;
  }
  label.textContent = fileName;
});

// Send inn veddemål
betForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = betForm['name'].value.trim();
  const date = betForm['date'].value;
  const time = betForm['time'].value;
  const selfieFile = betForm['selfie'].files[0];

  if (!name || !date) {
    alert('Vennligst skriv inn navn og velg en dato.');
    return;
  }

  // Valider at dato er innenfor tillatt område
  const selectedDate = new Date(date);
  const minDate = new Date('2024-10-22');
  const maxDate = new Date('2025-02-22');

  if (selectedDate < minDate || selectedDate > maxDate) {
    alert('Vennligst velg en dato mellom 22. oktober 2024 og 22. februar 2025.');
    return;
  }

  // Vis lasteanimasjon
  loadingSpinner.style.display = 'block';

  // Deaktiver send-knappen
  betForm.querySelector('button').disabled = true;

  // Funksjon for å sende inn veddemål
  const submitBet = (selfieURL = '') => {
    db.collection('bets').add({
      name: name,
      date: date,
      time: time,
      selfieURL: selfieURL,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    }).then(() => {
      // Skjul lasteanimasjon
      loadingSpinner.style.display = 'none';

      // Aktiver send-knappen
      betForm.querySelector('button').disabled = false;

      // Nullstill skjema
      betForm.reset();
      label.textContent = 'Ingen fil valgt';

      // Vis bekreftelsesmodal
      if (selfieURL) {
        modalImage.src = selfieURL;
        modalImage.style.display = 'block';
      } else {
        modalImage.style.display = 'none';
      }
      // Etter at veddemålet er registrert vellykket
      modalMessage.textContent = `${name} satser 200kr på at bebbi kommer ut av Nora den ${formatDate(date)} klokka ${time}`;

      confirmationModal.style.display = 'block';
    }).catch(error => {
      console.error('Feil ved innsending av veddemål: ', error);
      
      // Skjul lasteanimasjon og aktiver send-knappen
      loadingSpinner.style.display = 'none';
      betForm.querySelector('button').disabled = false;
    });
  };

  if (selfieFile) {
    // Last opp bilde til Firebase Storage
    const storageRef = storage.ref('selfies/' + Date.now() + '_' + selfieFile.name);
    storageRef.put(selfieFile)
      .then(snapshot => snapshot.ref.getDownloadURL())
      .then(downloadURL => {
        submitBet(downloadURL);
      })
      .catch(error => {
        console.error('Feil ved opplasting av bilde: ', error);
        alert('En feil oppstod under opplasting av bilde. Vennligst prøv igjen.');

        // Skjul lasteanimasjon og aktiver send-knappen
        loadingSpinner.style.display = 'none';
        betForm.querySelector('button').disabled = false;
      });
  } else {
    // Ingen bilde lastet opp
    submitBet();
  }
});
