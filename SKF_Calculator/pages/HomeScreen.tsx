import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, Switch } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface PatientData {
  name: string;
  creatinine: string;
  age: string;
  gender: 'male' | 'female';
  race: 'black' | 'other';
  height: string; // cm
  weight: string; // kg
}

const HomeScreen: React.FC = () => {
  const { userProfile, saveAnalysis } = useAuth();
  const [patientData, setPatientData] = useState<PatientData>({
    name: '',
    creatinine: '',
    age: '',
    gender: 'male',
    race: 'other',
    height: '',
    weight: ''
  });
  const [creatinineUnit, setCreatinineUnit] = useState<'umol' | 'mgdl'>('umol');
  // Toggle handler for creatinine unit switch (true => mg/dL)
  const toggleCreatinineUnit = (toMgdl: boolean) => {
    const current = creatinineUnit;
    const val = parseFloat(patientData.creatinine);
    if (!isNaN(val)) {
      if (toMgdl && current === 'umol') {
        // µmol/L -> mg/dL
        const converted = +(val / 88.4).toFixed(3);
        setPatientData({ ...patientData, creatinine: String(converted) });
      } else if (!toMgdl && current === 'mgdl') {
        // mg/dL -> µmol/L
        const converted = +(val * 88.4).toFixed(1);
        setPatientData({ ...patientData, creatinine: String(converted) });
      }
    }
    setCreatinineUnit(toMgdl ? 'mgdl' : 'umol');
  };
  const [result, setResult] = useState<number | null>(null);

  // Do not auto-fill form fields from user profile; fields are filled manually by user.

  const calculateAgeFromBirthDate = (birthDate: string): number => {
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

  const calculateCKD_EPI = (data: PatientData): number => {
    // CKD-EPI 2021 creatinine equation (refit, without race)
    // Formula expects serum creatinine in mg/dL (IDMS-standardized).
    // We accept input in either µmol/L or mg/dL; handle conversion based on creatinineUnit.
    const creatinineInput = parseFloat(data.creatinine);
    const age = parseFloat(data.age);

    if (!creatinineInput || !age || creatinineInput <= 0 || age <= 0) {
      throw new Error('Некорректные данные');
    }

    const scr = creatinineUnit === 'mgdl' ? creatinineInput : creatinineInput / 88.4; // µmol/L -> mg/dL if needed

    const k = data.gender === 'female' ? 0.7 : 0.9;
    const alpha = data.gender === 'female' ? -0.241 : -0.302;
    const scrOverK = scr / k;

    const part1 = Math.pow(Math.min(scrOverK, 1), alpha);
    const part2 = Math.pow(Math.max(scrOverK, 1), -1.200);
    const ageFactor = Math.pow(0.9938, age);
    const femaleFactor = data.gender === 'female' ? 1.012 : 1.0;

    const egfr = 142 * part1 * part2 * ageFactor * femaleFactor;
    return egfr;
  };

  const saveToHistory = async (data: PatientData, skfResult: number, stage: string) => {
    try {
      // Use entered height/weight if provided, otherwise fall back to profile or defaults
      const height = data.height ? parseFloat(data.height) : userProfile?.height || 170;
      const weight = data.weight ? parseFloat(data.weight) : userProfile?.weight || 70;
      const bmi = weight / Math.pow(height / 100, 2);

      const analysisData = {
        name: data.name || '',
        age: parseFloat(data.age),
        gender: data.gender,
        race: data.race,
        height: height,
        weight: weight,
        bmi: bmi,
        // Store creatinine in µmol/L in database (convert if user entered mg/dL)
        creatinine: creatinineUnit === 'mgdl' ? parseFloat(data.creatinine) * 88.4 : parseFloat(data.creatinine),
        result: {
          eGFR: skfResult,
          stage: stage,
          risk: getCKDStage(skfResult).description,
        },
      };

      await saveAnalysis(analysisData);
      console.log('Analysis saved to Firebase');
    } catch (error) {
      console.error('Ошибка сохранения анализа:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить анализ в базу данных');
    }
  };

  const handleCalculate = async () => {
    try {
      // Validation
      const creat = parseFloat(patientData.creatinine);
      const age = parseFloat(patientData.age);
      const height = patientData.height ? parseFloat(patientData.height) : undefined;
      const weight = patientData.weight ? parseFloat(patientData.weight) : undefined;

      if (isNaN(creat) || creat <= 0) {
        Alert.alert('Ошибка', 'Введите корректное значение креатинина (> 0).');
        return;
      }
      if (isNaN(age) || age <= 0 || age > 120) {
        Alert.alert('Ошибка', 'Введите корректный возраст (1–120).');
        return;
      }
      if (height !== undefined && (isNaN(height) || height <= 0 || height > 300)) {
        Alert.alert('Ошибка', 'Введите корректный рост в см.');
        return;
      }
      if (weight !== undefined && (isNaN(weight) || weight <= 0 || weight > 500)) {
        Alert.alert('Ошибка', 'Введите корректный вес в кг.');
        return;
      }

      const skf = calculateCKD_EPI(patientData);
      const roundedResult = Math.round(skf * 100) / 100;
      const stage = getCKDStage(skf).stage;

      setResult(roundedResult);
      await saveToHistory(patientData, roundedResult, stage);
    } catch (error) {
      console.error('Calculation error:', error);
      Alert.alert('Ошибка', 'Пожалуйста, проверьте введенные данные');
    }
  };

  const getCKDStage = (skf: number): { stage: string; color: string; description: string } => {
    if (skf >= 90) return { stage: 'Стадия 1', color: '#4CAF50', description: 'Нормальная или повышенная СКФ' };
    if (skf >= 60) return { stage: 'Стадия 2', color: '#FF9800', description: 'Легкое снижение СКФ' };
    if (skf >= 30) return { stage: 'Стадия 3', color: '#FF5722', description: 'Умеренное снижение СКФ' };
    if (skf >= 15) return { stage: 'Стадия 4', color: '#F44336', description: 'Тяжелое снижение СКФ' };
    return { stage: 'Стадия 5', color: '#9C27B0', description: 'Терминальная почечная недостаточность' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Расчет СКФ</Text>
          <Text style={styles.subtitle}>Скорость клубочковой фильтрации по формуле CKD-EPI</Text>
        </View>

        <View style={styles.form}>
          

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Имя пациента</Text>
            <TextInput
              style={styles.input}
              value={patientData.name}
              onChangeText={(text) => setPatientData({...patientData, name: text})}
              placeholder="ФИО пациента"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Пол</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, patientData.gender === 'male' && styles.radioButtonSelected]}
                onPress={() => setPatientData({...patientData, gender: 'male'})}
              >
                <Text style={[styles.radioText, patientData.gender === 'male' && styles.radioTextSelected]}>Мужской</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, patientData.gender === 'female' && styles.radioButtonSelected]}
                onPress={() => setPatientData({...patientData, gender: 'female'})}
              >
                <Text style={[styles.radioText, patientData.gender === 'female' && styles.radioTextSelected]}>Женский</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Race is not used in CKD-EPI 2021 equation; UI removed */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Вес (кг)</Text>
            <TextInput
              style={styles.input}
              value={patientData.weight}
              onChangeText={(text) => setPatientData({...patientData, weight: text})}
              keyboardType="numeric"
              placeholder="Введите вес в кг"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Возраст (лет)</Text>
            <TextInput
              style={styles.input}
              value={patientData.age}
              onChangeText={(text) => setPatientData({...patientData, age: text})}
              keyboardType="numeric"
              placeholder="Введите возраст"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Креатинин</Text>
            <TextInput
              style={styles.input}
              value={patientData.creatinine}
              onChangeText={(text) => setPatientData({...patientData, creatinine: text})}
              keyboardType="numeric"
              placeholder={creatinineUnit === 'umol' ? 'Введите значение в µmol/L' : 'Введите значение в mg/dL'}
            />

            <View style={styles.unitToggleContainer}>
              <Text style={styles.unitToggleLabel}>Единицы</Text>
              <View style={styles.unitToggleRow}>
                <Text style={styles.unitText}>{creatinineUnit === 'umol' ? 'µmol/L' : 'mg/dL'}</Text>
                <Switch
                  value={creatinineUnit === 'mgdl'}
                  onValueChange={(val) => toggleCreatinineUnit(val)}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Рост (см)</Text>
            <TextInput
              style={styles.input}
              value={patientData.height}
              onChangeText={(text) => setPatientData({...patientData, height: text})}
              keyboardType="numeric"
              placeholder="Введите рост в см"
            />
          </View>

          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Text style={styles.calculateButtonText}>Рассчитать СКФ</Text>
          </TouchableOpacity>
        </View>

        {result !== null && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Результат расчета</Text>
            <Text style={styles.resultValue}>{result} мл/мин/1.73м²</Text>
            <View style={[styles.stageContainer, { backgroundColor: getCKDStage(result).color + '20' }]}>
              <Text style={[styles.stageText, { color: getCKDStage(result).color }]}>
                {getCKDStage(result).stage}
              </Text>
              <Text style={styles.stageDescription}>
                {getCKDStage(result).description}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  profileInfoText: {
    fontSize: 14,
    color: '#1565C0',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 140, // leave space for elevated bottom tab bar
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
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
  radioText: {
    fontSize: 14,
    color: '#666',
  },
  radioTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 15,
  },
  stageContainer: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  stageText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stageDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  unitToggleContainer: {
    marginTop: 10,
  },
  unitToggleLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  unitToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitText: {
    fontSize: 16,
    color: '#333',
    marginRight: 12,
  },
});

export default HomeScreen;