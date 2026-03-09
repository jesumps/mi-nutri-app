import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [dieta, setDieta] = useState({
    Proteínas: 0, Carbohidratos: 0, Grasas: 0, Frutas: 0, Vegetales: 0
  });
  const [inputValores, setInputValores] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const guardado = await AsyncStorage.getItem('@mi_dieta');
      if (guardado !== null) setDieta(JSON.parse(guardado));
    } catch (e) { console.log(e); }
  };

  const guardarDato = async (categoria) => {
    const valor = parseFloat(inputValores[categoria]?.replace(',', '.')) || 0;
    const nuevaDieta = { ...dieta, [categoria]: dieta[categoria] + valor };
    setDieta(nuevaDieta);
    await AsyncStorage.setItem('@mi_dieta', JSON.stringify(nuevaDieta));
    setInputValores({ ...inputValores, [categoria]: '' });
  };

  const resetearCategoria = async (categoria) => {
    const nuevaDieta = { ...dieta, [categoria]: 0 };
    setDieta(nuevaDieta);
    await AsyncStorage.setItem('@mi_dieta', JSON.stringify(nuevaDieta));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.titulo}>Mi Nutri App 🍎</Text>
          
          {Object.keys(dieta).map((cat) => (
            <View key={cat} style={styles.card}>
              <View style={styles.headerCard}>
                <Text style={styles.catNombre}>{cat}</Text>
                <TouchableOpacity onPress={() => resetearCategoria(cat)}>
                  <Text style={styles.btnReset}>✕ Borrar</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.totalText}>Total: <Text style={styles.numero}>{dieta[cat]}</Text></Text>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 1.5"
                  keyboardType="decimal-pad"
                  value={inputValores[cat] || ''}
                  onChangeText={(txt) => setInputValores({ ...inputValores, [cat]: txt })}
                />
                <TouchableOpacity style={styles.btnSumar} onPress={() => guardarDato(cat)}>
                  <Text style={styles.btnText}>+ Añadir</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { padding: 20 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#2D3436', marginBottom: 25, textAlign: 'center' },
  card: { 
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 
  },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catNombre: { fontSize: 18, fontWeight: '600', color: '#636E72' },
  btnReset: { color: '#FF7675', fontWeight: 'bold', fontSize: 12 },
  totalText: { fontSize: 22, color: '#2D3436', marginBottom: 15 },
  numero: { fontWeight: 'bold', color: '#00B894' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { 
    flex: 1, backgroundColor: '#F1F2F6', borderRadius: 12, paddingHorizontal: 15, height: 45, fontSize: 16 
  },
  btnSumar: { backgroundColor: '#00B894', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});