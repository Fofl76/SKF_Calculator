import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types/database';
import Loader from '../components/Loader';

const INSTITUTION = {
  name: 'Медицинский центр "Пример"',
  address: 'ул. Примерная, 1, г. Москва',
  hotline: '+7 (800) 123-45-67',
};

const ProfileScreen: React.FC = () => {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const [nameInput, setNameInput] = useState<string>('');
  const [positionInput, setPositionInput] = useState<string>('');
  const [contactPhoneInput, setContactPhoneInput] = useState<string>('');

  // Validation states
  const [nameError, setNameError] = useState<string>('');
  const [positionError, setPositionError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // Do not auto-fill inputs from userProfile; fields should be filled manually by the user.

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('ФИО обязательно для заполнения');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('ФИО должно содержать минимум 2 символа');
      return false;
    }
    setNameError('');
    return true;
  };

  const validatePosition = (position: string) => {
    if (!position.trim()) {
      setPositionError('Должность обязательна для заполнения');
      return false;
    }
    setPositionError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) {
      setPhoneError('');
      return true; // Phone is optional
    }
    const phoneRegex = /^(\+7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneError('Введите корректный номер телефона');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateAllFields = () => {
    const nameValid = validateName(nameInput);
    const positionValid = validatePosition(positionInput);
    const phoneValid = validatePhone(contactPhoneInput);
    return nameValid && positionValid && phoneValid;
  };

  const saveProfile = async () => {
    if (!validateAllFields()) {
      Toast.show({
        type: 'error',
        text1: 'Проверка не пройдена',
        text2: 'Пожалуйста, исправьте ошибки в форме',
      });
      return;
    }

    try {
      const updates: Partial<UserProfile> = {
        name: nameInput.trim() || undefined,
        position: positionInput.trim() || undefined,
        contactPhone: contactPhoneInput.trim() || undefined,
      };

      await updateUserProfile(updates);
      setIsEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Успешно',
        text2: 'Профиль сохранен',
      });
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось сохранить профиль',
      });
    }
  };

  const doLogoutAndNavigate = async () => {
    try {
      await logout();
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
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: 'Не удалось выйти из аккаунта',
      });
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleShowInfo = () => {
    setShowInfoModal(true);
  };

  const displayName = userProfile?.name || user?.displayName || 'Пользователь';
  const displayPosition = userProfile?.position || 'Должность не указана';
  const displayPhone = userProfile?.contactPhone || '';

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
                  // show loader and blur, then logout
                  setBusy(true);
                  try {
                    await doLogoutAndNavigate();
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Выйти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContainer}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Информация</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowInfoModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.infoModalScroll}>
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Формула расчета СКФ</Text>
                <Text style={styles.infoText}>
                  Калькулятор использует формулу CKD-EPI 2021 (Chronic Kidney Disease Epidemiology Collaboration) для расчета скорости клубочковой фильтрации (СКФ).
                </Text>
                <Text style={styles.infoText}>
                  Формула учитывает уровень креатинина в крови, возраст, пол пациента. Расчет производится в мл/мин/1.73м².
                </Text>
                <Text style={styles.infoFormula}>
                  CKD-EPI 2021 = 142 × (Scr/k)^α × (Scr/k)^-1.200 × 0.9938^Возраст × (1.012 если женщина)
                </Text>
                <Text style={styles.infoText}>
                  Где:{'\n'}• Scr - уровень креатинина (мг/дл или мкмоль/л){'\n'}• k = 0.7 (женщины), 0.9 (мужчины){'\n'}• α = -0.241 (женщины), -0.302 (мужчины)
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Инструкция по использованию</Text>
                <Text style={styles.infoInstruction}>
                  1. Введите ФИО пациента{'\n'}
                  2. Укажите пол пациента{'\n'}
                  3. Введите возраст в годах{'\n'}
                  4. Укажите вес в килограммах{'\n'}
                  5. Введите рост в сантиметрах{'\n'}
                  6. Введите уровень креатинина в крови{'\n'}
                  7. Выберите единицы измерения (мкмоль/л или мг/дл){'\n'}
                  8. Нажмите "Рассчитать СКФ"
                </Text>
                <Text style={styles.infoWarning}>
                  Важно: Поля возраста и креатинина обязательны для заполнения.
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Интерпретация результатов</Text>
                <Text style={styles.infoText}>
                  • Стадия 1: СКФ ≥ 90 мл/мин/1.73м² (нормальная функция){'\n'}
                  • Стадия 2: СКФ 60-89 мл/мин/1.73м² (легкое снижение){'\n'}
                  • Стадия 3: СКФ 30-59 мл/мин/1.73м² (умеренное снижение){'\n'}
                  • Стадия 4: СКФ 15-29 мл/мин/1.73м² (тяжелое снижение){'\n'}
                  • Стадия 5: СКФ {'<'} 15 мл/мин/1.73м² (терминальная недостаточность)
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Контакты</Text>
                <Text style={styles.infoText}>
                  По вопросам и предложениям:{'\n'}
                  <Text style={styles.contactEmail}>g.savidi@yandex.ru</Text>
                </Text>
                <Text style={styles.infoText}>
                  Приложение разработано для медицинских специалистов.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {busy && (
          <View style={styles.busyOverlay}>
            <Loader />
          </View>
        )}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName ? displayName.charAt(0).toUpperCase() : 'П'}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.position}>{displayPosition}</Text>
          {displayPhone ? <Text style={styles.phoneText}>{displayPhone}</Text> : null}
          <Text style={styles.emailText}>{user?.email ?? ''}</Text>
        </View>

        <View style={styles.institutionCard}>
          <Text style={styles.institutionName}>{INSTITUTION.name}</Text>
          <Text style={styles.institutionAddress}>{INSTITUTION.address}</Text>
          <Text style={styles.institutionHotline}>Горячая линия: {INSTITUTION.hotline}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Контактная информация</Text>
          </View>

          <TouchableOpacity
            style={styles.fullWidthEditButton}
            onPress={async () => {
              if (!isEditing) {
                // enter edit mode and prefill fields from profile
                setNameInput(userProfile?.name || '');
                setPositionInput(userProfile?.position || '');
                setContactPhoneInput(userProfile?.contactPhone || '');
                setIsEditing(true);
              } else {
                await saveProfile();
              }
            }}
          >
            <Text style={styles.fullWidthEditButtonText}>{isEditing ? 'Сохранить' : 'Изменить'}</Text>
          </TouchableOpacity>

          {/* show fields only in edit mode */}
          {isEditing && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ФИО</Text>
                <TextInput
                  style={[
                    styles.input,
                    !isEditing && styles.inputDisabled,
                    nameError && styles.inputError
                  ]}
                  value={nameInput}
                  onChangeText={(text) => {
                    setNameInput(text);
                    if (isEditing) validateName(text);
                  }}
                  editable={isEditing}
                  placeholder="Введите ФИО"
                />
                {nameError && isEditing && (
                  <Text style={styles.errorText}>{nameError}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Должность</Text>
                <TextInput
                  style={[
                    styles.input,
                    !isEditing && styles.inputDisabled,
                    positionError && styles.inputError
                  ]}
                  value={positionInput}
                  onChangeText={(text) => {
                    setPositionInput(text);
                    if (isEditing) validatePosition(text);
                  }}
                  editable={isEditing}
                  placeholder="Введите должность"
                />
                {positionError && isEditing && (
                  <Text style={styles.errorText}>{positionError}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Контактный телефон</Text>
                <TextInput
                  style={[
                    styles.input,
                    !isEditing && styles.inputDisabled,
                    phoneError && styles.inputError
                  ]}
                  value={contactPhoneInput}
                  onChangeText={(text) => {
                    setContactPhoneInput(text);
                    if (isEditing) validatePhone(text);
                  }}
                  editable={isEditing}
                  placeholder="+7 (___) ___-__-__"
                  keyboardType="phone-pad"
                />
                {phoneError && isEditing && (
                  <Text style={styles.errorText}>{phoneError}</Text>
                )}
              </View>

              <View style={{ marginTop: 10 }}>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.fullCancelButton}
                    onPress={() => {
                      setIsEditing(false);
                      setNameInput('');
                      setPositionInput('');
                      setContactPhoneInput('');
                      setNameError('');
                      setPositionError('');
                      setPhoneError('');
                    }}
                  >
                    <Text style={styles.fullCancelButtonText}>Отмена</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        {/* Information and logout buttons */}
        <View style={{ marginHorizontal: 20, marginTop: 10, gap: 10 }}>
          <TouchableOpacity
            style={styles.fullInfoButton}
            onPress={handleShowInfo}
          >
            <Text style={styles.fullInfoButtonText}>Информация</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fullLogoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.fullLogoutButtonText}>Выйти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E4E3DB',
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
    backgroundColor: '#3C9245',
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
  position: {
    fontSize: 14,
    color: '#666',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  phoneText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontWeight: '600',
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998,
  },
  institutionCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3C9245',
    marginBottom: 6,
  },
  institutionAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  institutionHotline: {
    fontSize: 14,
    color: '#F94315',
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#E4E3DB',
  },
  inputDisabled: {
    backgroundColor: '#E4E3DB',
    color: '#666',
  },
  inputError: {
    borderColor: '#F94315',
    borderWidth: 1,
  },
  errorText: {
    color: '#F94315',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#3C9245',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  fullWidthEditButton: {
    backgroundColor: '#3C9245',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  fullWidthEditButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#F94315',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#aaa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  fullLogoutButton: {
    backgroundColor: '#F94315',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  fullLogoutButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  fullCancelButton: {
    backgroundColor: '#FFF3BF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  fullCancelButtonText: {
    color: '#8A6D00',
    fontWeight: '700',
    fontSize: 16,
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
    backgroundColor: '#F94315',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
  fullInfoButton: {
    backgroundColor: '#3C9245',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  fullInfoButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  infoModalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    alignItems: 'center',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  infoModalScroll: {
    width: '100%',
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3C9245',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  infoFormula: {
    fontSize: 14,
    color: '#3C9245',
    fontWeight: '600',
    backgroundColor: '#E4E3DB',
    padding: 10,
    borderRadius: 6,
    marginVertical: 10,
    textAlign: 'center',
  },
  infoInstruction: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 10,
  },
  infoWarning: {
    fontSize: 14,
    color: '#F94315',
    fontWeight: '600',
    backgroundColor: '#FFF4F4',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F94315',
  },
  contactEmail: {
    fontSize: 14,
    color: '#3C9245',
    fontWeight: '600',
  },
});

export default ProfileScreen;