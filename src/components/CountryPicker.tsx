import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { countries, Country } from '../constants/countries';

const { height } = Dimensions.get('window');

interface CountryPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({ visible, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  console.log('CountryPicker rendered, visible:', visible, 'Countries count:', countries.length);

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const lowerSearch = search.toLowerCase();
    return countries.filter((c) => {
      // Search by name
      if (c.name.toLowerCase().includes(lowerSearch)) return true;
      // Search by dial code (e.g. +91 or 91)
      if (c.dialCode.includes(search) || c.dialCode.replace('+', '').includes(search)) return true;
      // Search by country code (e.g. US)
      if (c.code.toLowerCase().includes(lowerSearch)) return true;
      return false;
    });
  }, [search]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.modalBg}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Select Country</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, code, or +number"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialIcons name="cancel" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            style={{ flex: 1 }}
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => {
                  onSelect(item);
                  onClose();
                  setSearch('');
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.dialCode}>{item.dialCode}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 24,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  dialCode: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
});
