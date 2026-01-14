# База данных SKF Calculator

## Структура базы данных

Приложение использует Firebase Firestore для хранения данных пользователей. Все данные организованы в три основные коллекции:

### 1. Коллекция `users`
Хранит базовую информацию о пользователях Firebase Authentication.

```typescript
interface User {
  id: string;              // Firebase Auth user ID
  email: string;           // Email пользователя
  displayName?: string;    // Отображаемое имя
  createdAt: Date;         // Дата создания аккаунта
  lastLoginAt?: Date;      // Последний вход
}
```

### 2. Коллекция `userProfiles`
Хранит расширенную информацию о профиле пользователя.

```typescript
interface UserProfile {
  id: string;              // ID документа Firestore
  userId: string;          // Firebase Auth user ID
  email: string;           // Email пользователя
  name?: string;           // ФИО
  birthDate?: string;      // Дата рождения (ГГГГ-ММ-ДД)
  gender?: 'male' | 'female'; // Пол
  race?: 'black' | 'other';   // Раса
  height?: number;         // Рост в см
  weight?: number;         // Вес в кг
  createdAt: Date;         // Дата создания
  updatedAt: Date;         // Дата последнего обновления
}
```

### 3. Коллекция `analyses`
Хранит историю медицинских анализов пользователя.

```typescript
interface Analysis {
  id: string;              // ID документа Firestore
  userId: string;          // Firebase Auth user ID
  age: number;             // Возраст на момент анализа
  gender: 'male' | 'female'; // Пол
  race: 'black' | 'other';   // Раса
  height: number;          // Рост в см
  weight: number;          // Вес в кг
  bmi: number;             // Индекс массы тела
  creatinine: number;      // Уровень креатинина
  result: {
    eGFR: number;          // Расчетная СКФ
    stage: string;         // Стадия ХБП
    risk: string;          // Описание риска
  };
  createdAt: Date;         // Дата анализа
}
```

## Безопасность данных

- **Пользователь видит только свои данные**: Все запросы фильтруются по `userId`
- **Firebase Security Rules**: Рекомендуется настроить правила безопасности в Firebase Console
- **Аутентификация обязательна**: Доступ к данным только для авторизованных пользователей

## Пример Security Rules для Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пользователи могут читать и писать только свои данные
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /userProfiles/{profileId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    match /analyses/{analysisId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Использование в приложении

### Работа с данными пользователя

```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { userProfile, userAnalyses, updateUserProfile, saveAnalysis } = useAuth();

  // Обновление профиля
  const updateProfile = async () => {
    await updateUserProfile({
      name: 'Новое имя',
      height: 175,
      weight: 70
    });
  };

  // Сохранение анализа
  const saveNewAnalysis = async () => {
    await saveAnalysis({
      age: 30,
      gender: 'male',
      race: 'other',
      height: 175,
      weight: 70,
      bmi: 22.9,
      creatinine: 1.2,
      result: {
        eGFR: 85.5,
        stage: 'Стадия 2',
        risk: 'Легкое снижение СКФ'
      }
    });
  };

  return (
    <View>
      <Text>Профиль: {userProfile?.name}</Text>
      <Text>Всего анализов: {userAnalyses.length}</Text>
    </View>
  );
};
```

## Миграция данных

Если у вас есть существующие данные в AsyncStorage, они будут автоматически перенесены в Firebase при первом запуске приложения после авторизации пользователя.

## Мониторинг

Для просмотра данных пользователей используйте Firebase Console:
1. Перейдите в **Firestore Database**
2. Просмотрите коллекции `users`, `userProfiles`, `analyses`
3. Используйте фильтры для поиска данных конкретного пользователя

## Статистика пользователя

Приложение предоставляет статистику по анализам пользователя:

```typescript
interface UserStats {
  totalAnalyses: number;    // Общее количество анализов
  averageBMI: number;       // Средний ИМТ
  averageEGFR: number;      // Средняя СКФ
  lastAnalysisDate?: Date;  // Дата последнего анализа
}
```

### Получение статистики

```typescript
const stats = await databaseService.getUserStats(userId);
console.log(`Всего анализов: ${stats.totalAnalyses}`);
console.log(`Средний ИМТ: ${stats.averageBMI.toFixed(1)}`);
console.log(`Средняя СКФ: ${stats.averageEGFR.toFixed(1)}`);
```

## Резервное копирование

Firebase автоматически создает резервные копии данных. Для дополнительной безопасности:
- Регулярно экспортируйте данные из Firebase Console
- Настройте автоматическое резервное копирование в Firebase
- Рассмотрите возможность локального хранения критичных данных