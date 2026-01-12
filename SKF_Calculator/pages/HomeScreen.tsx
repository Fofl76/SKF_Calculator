import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PatientData {
  creatinine: string;
  age: string;
  gender: 'male' | 'female';
  race: 'black' | 'other';
}

const HomeScreen: React.FC = () => {
  const [patientData, setPatientData] = useState<PatientData>({
    creatinine: '',
    age: '',
    gender: 'male',
    race: 'other'
  });
  const [result, setResult] = useState<number | null>(null);

  const calculateCKD_EPI = (data: PatientData): number => {
    const creatinine = parseFloat(data.creatinine);
    const age = parseFloat(data.age);

    if (!creatinine || !age || creatinine <= 0 || age <= 0) {
      throw new Error('Некорректные данные');
    }

    let k = data.gender === 'female' ? 0.7 : 0.9;
    let alpha = data.gender === 'female' ? -0.329 : -0.411;
    let raceFactor = data.race === 'black' ? 1.159 : 1.0;

    if (data.gender === 'female' && creatinine <= k) {
      return 144 * Math.pow(creatinine / k, alpha) * Math.pow(0.993, age) * raceFactor;
    } else if (data.gender === 'male' && creatinine <= k) {
      return 141 * Math.pow(creatinine / k, alpha) * Math.pow(0.993, age) * raceFactor;
    } else {
      return 141 * Math.pow(creatinine / k, -1.209) * Math.pow(0.993, age) * raceFactor;
    }
  };

  const saveToHistory = async (data: PatientData, skfResult: number, stage: string) => {
    try {
      const existing = await AsyncStorage.getItem('skfCalculations');
      const calculations = existing ? JSON.parse(existing) : [];

      const newCalculation = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        creatinine: parseFloat(data.creatinine),
        age: parseFloat(data.age),
        gender: data.gender,
        race: data.race,
        result: skfResult,
        stage: stage,
      };

      calculations.push(newCalculation);
      await AsyncStorage.setItem('skfCalculations', JSON.stringify(calculations));
    } catch (error) {
      console.error('Ошибка сохранения расчета:', error);
    }
  };

  const handleCalculate = () => {
    try {
      const skf = calculateCKD_EPI(patientData);
      const roundedResult = Math.round(skf * 100) / 100;
      const stage = getCKDStage(skf).stage;

      setResult(roundedResult);
      saveToHistory(patientData, roundedResult, stage);
    } catch (error) {
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
            <Text style={styles.label}>Креатинин (мкмоль/л)</Text>
            <TextInput
              style={styles.input}
              value={patientData.creatinine}
              onChangeText={(text) => setPatientData({...patientData, creatinine: text})}
              keyboardType="numeric"
              placeholder="Введите значение креатинина"
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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Раса</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioButton, patientData.race === 'other' && styles.radioButtonSelected]}
                onPress={() => setPatientData({...patientData, race: 'other'})}
              >
                <Text style={[styles.radioText, patientData.race === 'other' && styles.radioTextSelected]}>Не афроамериканец</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioButton, patientData.race === 'black' && styles.radioButtonSelected]}
                onPress={() => setPatientData({...patientData, race: 'black'})}
              >
                <Text style={[styles.radioText, patientData.race === 'black' && styles.radioTextSelected]}>Афроамериканец</Text>
              </TouchableOpacity>
            </View>
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
  scrollContainer: {
    flex: 1,
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
});

export default HomeScreen;