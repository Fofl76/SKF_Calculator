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
  TextInput,
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
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [selectedStages, setSelectedStages] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

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
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск по имени пациента..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, styles.filterButtonFullWidth]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>Фильтр</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.analysesList}>
          {[
            // Ensure we only render analyses belonging to the current user and sort by date desc
            ...userAnalyses
          ]
            .filter((analysis) => {
              // Text search filter
              if (searchText !== '' && (!analysis.name || !analysis.name.toLowerCase().includes(searchText.toLowerCase()))) {
                return false;
              }

              // Gender filter
              if (selectedGender && analysis.gender !== selectedGender) {
                return false;
              }

              // Stage filter
              if (selectedStages.length > 0) {
                const stageNumber = parseInt(analysis.result.stage.replace('Стадия ', ''));
                if (!selectedStages.includes(stageNumber)) {
                  return false;
                }
              }

              // Date range filter
              if (dateFrom && analysis.createdAt < dateFrom) {
                return false;
              }
              if (dateTo) {
                const endOfDay = new Date(dateTo);
                endOfDay.setHours(23, 59, 59, 999);
                if (analysis.createdAt > endOfDay) {
                  return false;
                }
              }

              return true;
            })
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

        {/* Filter modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Фильтры</Text>

              {/* Gender filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Пол пациента:</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[styles.genderOption, selectedGender === 'male' && styles.genderOptionSelected]}
                    onPress={() => setSelectedGender(selectedGender === 'male' ? null : 'male')}
                  >
                    <Text style={[styles.genderOptionText, selectedGender === 'male' && styles.genderOptionTextSelected]}>
                      Мужской
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderOption, selectedGender === 'female' && styles.genderOptionSelected]}
                    onPress={() => setSelectedGender(selectedGender === 'female' ? null : 'female')}
                  >
                    <Text style={[styles.genderOptionText, selectedGender === 'female' && styles.genderOptionTextSelected]}>
                      Женский
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stage filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Стадии (можно выбрать несколько):</Text>
                <View style={styles.stagesContainer}>
                  {[1, 2, 3, 4, 5].map((stage) => (
                    <TouchableOpacity
                      key={stage}
                      style={[styles.stageCheckbox, selectedStages.includes(stage) && styles.stageCheckboxSelected]}
                      onPress={() => {
                        if (selectedStages.includes(stage)) {
                          setSelectedStages(selectedStages.filter(s => s !== stage));
                        } else {
                          setSelectedStages([...selectedStages, stage]);
                        }
                      }}
                    >
                      <Text style={[styles.stageCheckboxText, selectedStages.includes(stage) && styles.stageCheckboxTextSelected]}>
                        Стадия {stage}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Период анализа:</Text>
                <View style={styles.dateContainer}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>От:</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="ДД.ММ.ГГГГ"
                      value={dateFrom ? dateFrom.toLocaleDateString('ru-RU') : ''}
                      onChangeText={(text) => {
                        if (text.length === 10) {
                          const date = new Date(text.split('.').reverse().join('-'));
                          if (!isNaN(date.getTime())) {
                            setDateFrom(date);
                          }
                        } else if (text === '') {
                          setDateFrom(null);
                        }
                      }}
                    />
                  </View>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>До:</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="ДД.ММ.ГГГГ"
                      value={dateTo ? dateTo.toLocaleDateString('ru-RU') : ''}
                      onChangeText={(text) => {
                        if (text.length === 10) {
                          const date = new Date(text.split('.').reverse().join('-'));
                          if (!isNaN(date.getTime())) {
                            setDateTo(date);
                          }
                        } else if (text === '') {
                          setDateTo(null);
                        }
                      }}
                    />
                  </View>
                </View>
                {(dateFrom || dateTo) && (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() => {
                      setDateFrom(null);
                      setDateTo(null);
                    }}
                  >
                    <Text style={styles.clearDateButtonText}>Очистить даты</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.resetButton]}
                  onPress={() => {
                    setSelectedGender(null);
                    setSelectedStages([]);
                    setDateFrom(null);
                    setDateTo(null);
                  }}
                >
                  <Text style={styles.resetButtonText}>Сбросить</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancel]}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirm]}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={styles.modalConfirmText}>Применить</Text>
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
  searchContainer: {
    marginTop: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#E4E3DB',
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
  filterButton: {
    backgroundColor: '#3C9245',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  filterButtonFullWidth: {
    alignSelf: 'stretch',
    marginHorizontal: 0,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    width: '100%',
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  filterOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#E4E3DB',
  },
  filterOptionSelected: {
    borderColor: '#3C9245',
    backgroundColor: '#3C924510',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: '#3C9245',
    fontWeight: '600',
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  sortOrderButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#E4E3DB',
    alignItems: 'center',
  },
  sortOrderButtonSelected: {
    borderColor: '#3C9245',
    backgroundColor: '#3C924510',
  },
  sortOrderText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  sortOrderTextSelected: {
    color: '#3C9245',
    fontWeight: '600',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#E4E3DB',
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#3C9245',
    backgroundColor: '#3C924510',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  genderOptionTextSelected: {
    color: '#3C9245',
    fontWeight: '600',
  },
  stagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageCheckbox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#E4E3DB',
  },
  stageCheckboxSelected: {
    borderColor: '#3C9245',
    backgroundColor: '#3C924510',
  },
  stageCheckboxText: {
    fontSize: 14,
    color: '#333',
  },
  stageCheckboxTextSelected: {
    color: '#3C9245',
    fontWeight: '600',
  },
  dateContainer: {
    gap: 12,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 25,
  },
  dateInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#E4E3DB',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    minWidth: 120,
  },
  clearDateButton: {
    marginTop: 10,
    padding: 8,
    alignItems: 'center',
  },
  clearDateButtonText: {
    color: '#F94315',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#FFF3BF',
    flex: 1,
  },
  resetButtonText: {
    color: '#8A6D00',
    fontWeight: '600',
  },
});

export default AnalysisHistoryScreen;