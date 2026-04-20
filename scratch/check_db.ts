import { db } from '../src/services/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function checkSchools() {
    try {
        console.log("Checking app_schools collection...");
        const snapshot = await getDocs(collection(db, 'app_schools'));
        console.log(`Found ${snapshot.size} documents in app_schools`);
        snapshot.forEach(doc => {
            console.log(`- ${doc.id}: ${JSON.stringify(doc.data())}`);
        });
    } catch (error) {
        console.error("Error checking schools:", error);
    }
}

checkSchools();
