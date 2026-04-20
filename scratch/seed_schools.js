const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCADG-9nm-61nmsHbe-hNlg82g0ccKpjkw",
  authDomain: "yau-app.firebaseapp.com",
  projectId: "yau-app",
  storageBucket: "yau-app.firebasestorage.app",
  messagingSenderId: "696491882997",
  appId: "1:696491882997:web:c191283f1415b8e913c8bc",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
    try {
        const snap = await getDocs(collection(db, 'app_schools'));
        if (snap.size === 0) {
            console.log("Collection empty. Seeding defaults...");
            const defaults = [
                { name: 'Brandywine Elementary', type: 'School', active: true },
                { name: 'New York', type: 'School', active: true },
                { name: 'Other', type: 'Other', active: true }
            ];
            for (const s of defaults) {
                await addDoc(collection(db, 'app_schools'), s);
                console.log(`Added ${s.name}`);
            }
        } else {
            console.log(`Collection has ${snap.size} schools already.`);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

seed();
