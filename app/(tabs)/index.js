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
  const [metas] = useState(METAS_INICIALES);
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().toISOString().split('T')[0]);
  
  const [verCalendario, setVerCalendario] = useState(false);
  const [modalDeporte, setModalDeporte] = useState(false);
  const [nombreDep, setNombreDep] = useState('');
  const [kcalDep, setKcalDep] = useState('');

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    try {
      const reg = await AsyncStorage.getItem('@nutri_v15');
      if (reg) setRegistro(JSON.parse(reg));
    } catch (e) { console.error("Error al cargar:", e); }
  };

  const guardar = async (nuevoReg) => {
    setRegistro(nuevoReg);
    try {
      await AsyncStorage.setItem('@nutri_v15', JSON.stringify(nuevoReg));
    } catch (e) { console.error("Error al guardar:", e); }
  };

  const modificarDato = (id, cambio) => {
    const n = { ...registro };
    if (!n[diaSeleccionado]) n[diaSeleccionado] = { agua: 0, deportes: [] };
    const valorActual = n[diaSeleccionado][id] || 0;
    n[diaSeleccionado][id] = Math.max(0, valorActual + cambio);
    guardar(n);
  };

  const agregarDeporte = () => {
    if (!nombreDep || !kcalDep) return;
    const n = { ...registro };
    if (!n[diaSeleccionado]) n[diaSeleccionado] = { agua: 0, deportes: [] };
    if (!n[diaSeleccionado].deportes) n[diaSeleccionado].deportes = [];
    
    n[diaSeleccionado].deportes.push({ nombre: nombreDep, kcal: kcalDep });
    setNombreDep(''); 
    setKcalDep(''); 
    setModalDeporte(false);
    guardar(n);
  };

  const datosHoy = registro[diaSeleccionado] || { agua: 0, deportes: [] };
  const kcalTotales = (datosHoy.deportes || []).reduce((acc, cur) => acc + (parseInt(cur.kcal) || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Mi Progreso</Text>
            <Text style={styles.dateText}>{diaSeleccionado}</Text>
          </View>
          <TouchableOpacity onPress={() => console.log("Config press")} style={styles.settingsBtn}>
            <Text style={{fontSize: 24}}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsCard}>
          <View>
            <Text style={styles.statsLabel}>Calorías Quemadas</Text>
            <Text style={styles.statsValue}>{kcalTotales} kcal</Text>
          </View>
          <TouchableOpacity style={styles.addDepBtn} onPress={() => setModalDeporte(true)}>
            <Text style={{color: 'white', fontWeight: 'bold'}}>+ Deporte</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.calBtn} onPress={() => setVerCalendario(!verCalendario)}>
          <Text style={styles.calBtnText}>📅 {verCalendario ? 'Cerrar Calendario' : 'Cambiar Día'}</Text>
        </TouchableOpacity>

        {verCalendario && (
          <Calendar 
            onDayPress={day => { setDiaSeleccionado(day.dateString); setVerCalendario(false); }}
            theme={{ borderRadius: 15 }}
            style={{ borderRadius: 15, marginBottom: 15 }}
          />
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pauta Diaria</Text>
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>💧 Agua (vasos)</Text>
            <View style={styles.controls}>
              <Text style={styles.countText}>{datosHoy.agua || 0}</Text>
              <TouchableOpacity onPress={() => modificarDato('agua', -1)} style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => modificarDato('agua', 1)} style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
            </View>
          </View>
          {metas.map(m => (
            <View key={m.id} style={styles.itemRow}>
              <Text style={styles.itemText}>{m.emoji} {m.nombre}</Text>
              <View style={styles.controls}>
                <Text style={styles.countText}>{datosHoy[m.id] || 0}</Text>
                <TouchableOpacity onPress={() => modificarDato(m.id, -1)} style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => modificarDato(m.id, 1)} style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {datosHoy.deportes && datosHoy.deportes.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Actividad Registrada</Text>
            {datosHoy.deportes.map((d, i) => (
              <View key={i} style={styles.depItem}><Text>🏃 {d.nombre}</Text><Text style={{fontWeight:'bold'}}>-{d.kcal} kcal</Text></View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalDeporte} animationType="fade" transparent={true}>
        <View style={styles.modalCentrado}>
          <View style={styles.modalContenido}>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15}}>Registrar Deporte</Text>
            <TextInput placeholder="¿Qué hiciste?" style={styles.input} value={nombreDep} onChangeText={setNombreDep} />
            <TextInput placeholder="Calorías aprox" style={styles.input} keyboardType="numeric" value={kcalDep} onChangeText={setKcalDep} />
            <TouchableOpacity style={styles.saveBtn} onPress={agregarDeporte}><Text style={{color:'white', fontWeight: 'bold'}}>GUARDAR</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalDeporte(false)}><Text style={{marginTop:15, color:'red'}}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 25, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: '#94a3b8', fontSize: 13 },
  dateText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  settingsBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  statsCard: { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 20, padding: 15, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  statsValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  addDepBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12 },
  content: { flex: 1, padding: 20 },
  calBtn: { backgroundColor: 'white', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  calBtnText: { color: '#3b82f6', fontWeight: 'bold' },
  sectionCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  itemText: { fontSize: 14, color: '#475569' },
  controls: { flexDirection: 'row', alignItems: 'center' },
  countText: { fontWeight: 'bold', color: '#1e293b', fontSize: 16, marginRight: 12 },
  stepBtn: { backgroundColor: '#f1f5f9', width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  modalCentrado: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContenido: { backgroundColor: 'white', margin: 30, padding: 25, borderRadius: 25, alignItems: 'center' },
  input: { backgroundColor: '#f1f5f9', width: '100%', padding: 15, borderRadius: 12, marginBottom: 12 },
  saveBtn: { backgroundColor: '#10b981', padding: 15, width: '100%', borderRadius: 12, alignItems: 'center' },
  depItem: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }
});