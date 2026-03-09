import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as Progress from 'react-native-progress';

const ML_POR_VASO = 200;
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
  const [controles, setControles] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().toISOString().split('T')[0]);
  
  const [verCalendario, setVerCalendario] = useState(false);
  const [modalDeporte, setModalDeporte] = useState(false);
  const [modalControl, setModalControl] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);

  const [nombreDep, setNombreDep] = useState('');
  const [kcalDep, setKcalDep] = useState('');
  const [pesoInput, setPesoInput] = useState('');
  const [grasaInput, setGrasaInput] = useState('');

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    try {
      const reg = await AsyncStorage.getItem('@nutri_v15');
      const met = await AsyncStorage.getItem('@nutri_metas_v15');
      const con = await AsyncStorage.getItem('@nutri_controles_v15');
      if (reg) setRegistro(JSON.parse(reg));
      if (met) setMetas(JSON.parse(met));
      if (con) setControles(JSON.parse(con));
    } catch (e) { console.log("Error de carga", e); }
  };

  const guardarTodo = async (nReg, nMet, nCon) => {
    try {
      if (nReg) { setRegistro(nReg); await AsyncStorage.setItem('@nutri_v15', JSON.stringify(nReg)); }
      if (nMet) { setMetas(nMet); await AsyncStorage.setItem('@nutri_metas_v15', JSON.stringify(nMet)); }
      if (nCon) { setControles(nCon); await AsyncStorage.setItem('@nutri_controles_v15', JSON.stringify(nCon)); }
    } catch (e) { console.log("Error al guardar", e); }
  };

  const modificarDato = (id, cambio) => {
    const nuevoRegistro = { ...registro };
    if (!nuevoRegistro[diaSeleccionado]) nuevoRegistro[diaSeleccionado] = { agua: 0, deportes: [] };
    nuevoRegistro[diaSeleccionado][id] = Math.max(0, (nuevoRegistro[diaSeleccionado][id] || 0) + cambio);
    guardarTodo(nuevoRegistro);
  };

  const datosHoy = registro[diaSeleccionado] || { agua: 0, deportes: [] };

  const calcularAdherencia = () => {
    const mes = diaSeleccionado.substring(0, 7);
    const dias = Object.keys(registro).filter(f => f.startsWith(mes));
    if (dias.length === 0) return 0;
    const suma = dias.reduce((acc, f) => {
      const d = registro[f];
      const itemsOk = metas.filter(m => (d[m.id] || 0) >= m.meta).length;
      const aguaOk = (d.agua || 0) >= metaVasos ? 1 : 0;
      return acc + (itemsOk + aguaOk) / (metas.length + 1);
    }, 0);
    return (suma / dias.length) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        
        {/* CABECERA PREMIUM */}
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.welcomeText}>Mi Progreso</Text>
              <Text style={styles.dateText}>{diaSeleccionado}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setModalConfig(true)} 
              style={styles.settingsBtn}
              activeOpacity={0.7}
            >
              <Text style={{fontSize: 24}}>⚙️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <View>
              <Text style={styles.statsLabel}>Adherencia Mensual</Text>
              <Text style={styles.statsValue}>{calcularAdherencia().toFixed(1)}%</Text>
            </View>
            <Progress.Circle 
              size={60} 
              progress={calcularAdherencia()/100} 
              color="#10b981" 
              unfilledColor="rgba(255,255,255,0.1)" 
              borderWidth={0} 
              thickness={6}
            />
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          
          {/* ACCIONES RÁPIDAS */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.mainBtn, {backgroundColor: '#3b82f6'}]} onPress={() => setVerCalendario(!verCalendario)}>
              <Text style={styles.mainBtnText}>📅 Calendario</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mainBtn, {backgroundColor: '#8b5cf6'}]} onPress={() => setModalControl(true)}>
              <Text style={styles.mainBtnText}>⚖️ Nuevo Peso</Text>
            </TouchableOpacity>
          </View>

          {verCalendario && (
            <Calendar 
              onDayPress={day => {setDiaSeleccionado(day.dateString); setVerCalendario(false);}}
              markedDates={{[diaSeleccionado]: {selected: true, selectedColor: '#3b82f6'}}}
              theme={{ borderRadius: 20, calendarBackground: '#ffffff' }}
              style={styles.calendarCard}
            />
          )}

          {/* CONTENIDO DIARIO */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Consumo de Hoy</Text>
            
            {/* Fila Agua */}
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <TouchableOpacity onPress={() => {
                  const n = {...registro}; n[diaSeleccionado].agua = 0; guardarTodo(n);
                }}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
                <Text style={styles.itemText}>💧 Agua (Vasos)</Text>
              </View>
              <View style={styles.controls}>
                <Text style={styles.countText}>{datosHoy.agua}/{metaVasos}</Text>
                <TouchableOpacity onPress={() => modificarDato('agua', -1)} style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => modificarDato('agua', 1)} style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
              </View>
            </View>

            {/* Metas Dinámicas */}
            {metas.map(m => (
              <View key={m.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <TouchableOpacity onPress={() => {
                    const n = {...registro}; n[diaSeleccionado][m.id] = 0; guardarTodo(n);
                  }}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                  <Text style={styles.itemText}>{m.emoji} {m.nombre}</Text>
                </View>
                <View style={styles.controls}>
                  <Text style={styles.countText}>{datosHoy[m.id] || 0}/{m.meta}</Text>
                  <TouchableOpacity onPress={() => modificarDato(m.id, -1)} style={styles.stepBtn}><Text>-</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => modificarDato(m.id, 1)} style={styles.stepBtn}><Text>+</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* DEPORTES */}
          <View style={styles.sectionCard}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Actividad Física</Text>
              <TouchableOpacity onPress={() => setModalDeporte(true)}>
                <Text style={styles.addText}>+ Añadir</Text>
              </TouchableOpacity>
            </View>
            {(datosHoy.deportes || []).map((d, i) => (
              <View key={i} style={styles.logRow}>
                <Text>🏃 {d.nombre}</Text>
                <Text style={{fontWeight:'bold'}}>{d.kcal} kcal</Text>
              </View>
            ))}
          </View>
          
          <View style={{height: 50}} />
        </ScrollView>

        {/* MODAL CONFIGURACIÓN (EL QUE FALLABA) */}
        <Modal visible={modalConfig} animationType="pageSheet" presentationStyle="pageSheet">
          <SafeAreaView style={{flex:1, backgroundColor: '#f8fafc'}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Ajustar Metas Diarias</Text>
              <Text style={styles.inputLabel}>Vasos de Agua:</Text>
              <TextInput 
                style={styles.modalInput} 
                keyboardType="numeric" 
                defaultValue={metaVasos.toString()} 
                onChangeText={v => setMetaVasos(parseInt(v)||0)}
              />
              {metas.map(m => (
                <View key={m.id} style={styles.configRow}>
                  <Text>{m.emoji} {m.nombre}</Text>
                  <TextInput 
                    style={styles.miniInput} 
                    keyboardType="numeric" 
                    defaultValue={m.meta.toString()}
                    onChangeText={v => {
                      const newMetas = metas.map(x => x.id === m.id ? {...x, meta: parseInt(v)||0} : x);
                      setMetas(newMetas);
                    }}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.saveBtn} onPress={() => {guardarTodo(null, metas); setModalConfig(false);}}>
                <Text style={styles.saveBtnText}>GUARDAR CAMBIOS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalConfig(false)}>
                <Text style={styles.cancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* MODAL PESO DECIMAL */}
        <Modal visible={modalControl} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.alertBox}>
              <Text style={styles.modalHeader}>Registro de Peso</Text>
              <TextInput 
                placeholder="Peso (ej: 75.4)" 
                style={styles.modalInput} 
                keyboardType="decimal-pad" 
                onChangeText={v => setPesoInput(v.replace(',', '.'))}
              />
              <TextInput 
                placeholder="% Grasa" 
                style={styles.modalInput} 
                keyboardType="decimal-pad" 
                onChangeText={v => setGrasaInput(v.replace(',', '.'))}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={() => {
                const nCon = [{ fecha: diaSeleccionado, peso: pesoInput, grasa: grasaInput }, ...controles];
                setControles(nCon); guardarTodo(null, null, nCon); setModalControl(false);
              }}>
                <Text style={styles.saveBtnText}>REGISTRAR</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalControl(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 25, paddingTop: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  dateText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  settingsBtn: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 15 },
  statsCard: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    marginTop: 20, padding: 20, 
    borderRadius: 20, flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center' 
  },
  statsLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  statsValue: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  mainBtn: { flex: 0.48, padding: 16, borderRadius: 18, alignItems: 'center', shadowOpacity: 0.1 },
  mainBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  calendarCard: { borderRadius: 20, padding: 10, marginBottom: 20, elevation: 4 },
  sectionCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemInfo: { flexDirection: 'row', alignItems: 'center' },
  deleteIcon: { marginRight: 10, fontSize: 16 },
  itemText: { fontSize: 15, color: '#334155' },
  controls: { flexDirection: 'row', alignItems: 'center' },
  countText: { fontWeight: 'bold', color: '#3b82f6', marginRight: 10, fontSize: 16 },
  stepBtn: { backgroundColor: '#f1f5f9', width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  addText: { color: '#3b82f6', fontWeight: 'bold' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: 'white', width: '85%', padding: 25, borderRadius: 30 },
  modalContent: { padding: 30 },
  modalHeader: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalInput: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 15, marginBottom: 15, fontSize: 16 },
  inputLabel: { fontWeight: 'bold', marginBottom: 10, color: '#64748b' },
  configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  miniInput: { backgroundColor: '#f1f5f9', width: 60, padding: 10, borderRadius: 10, textAlign: 'center', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelText: { textAlign: 'center', color: '#ef4444', marginTop: 20, fontWeight: '600' }
});