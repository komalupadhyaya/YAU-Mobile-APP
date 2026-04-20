import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Firebase configuration (same as project)
const firebaseConfig = {
  apiKey: "AIzaSyCADG-9nm-61nmsHbe-hNlg82g0ccKpjkw",
  authDomain: "yau-app.firebaseapp.com",
  projectId: "yau-app",
  storageBucket: "yau-app.firebasestorage.app",
  messagingSenderId: "696491882997",
  appId: "1:696491882997:web:c191283f1415b8e913c8bc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// School data to seed
const schoolsToSeed = [
  {
    name: "Allenwood Elementary School",
    location: "Camp Springs, MD",
    sports: ["Soccer", "Flag Football"],
  },
  {
    name: "Brandywine Elementary School",
    location: "Brandywine, MD",
    sports: ["Basketball", "Soccer"],
  },
  {
    name: "Clinton Elementary School",
    location: "Clinton, MD",
    sports: ["Football", "Soccer"],
  },
  {
    name: "Suitland Elementary School",
    location: "Suitland, MD",
    sports: ["Basketball", "Flag Football"],
  },
  {
    name: "Temple Hills Elementary School",
    location: "Temple Hills, MD",
    sports: ["Soccer"],
  },
];

// Generate schoolKey from name
function generateSchoolKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

// Seed schools to Firestore
async function seedSchools() {
  console.log("🌱 Starting school seeding...\n");

  let addedCount = 0;
  let skippedCount = 0;

  for (const school of schoolsToSeed) {
    const schoolKey = generateSchoolKey(school.name);
    const docRef = doc(db, "app_schools", schoolKey);

    try {
      // Check if document already exists
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log(`⏭️  Skipped (exists): ${school.name}`);
        skippedCount++;
      } else {
        // Insert new document
        await setDoc(docRef, {
          name: school.name,
          schoolKey: schoolKey,
          location: school.location,
          sports: school.sports,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log(`✅ Added: ${school.name}`);
        addedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${school.name}:`, error);
    }
  }

  console.log(`\n📊 Seeding complete!`);
  console.log(`   Added: ${addedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total: ${schoolsToSeed.length}`);
}

// Run the seed function
seedSchools()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
