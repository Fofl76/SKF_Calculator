import admin from "firebase-admin";
import fs from "fs";

// Загружаем ключ
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Подгружаем данные
const rawData = JSON.parse(fs.readFileSync("./data.json", "utf8"));

// Преобразуем Firestore timestamps
function parseValue(value) {
  if (value && value.__datatype__ === "timestamp") {
    const seconds = value.value._seconds || 0;
    const nanoseconds = value.value._nanoseconds || 0;
    return new admin.firestore.Timestamp(seconds, nanoseconds);
  }
  return value;
}

// Рекурсивно преобразуем объект
function parseDoc(doc) {
  const result = {};
  for (const [key, value] of Object.entries(doc)) {
    result[key] = (value && value.__datatype__ === "timestamp")
      ? parseValue(value)
      : value;
  }
  return result;
}

// Функция загрузки
async function upload() {
  const collections = rawData.__collections__;
  for (const [collectionName, docs] of Object.entries(collections)) {
    for (const [docKey, docData] of Object.entries(docs)) {
      const docId = docKey.replace("__doc__", ""); // убираем __doc__
      const parsedData = parseDoc(docData);
      await db.collection(collectionName).doc(docId).set(parsedData);
      console.log(`✔ Загрузка: ${collectionName}/${docId}`);
    }
  }
  console.log("✅ Все данные успешно загружены!");
}

upload().catch(err => console.error("Ошибка при загрузке:", err));
