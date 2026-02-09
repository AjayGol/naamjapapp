import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Text, TextInput, Button, Icon } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';

const DEFAULT_MANTRAS = [
  'Radha Radha',
  'Ram Ram',
  'Om Namah Shivaya',
  'Waheguru',
  'Hare Krishna',
  'Om',
];

export const SelectNaamScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [items, setItems] = useState<string[]>(DEFAULT_MANTRAS);
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newNaam, setNewNaam] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [listRaw, activeRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.mantraList),
      AsyncStorage.getItem(STORAGE_KEYS.activeMantra),
    ]);
    const list = listRaw ? (JSON.parse(listRaw) as string[]) : DEFAULT_MANTRAS;
    setItems(list);
    setSelected(activeRaw || list[0] || '');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistList = useCallback(async (list: string[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.mantraList, JSON.stringify(list));
  }, []);

  const selectItem = useCallback(
    async (value: string) => {
      setSelected(value);
      await AsyncStorage.setItem(STORAGE_KEYS.activeMantra, value);
      navigation.goBack();
    },
    [navigation],
  );

  const openAdd = useCallback(() => {
    setNewNaam('');
    setError('');
    setModalVisible(true);
  }, []);

  const addNaam = useCallback(async () => {
    const trimmed = newNaam.trim();
    if (!trimmed) {
      setError('Enter a name');
      return;
    }
    const exists = items.some(
      item => item.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setError('Already exists');
      return;
    }
    const next = [trimmed, ...items];
    setItems(next);
    await persistList(next);
    await AsyncStorage.setItem(STORAGE_KEYS.activeMantra, trimmed);
    setSelected(trimmed);
    setModalVisible(false);
    navigation.goBack();
  }, [items, navigation, newNaam, persistList]);

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      const active = item === selected;
      return (
        <Pressable
          onPress={() => selectItem(item)}
          style={[
            styles.card,
            {
              backgroundColor: active ? colors.primary : colors.surface,
              borderColor: active ? colors.primary : colors.border,
            },
          ]}
        >
          <View style={styles.cardRow}>
            <Text weight="semibold" color={active ? 'surface' : 'textPrimary'}>
              {item}
            </Text>
            {active ? (
              <Icon
                iconSet="MaterialIcons"
                iconName="check-circle"
                size={20}
                color={colors.surface}
              />
            ) : (
              <Icon
                iconSet="MaterialIcons"
                iconName="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            )}
          </View>
        </Pressable>
      );
    },
    [colors.border, colors.primary, colors.surface, selectItem, selected],
  );

  const keyExtractor = useCallback((item: string) => item, []);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item => item.toLowerCase().includes(q));
  }, [items, query]);

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerIcon}
        >
          <Icon
            iconSet="MaterialIcons"
            iconName="chevron-left"
            size={28}
            color={colors.textPrimary}
          />
        </Pressable>
        <Text variant="title" weight="bold">
          Select Naam
        </Text>
        <Pressable onPress={openAdd} style={styles.headerIcon}>
          <Icon
            iconSet="MaterialIcons"
            iconName="add"
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>
      </View>
    ),
    [colors.textPrimary, navigation, openAdd],
  );

  return (
    <Screen>
      {listHeader}
      <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
        <View style={styles.searchIcon}>
          <Icon
            iconSet="MaterialIcons"
            iconName="search"
            size={18}
            color={colors.textSecondary}
          />
        </View>
        <TextInput
          placeholder="Search naam..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
            <Icon
              iconSet="MaterialIcons"
              iconName="close"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <Modal transparent animationType="slide" visible={modalVisible}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalDismiss}
            onPress={() => setModalVisible(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalWrap}
          >
            <View
              style={[styles.modalCard, { backgroundColor: colors.surface }]}
            >
              <Text variant="lg" weight="bold">
                Add New Naam
              </Text>
              <TextInput
                placeholder="Enter Naam"
                value={newNaam}
                onChangeText={text => {
                  setNewNaam(text);
                  if (error) setError('');
                }}
                error={error}
              />
              <Button label="Add Naam" onPress={addNaam} />
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.modalCancel}
              >
                <Text color="textSecondary">Cancel</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBox: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 4,
    borderWidth: 0,
  },
  searchIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00000008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalWrap: {
    justifyContent: 'flex-end',
  },
  modalCard: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
  },
  modalCancel: {
    alignSelf: 'center',
    marginTop: 8,
  },
});
