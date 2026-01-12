import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PatientProfile {
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  race: 'black' | 'other';
  height: string;
  weight: string;
}

const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<PatientProfile>({
    name: '',
    birthDate: '',
    gender: 'male',
    race: 'other',
    height: '',
    weight: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('patientProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem('patientProfile', JSON.stringify(profile));
      setIsEditing(false);
      Alert.alert('Успешно', 'Профиль сохранен');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить профиль');
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = (): string => {
    const height = parseFloat(profile.height);
    const weight = parseFloat(profile.weight);
    if (height && weight && height > 0) {
      const bmi = weight / Math.pow(height / 100, 2);
      return bmi.toFixed(1);
    }
    return '-';
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return 'Недостаточный вес';
    if (bmi < 25) return 'Нормальный вес';
    if (bmi < 30) return 'Избыточный вес';
    return 'Ожирение';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'П'}
            </Text>
          </View>
          <Text style={styles.name}>
            {profile.name || 'Пациент'}
          </Text>
          {profile.birthDate && (
            <Text style={styles.age}>
              Возраст: {calculateAge(profile.birthDate)} лет
            </Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {profile.height || '-'} см
            </Text>
            <Text style={styles.statLabel}>Рост</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {profile.weight || '-'} кг
            </Text>
            <Text style={styles.statLabel}>Вес</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {calculateBMI()}
            </Text>
            <Text style={styles.statLabel}>ИМТ</Text>
          </View>
        </View>

        {calculateBMI() !== '-' && (
          <View style={styles.bmiContainer}>
            <Text style={styles.bmiCategory}>
              {getBMICategory(parseFloat(calculateBMI()))}
            </Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Данные пациента</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => isEditing ? saveProfile() : setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Сохранить' : 'Редактировать'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ФИО</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profile.name}
              onChangeText={(text) => setProfile({...profile, name: text})}
              editable={isEditing}
              placeholder="Введите ФИО"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Дата рождения</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={profile.birthDate}
              onChangeText={(text) => setProfile({...profile, birthDate: text})}
              editable={isEditing}
              placeholder="ГГГГ-ММ-ДД"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Пол</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, profile.gender === 'male' && styles.radioButtonSelected, !isEditing && styles.radioButtonDisabled]}
                onPress={() => isEditing && setProfile({...profile, gender: 'male'})}
                disabled={!isEditing}
              >
                <Text style={[styles.radioText, profile.gender === 'male' && styles.radioTextSelected]}>Мужской</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, profile.gender === 'female' && styles.radioButtonSelected, !isEditing && styles.radioButtonDisabled]}
                onPress={() => isEditing && setProfile({...profile, gender: 'female'})}
                disabled={!isEditing}
              >
                <Text style={[styles.radioText, profile.gender === 'female' && styles.radioTextSelected]}>Женский</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Раса</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, profile.race === 'other' && styles.radioButtonSelected, !isEditing && styles.radioButtonDisabled]}
                onPress={() => isEditing && setProfile({...profile, race: 'other'})}
                disabled={!isEditing}
              >
                <Text style={[styles.radioText, profile.race === 'other' && styles.radioTextSelected]}>Не афроамериканец</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, profile.race === 'black' && styles.radioButtonSelected, !isEditing && styles.radioButtonDisabled]}
                onPress={() => isEditing && setProfile({...profile, race: 'black'})}
                disabled={!isEditing}
              >
                <Text style={[styles.radioText, profile.race === 'black' && styles.radioTextSelected]}>Афроамериканец</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Рост (см)</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={profile.height}
                onChangeText={(text) => setProfile({...profile, height: text})}
                editable={isEditing}
                keyboardType="numeric"
                placeholder="170"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Вес (кг)</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={profile.weight}
                onChangeText={(text) => setProfile({...profile, weight: text})}
                editable={isEditing}
                keyboardType="numeric"
                placeholder="70"
              />
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => {
              loadProfile();
              setIsEditing(false);
            }}>
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  age: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  bmiContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bmiCategory: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF10',
  },
  radioButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;