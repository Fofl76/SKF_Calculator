import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types/database';

interface PatientProfile {
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  race: 'black' | 'other';
  height: string;
  weight: string;
}

const ProfileScreen: React.FC = () => {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Используем данные из контекста
  // Показываем пустые поля по умолчанию, как запросил пользователь.
  const profile = {
    name: '',
    birthDate: '',
    gender: (userProfile?.gender as 'male' | 'female') || 'male',
    race: (userProfile?.race as 'black' | 'other') || 'other',
    height: '',
    weight: ''
  };
  // Локальные контролируемые поля для редактирования
  const [nameInput, setNameInput] = useState<string>(profile.name);
  const [birthDateInput, setBirthDateInput] = useState<string>(profile.birthDate);
  const [heightInput, setHeightInput] = useState<string>(profile.height);
  const [weightInput, setWeightInput] = useState<string>(profile.weight);

  const saveProfile = async () => {
    try {
      const updates = {
        name: nameInput || undefined,
        birthDate: birthDateInput || undefined,
        // Не меняем gender/race здесь
        height: heightInput ? parseFloat(heightInput) : undefined,
        weight: weightInput ? parseFloat(weightInput) : undefined,
      } as Partial<UserProfile>;

      await updateUserProfile(updates);
      setIsEditing(false);
      // Очищаем локальную форму (поля пользователь хотел видеть пустыми по умолчанию)
      setNameInput('');
      setBirthDateInput('');
      setHeightInput('');
      setWeightInput('');
      Alert.alert('Успешно', 'Профиль сохранен');
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
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

  const doLogoutAndNavigate = async () => {
    try {
      console.log('Calling logout() from AuthContext');
      await logout();
      console.log('logout() resolved, navigating to Login');
      const parentNav = navigation.getParent?.();
      const rootNav = parentNav?.getParent?.() ?? parentNav;
      if (rootNav && typeof rootNav.reset === 'function') {
        rootNav.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else if (rootNav && typeof rootNav.navigate === 'function') {
        (rootNav as any).navigate('Login');
      } else {
        (navigation as any).navigate('Login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
    }
  };

  const handleLogout = () => {
    // Показываем кастомный модальный диалог подтверждения
    setShowLogoutModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Выход</Text>
            <Text style={styles.modalMessage}>Вы уверены, что хотите выйти из аккаунта?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={async () => {
                  setShowLogoutModal(false);
                  await doLogoutAndNavigate();
                }}
              >
                <Text style={styles.modalConfirmText}>Выйти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView style={styles.scrollContainer}>
        {/* User Info Section */}
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userLabel}>Аккаунт</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Выйти</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'П'}
            </Text>
          </View>
          <Text style={styles.name}>
            {profile.name || user?.displayName || 'Пользователь'}
          </Text>
          {profile.birthDate && (
            <Text style={styles.age}>
              {`Возраст: ${calculateAge(profile.birthDate)} лет`}
            </Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {`${profile.height || '-'} см`}
            </Text>
            <Text style={styles.statLabel}>Рост</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {`${profile.weight || '-'} кг`}
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
              onPress={async () => {
                // Если сейчас не редактируем — включаем режим редактирования
                if (!isEditing) {
                  setIsEditing(true);
                  // Оставляем поля пустыми (по требованию)
                } else {
                  // Если в режиме редактирования — сохраняем данные
                  await saveProfile();
                }
              }}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Сохранить' : 'Обновить данные'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ФИО</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={nameInput}
              onChangeText={setNameInput}
              editable={isEditing}
              placeholder="Введите ФИО"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Дата рождения</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={birthDateInput}
              onChangeText={setBirthDateInput}
              editable={isEditing}
              placeholder="ГГГГ-ММ-ДД"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Пол</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, profile.gender === 'male' && styles.radioButtonSelected, styles.radioButtonDisabled]}
                disabled={true}
              >
                <Text style={[styles.radioText, profile.gender === 'male' && styles.radioTextSelected]}>Мужской</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, profile.gender === 'female' && styles.radioButtonSelected, styles.radioButtonDisabled]}
                disabled={true}
              >
                <Text style={[styles.radioText, profile.gender === 'female' && styles.radioTextSelected]}>Женский</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Раса</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, profile.race === 'other' && styles.radioButtonSelected, styles.radioButtonDisabled]}
                disabled={true}
              >
                <Text style={[styles.radioText, profile.race === 'other' && styles.radioTextSelected]}>Не афроамериканец</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, profile.race === 'black' && styles.radioButtonSelected, styles.radioButtonDisabled]}
                disabled={true}
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
              value={heightInput}
              onChangeText={setHeightInput}
              editable={isEditing}
              keyboardType="numeric"
              placeholder="170"
            />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Вес (кг)</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={weightInput}
                onChangeText={setWeightInput}
                editable={isEditing}
                keyboardType="numeric"
                placeholder="70"
              />
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => {
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
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userLabel: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
  /* editButton styles defined above */
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalCancel: {
    backgroundColor: '#eee',
  },
  modalConfirm: {
    backgroundColor: '#FF3B30',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default ProfileScreen;