import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/databaseService';
import { Analysis } from '../types/database';
import Loader from '../components/Loader';

const AnalysisHistoryScreen: React.FC = () => {
  const { userAnalyses, refreshUserData, user } = useAuth();

  // Ensure we load the latest user analyses when this screen mounts
  useEffect(() => {
    refreshUserData().catch(err => {
      console.error('Failed to refresh user data on HistoryScreen mount:', err);
    });
  }, []);

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
        return '#3C9245'; // Зеленый
      case 'стадия 2':
        return '#FCB404'; // Желтый
      case 'стадия 3':
        return '#F783A3'; // Розовый
      case 'стадия 4':
        return '#F94315'; // Красный
      case 'стадия 5':
        return '#F94315'; // Красный
      default:
        return '#666';
    }
  };

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedAnalysisName, setSelectedAnalysisName] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const onRequestDelete = (analysisId: string, analysisName?: string, ownerId?: string) => {
    // Prevent attempting to delete analyses that don't belong to the current user
    if (ownerId && user && ownerId !== user.uid) {
      Alert.alert('Ошибка', 'У вас нет прав на удаление этого анализа');
      return;
    }
    setSelectedAnalysisId(analysisId);
    setSelectedAnalysisName(analysisName);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedAnalysisId) return;
    setBusy(true);
    try {
      await databaseService.deleteAnalysis(selectedAnalysisId);
      setDeleteModalVisible(false);
      setSelectedAnalysisId(null);
      setSelectedAnalysisName(undefined);
      await refreshUserData();
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      setDeleteModalVisible(false);
      Alert.alert('Ошибка', 'Не удалось удалить анализ');
    } finally {
      setBusy(false);
    }
  };

  const AnalysisCard: React.FC<{ analysis: Analysis }> = ({ analysis }) => (
    <View style={styles.analysisCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dateText}>{formatDate(analysis.createdAt)}</Text>
          {analysis.name ? <Text style={styles.patientName}>{analysis.name}</Text> : null}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onRequestDelete(analysis.id, analysis.name, (analysis as any).userId)}
        >
          <Text style={styles.deleteButtonText}>Удалить</Text>
        </TouchableOpacity>
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
          <Text style={[styles.kidneyFunctionText, { color: getStageColor(analysis.result.stage) }]}>
            Функция почек: {Math.round(Math.min((analysis.result.eGFR / 90) * 100, 100))}%
          </Text>
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
          {[
            // Ensure we only render analyses belonging to the current user and sort by date desc
            ...userAnalyses
          ]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
        </View>
        {busy && (
          <View style={styles.busyOverlay}>
            <Loader />
          </View>
        )}
        {/* Delete confirmation modal (reuses ProfileScreen style) */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Удаление анализа</Text>
              <Text style={styles.modalMessage}>
                {selectedAnalysisName
                  ? `Вы уверены, что хотите удалить анализ пациента "${selectedAnalysisName}"?`
                  : 'Вы уверены, что хотите удалить этот анализ?'}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancel]}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirm]}
                  onPress={confirmDelete}
                >
                  <Text style={styles.modalConfirmText}>Удалить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    color: '#3C9245',
    marginBottom: 4,
  },
  kidneyFunctionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  riskText: {
    fontSize: 14,
    color: '#666',
  },
  patientName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginTop: 4,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#F94315',
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
});

export default AnalysisHistoryScreen;