import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types/database';

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

  const [nameInput, setNameInput] = useState<string>('');
  const [positionInput, setPositionInput] = useState<string>('');
  const [contactPhoneInput, setContactPhoneInput] = useState<string>('');

  // Do not auto-fill inputs from userProfile; fields should be filled manually by the user.

  const saveProfile = async () => {
    try {
      const updates: Partial<UserProfile> = {
        name: nameInput || undefined,
        position: positionInput || undefined,
        contactPhone: contactPhoneInput || undefined,
      };

      await updateUserProfile(updates);
      setIsEditing(false);
      Alert.alert('Успешно', 'Профиль сохранен');
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить профиль');
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
      Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const displayName = userProfile?.name || user?.displayName || 'Пользователь';
  const displayPosition = userProfile?.position || 'Должность не указана';

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
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName ? displayName.charAt(0).toUpperCase() : 'П'}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.position}>{displayPosition}</Text>
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
            <TouchableOpacity
              style={styles.editButton}
              onPress={async () => {
                if (!isEditing) {
                  setIsEditing(true);
                } else {
                  await saveProfile();
                }
              }}
            >
              <Text style={styles.editButtonText}>{isEditing ? 'Сохранить' : 'Изменить'}</Text>
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
            <Text style={styles.label}>Должность</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={positionInput}
              onChangeText={setPositionInput}
              editable={isEditing}
              placeholder="Введите должность"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Контактный телефон</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={contactPhoneInput}
              onChangeText={setContactPhoneInput}
              editable={isEditing}
              placeholder="+7 (___) ___-__-__"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Выйти</Text>
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setNameInput('');
                  setPositionInput('');
                  setContactPhoneInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
            )}
          </View>
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
  position: {
    fontSize: 14,
    color: '#666',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
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
    color: '#007AFF',
    marginBottom: 6,
  },
  institutionAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  institutionHotline: {
    fontSize: 14,
    color: '#FF3B30',
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
    backgroundColor: '#f9f9f9',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
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