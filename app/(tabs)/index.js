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
  const [metas, setMetas] = useState(METAS_INICIALES);
  const [metaVasos, setMetaVasos] = useState(10);
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().toISOString().split('T')[0]);
  
  const [verCalendario, setVerCalendario] = useState(false);
  const [modalDeporte, setModalDeporte] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);

  const [nombreDep, setNombreDep] = useState('');
  const [kcalDep, setKcalDep] = useState('');

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    try {
      const reg = await AsyncStorage.getItem('@nutri_data_v13');
      if (reg) setRegistro(JSON.parse(reg));
    } catch (e) { console.log(e); }
  };

  const guardar = async (nuevoReg) => {
    setRegistro(nuevoReg);
    await AsyncStorage.setItem('@nutri_data_v13', JSON.stringify(nuevoReg));
  };

  const modificarDato = (id, cambio) => {
    const n = { ...registro };
    if (!n[diaSeleccionado]) n[diaSeleccionado] = { agua: 0, deportes: [] };
    n[diaSeleccionado][id] = Math.max(0, (n[diaSeleccionado][id] || 0) + cambio);
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
  const kcalTotales = (datosHoy.deportes || []).reduce((acc, cur) => acc + parseInt(cur.kcal || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Nutri Dashboard</Text>
            <Text style={styles.dateText}>{diaSeleccionado}</Text>
          </View>
          <TouchableOpacity onPress={() => setModalConfig(true)} style={styles.settingsBtn}>
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
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.mainBtn, {backgroundColor: '#3b82f6'}]} onPress={() => setVerCalendario(!verCalendario)}>
            <Text style={styles.mainBtnText}>📅 Calendario</Text>
          </TouchableOpacity>
        </View>

        {verCalendario && (
          <Calendar 
            onDayPress={day => {setDiaSeleccionado(day.dateString); setVerCalendario(false);}}
            style={styles.calendarCard}
          />
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pauta Diaria</Text>
          {/* Agua */}
          <View style={styles.itemRow}>
            <Text style={styles.itemText}>💧 Agua</Text>
            <View style={styles.controls}>
              <Text style={styles.countText}>{datosHoy.agua || 0}/{metaVasos}</Text>
              <TouchableOpacity onPress={() => modificarDato('agua', -1)} style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => modificarDato('agua', 1)} style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
            </View>
          </View>
          {/* Comidas */}
          {metas.map(m => (
            <View key={m.id} style={styles.itemRow}>
              <Text style={styles.itemText}>{m.emoji} {m.nombre}</Text>
              <View style={styles.controls}>
                <Text style={styles.countText}>{(datosHoy[m.id] || 0)}/{m.meta}</Text>
                <TouchableOpacity onPress={() => modificarDato(m.id, -1)} style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => modificarDato(m.id, 1)} style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Lista de Deportes */}
        {datosHoy.deportes && datosHoy.deportes.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Actividad Física</Text>
            {datosHoy.deportes.map((d, idx) => (
              <View key={idx} style={styles.depItem}><Text>🏃 {d.nombre}</Text><Text style={{fontWeight:'bold'}}>-{d.kcal} kcal</Text></View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL DEPORTE */}
      <Modal visible={modalDeporte} animationType="slide" transparent={true}>
        <View style={styles.modalCentrado}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalHeader}>Registrar Deporte</Text>
            <TextInput placeholder="Ej: Running" style={styles.input} value={nombreDep} onChangeText={setNombreDep} />
            <TextInput placeholder="Calorías" style={styles.input} keyboardType="numeric" value={kcalDep} onChangeText={setKcalDep} />
            <TouchableOpacity style={styles.saveBtn} onPress={agregarDeporte}><Text style={{color:'white'}}>Agregar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalDeporte(false)}><Text style={{marginTop:15, color:'red'}}>Cerrar</Text></TouchableOpacity>
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
  welcomeText: { color: '#94a3b8', fontSize: 14 },
  dateText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  settingsBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  statsCard: { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 20, padding: 15, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  statsValue: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  addDepBtn: { backgroundColor: '#8b5cf6', padding: 10, borderRadius: 10 },
  content: { flex: 1, padding: 20 },
  actionRow: { marginBottom: 15 },
  mainBtn: { padding: 15, borderRadius: 15, alignItems: 'center' },
  mainBtnText: { color: 'white', fontWeight: 'bold' },
  sectionCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemText: { fontSize: 15, color: '#334155' },
  controls: { flexDirection: 'row', alignItems: 'center' },
  countText: { fontWeight: 'bold', color: '#3b82f6', marginRight: 10 },
  stepBtn: { backgroundColor: '#f1f5f9', width: 35, height: 35, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  modalCentrado: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContenido: { backgroundColor: 'white', margin: 30, padding: 30, borderRadius: 25, alignItems: 'center' },
  input: { backgroundColor: '#f1f5f9', width: '100%', padding: 15, borderRadius: 10, marginBottom: 10 },
  saveBtn: { backgroundColor: '#10b981', padding: 15, width: '100%', borderRadius: 10, alignItems: 'center' },
  depItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }
});