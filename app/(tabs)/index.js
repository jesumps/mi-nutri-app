import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';

const METAS_INICIALES = [
  { id: 'proteinas', nombre: 'Proteínas', emoji: '🥩', meta: 8 },
  { id: 'cereales', nombre: 'Cereales', emoji: '🍞', meta: 5 },
  { id: 'grasas', nombre: 'Grasas', emoji: '🥑', meta: 3 },
  { id: 'frutas', nombre: 'Frutas', emoji: '🍎', meta: 3 },
  { id: 'verduras', nombre: 'Verduras', emoji: '🥦', meta: 4 },
  { id: 'lacteos', nombre: 'Lácteos', emoji: '🥛', meta: 2 },
];

export default function App() {
  const [registro, setRegistro] = useState({});
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().toISOString().split('T')[0]);
  const [verCalendario, setVerCalendario] = useState(false);
  const [modalDeporte, setModalDeporte] = useState(false);
  const [nombreDep, setNombreDep] = useState('');
  const [kcalDep, setKcalDep] = useState('');

  useEffect(() => { 
    cargarTodo(); 
  }, []);

  const cargarTodo = async () => {
    try {
      const reg = await AsyncStorage.getItem('@nutri_v20');
      if (reg) setRegistro(JSON.parse(reg));
    } catch (e) { console.log(e); }
  };

  const guardar = async (nuevoReg) => {
    setRegistro(nuevoReg);
    await AsyncStorage.setItem('@nutri_v20', JSON.stringify(nuevoReg));
  };

  const modificarDato = (id, cambio) => {
    const n = { ...registro };
    if (!n[diaSeleccionado]) n[diaSeleccionado] = { agua: 0, deportes: [] };
    const actual = n[diaSeleccionado][id] || 0;
    n[diaSeleccionado][id] = Math.max(0, actual + cambio);
    guardar(n);
  };

  const agregarDeporte = () => {
    if (!nombreDep || !kcalDep) return;
    const n = { ...registro };
    if (!n[diaSeleccionado]) n[diaSeleccionado] = { agua: 0, deportes: [] };
    if (!n[diaSeleccionado].deportes) n[diaSeleccionado].deportes = [];
    n[diaSeleccionado].deportes.push({ nombre: nombreDep, kcal: kcalDep });
    setNombreDep(''); setKcalDep(''); setModalDeporte(false);
    guardar(n);
  };

  const datosHoy = registro[diaSeleccionado] || { agua: 0, deportes: [] };
  const kcalTotales = (datosHoy.deportes || []).reduce((acc, cur) => acc + (parseInt(cur.kcal) || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.dateText}>📅 {diaSeleccionado}</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setVerCalendario(!verCalendario)}>
            <Text style={{color:'white'}}>Cambiar Fecha</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsCard}>
          <View>
            <Text style={styles.statsLabel}>QUEMADAS HOY</Text>
            <Text style={styles.statsValue}>{kcalTotales} kcal</Text>
          </View>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.addDepBtn} 
            onPress={() => setModalDeporte(true)}
          >
            <Text style={{color: 'white', fontWeight: 'bold'}}>+ DEPORTE</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {verCalendario && (
          <Calendar 
            onDayPress={day => { setDiaSeleccionado(day.dateString); setVerCalendario(false); }}
            style={styles.calendar}
          />
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mi Pauta</Text>
          <View style={styles.itemRow}>
            <Text>💧 Agua (vasos)</Text>
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => modificarDato('agua', -1)} style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
              <Text style={styles.countText}>{datosHoy.agua || 0}</Text>
              <TouchableOpacity onPress={() => modificarDato('agua', 1)} style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
            </View>
          </View>

          {METAS_INICIALES.map(m => (
            <View key={m.id} style={styles.itemRow}>
              <Text>{m.emoji} {m.nombre}</Text>
              <View style={styles.controls}>
                <TouchableOpacity onPress={() => modificarDato(m.id, -1)} style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
                <Text style={styles.countText}>{datosHoy[m.id] || 0}</Text>
                <TouchableOpacity onPress={() => modificarDato(m.id, 1)} style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalDeporte} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Deporte</Text>
            <TextInput placeholder="Actividad" style={styles.input} value={nombreDep} onChangeText={setNombreDep} />
            <TextInput placeholder="Calorías" keyboardType="numeric" style={styles.input} value={kcalDep} onChangeText={setKcalDep} />
            <TouchableOpacity style={styles.btnSave} onPress={agregarDeporte}><Text style={{color:'white'}}>Guardar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalDeporte(false)}><Text style={{color:'red', marginTop: 15}}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 20, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  settingsBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 10 },
  statsCard: { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 20, padding: 15, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  statsValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  addDepBtn: { backgroundColor: '#8b5cf6', padding: 12, borderRadius: 12, elevation: 5 },
  content: { flex: 1, padding: 20 },
  calendar: { borderRadius: 15, marginBottom: 15, elevation: 4 },
  sectionCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowOpacity: 0.1, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  controls: { flexDirection: 'row', alignItems: 'center' },
  countText: { fontWeight: 'bold', width: 30, textAlign: 'center' },
  stepBtn: { backgroundColor: '#e2e8f0', width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' },
  modalContent: { backgroundColor: 'white', margin: 30, padding: 25, borderRadius: 25, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#f1f5f9', width: '100%', padding: 15, borderRadius: 12, marginBottom: 10 },
  btnSave: { backgroundColor: '#10b981', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' }
});