# Настройка Firebase для SKF Calculator

## 1. Включение Authentication в Firebase Console

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `skfcalculator-7d6f8`
3. В меню слева выберите **Authentication**
4. Перейдите на вкладку **Sign-in method**
5. Найдите **Email/Password** и нажмите на него
6. Включите переключатель **Enable**
7. Нажмите **Save**

## 2. Проверка конфигурации

Убедитесь, что в файле `config/firebase.ts` указаны правильные настройки проекта:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAgp4krBEUH0aOHwx2y5VBZxrpNbIKkTzY",
  authDomain: "skfcalculator-7d6f8.firebaseapp.com",
  projectId: "skfcalculator-7d6f8",
  storageBucket: "skfcalculator-7d6f8.firebasestorage.app",
  messagingSenderId: "468948739418",
  appId: "1:468948739418:web:a7bbac0fc71f30be383f63",
  measurementId: "G-BY6CSWZLK2"
};
```

## 3. Тестирование

1. Запустите приложение: `npm start`
2. Попробуйте зарегистрировать новый аккаунт
3. Попробуйте войти с созданными учетными данными
4. Проверьте, что пользователь сохраняется в Firebase Console > Authentication > Users

## Возможные проблемы

### Ошибка "auth/invalid-api-key"
- Проверьте, что API key в конфигурации правильный
- Убедитесь, что проект Firebase активен

### Ошибка "auth/email-already-in-use"
- Email уже зарегистрирован в системе
- Попробуйте другой email

### Ошибка "auth/weak-password"
- Пароль должен содержать минимум 6 символов

### Ошибка "auth/user-not-found"
- Пользователь с таким email не найден
- Сначала зарегистрируйтесь

### Ошибка "auth/wrong-password"
- Неверный пароль
- Проверьте правильность ввода