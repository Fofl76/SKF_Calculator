import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Analysis } from '../types/database';

const AnalysisHistoryScreen: React.FC = () => {
  const { userAnalyses } = useAuth();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStageColor = (stage: string): string => {
    switch (stage.toLowerCase()) {
      case 'стадия 1':
        return '#4CAF50'; // Зеленый
      case 'стадия 2':
        return '#FF9800'; // Оранжевый
      case 'стадия 3':
        return '#FF5722'; // Красный
      case 'стадия 4':
        return '#F44336'; // Темно-красный
      case 'стадия 5':
        return '#9C27B0'; // Фиолетовый
      default:
        return '#666';
    }
  };

  const AnalysisCard: React.FC<{ analysis: Analysis }> = ({ analysis }) => (
    <View style={styles.analysisCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(analysis.createdAt)}</Text>
        <View style={[styles.stageBadge, { backgroundColor: getStageColor(analysis.result.stage) }]}>
          <Text style={styles.stageText}>{analysis.result.stage}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Возраст</Text>
            <Text style={styles.metricValue}>{analysis.age} лет</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Пол</Text>
            <Text style={styles.metricValue}>
              {analysis.gender === 'male' ? 'Мужской' : 'Женский'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Рост</Text>
            <Text style={styles.metricValue}>{analysis.height} см</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Вес</Text>
            <Text style={styles.metricValue}>{analysis.weight} кг</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>ИМТ</Text>
            <Text style={styles.metricValue}>{analysis.bmi.toFixed(1)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Креатинин</Text>
            <Text style={styles.metricValue}>{analysis.creatinine.toFixed(1)} мг/дл</Text>
          </View>
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.resultLabel}>Результат:</Text>
          <Text style={styles.egfrValue}>СКФ: {analysis.result.eGFR.toFixed(1)} мл/мин/1.73м²</Text>
          <Text style={styles.riskText}>Риск: {analysis.result.risk}</Text>
        </View>
      </View>
    </View>
  );

  if (userAnalyses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>История анализов пуста</Text>
          <Text style={styles.emptySubtitle}>
            Выполните первый расчет, чтобы увидеть историю анализов
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>История анализов</Text>
          <Text style={styles.subtitle}>
            Всего анализов: {userAnalyses.length}
          </Text>
        </View>

        <View style={styles.analysesList}>
          {userAnalyses.map((analysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} />
          ))}
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
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  analysesList: {
    padding: 20,
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  egfrValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  riskText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AnalysisHistoryScreen;