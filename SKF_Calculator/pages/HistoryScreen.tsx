import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SKFCalculation {
  id: string;
  date: string;
  creatinine: number;
  age: number;
  gender: 'male' | 'female';
  race: 'black' | 'other';
  result: number;
  stage: string;
}

const HistoryScreen: React.FC = () => {
  const [calculations, setCalculations] = useState<SKFCalculation[]>([]);

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      const saved = await AsyncStorage.getItem('skfCalculations');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCalculations(parsed.sort((a: SKFCalculation, b: SKFCalculation) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (error) {
      console.error('Ошибка загрузки расчетов:', error);
    }
  };

  const deleteCalculation = async (id: string) => {
    Alert.alert(
      'Удалить расчет',
      'Вы уверены, что хотите удалить этот расчет?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              const filtered = calculations.filter(calc => calc.id !== id);
              setCalculations(filtered);
              await AsyncStorage.setItem('skfCalculations', JSON.stringify(filtered));
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить расчет');
            }
          }
        }
      ]
    );
  };

  const clearHistory = async () => {
    Alert.alert(
      'Очистить историю',
      'Вы уверены, что хотите удалить всю историю расчетов?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить',
          style: 'destructive',
          onPress: async () => {
            try {
              setCalculations([]);
              await AsyncStorage.removeItem('skfCalculations');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось очистить историю');
            }
          }
        }
      ]
    );
  };

  const getStageInfo = (stage: string) => {
    const stages = {
      'Стадия 1': { color: '#4CAF50', bgColor: '#E8F5E8' },
      'Стадия 2': { color: '#FF9800', bgColor: '#FFF3E0' },
      'Стадия 3': { color: '#FF5722', bgColor: '#FFEBEE' },
      'Стадия 4': { color: '#F44336', bgColor: '#FFCDD2' },
      'Стадия 5': { color: '#9C27B0', bgColor: '#F3E5F5' },
    };
    return stages[stage as keyof typeof stages] || { color: '#666', bgColor: '#F5F5F5' };
  };

  const renderCalculationItem = ({ item }: { item: SKFCalculation }) => {
    const stageInfo = getStageInfo(item.stage);

    return (
      <TouchableOpacity
        style={styles.calculationItem}
        onLongPress={() => deleteCalculation(item.id)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemDate}>
            {new Date(item.date).toLocaleDateString('ru-RU')}
          </Text>
          <Text style={styles.itemTime}>
            {new Date(item.date).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        <View style={styles.itemContent}>
          <View style={styles.resultContainer}>
            <Text style={styles.resultValue}>{item.result.toFixed(1)}</Text>
            <Text style={styles.resultUnit}>мл/мин/1.73м²</Text>
          </View>

          <View style={[styles.stageBadge, { backgroundColor: stageInfo.bgColor }]}>
            <Text style={[styles.stageText, { color: stageInfo.color }]}>
              {item.stage}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            Креатинин: {item.creatinine} мкмоль/л
          </Text>
          <Text style={styles.detailText}>
            Возраст: {item.age} лет
          </Text>
          <Text style={styles.detailText}>
            Пол: {item.gender === 'male' ? 'Мужской' : 'Женский'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getStats = () => {
    if (calculations.length === 0) return null;

    const latest = calculations[0];
    const average = calculations.reduce((sum, calc) => sum + calc.result, 0) / calculations.length;
    const min = Math.min(...calculations.map(calc => calc.result));
    const max = Math.max(...calculations.map(calc => calc.result));

    return { latest, average, min, max };
  };

  const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>История расчетов</Text>
        <Text style={styles.subtitle}>
          Всего расчетов: {calculations.length}
        </Text>
        {calculations.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearButtonText}>Очистить историю</Text>
          </TouchableOpacity>
        )}
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.latest.result.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Последний</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.average.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Средний</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.min.toFixed(1)} - {stats.max.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Диапазон</Text>
          </View>
        </View>
      )}

      {calculations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>История расчетов пуста</Text>
          <Text style={styles.emptySubtext}>
            Выполните расчет СКФ, чтобы увидеть историю здесь
          </Text>
        </View>
      ) : (
        <FlatList
          data={calculations}
          renderItem={renderCalculationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  clearButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    padding: 20,
  },
  calculationItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemTime: {
    fontSize: 14,
    color: '#666',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  resultUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  stageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default HistoryScreen;