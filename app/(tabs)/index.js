import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as Progress from 'react-native-progress';

const ML_POR_VASO = 200;
const METAS_INICIALES = [
  { id: 'proteinas', nombre: 'Proteínas', emoji: '🥩', meta: 8 },
  { id: 'cereales', nombre: 'Cereales', emoji: '🍞', meta: 5 },
  { id: 'grasas', nombre: 'Grasas', emoji: '🥑', meta: 3 },
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
    const reg = await AsyncStorage.getItem('@nutri_v12');
    const met = await AsyncStorage.getItem('@nutri_metas_v12');
    const con = await AsyncStorage.getItem('@nutri_controles_v12');
    if (reg) setRegistro(JSON.parse(reg));
    if (met) setMetas(JSON.parse(met));
    if (con) setControles(JSON.parse(con));
  };

  const guardar = async (nReg, nMet, nCon) => {
    if (nReg) { setRegistro(nReg); await AsyncStorage.setItem('@nutri_v12', JSON.stringify(nReg)); }
    if (nMet) { setMetas(nMet); await AsyncStorage.setItem('@nutri_metas_v12', JSON.stringify(nMet)); }
    if (nCon) { setControles(nCon); await AsyncStorage.setItem('@nutri_controles_v12', JSON.stringify(nCon)); }
  };

  const calcularProgresoDia = (fecha) => {
    const d = registro[fecha] || { agua: 0 };
    const itemsOk = metas.filter(m => (d[m.id] || 0) >= m.meta).length;
    const aguaOk = (d.agua || 0) >= metaVasos ? 1 : 0;
    return (itemsOk + aguaOk) / (metas.length + 1);
  };

  const calcularAdherenciaMensual = () => {
    const mesActual = diaSeleccionado.substring(0, 7); // "2026-03"
    const diasConDatos = Object.keys(registro).filter(fecha => fecha.startsWith(mesActual));
    if (diasConDatos.length === 0) return 0;
    const sumaProgresos = diasConDatos.reduce((acc, fecha) => acc + calcularProgresoDia(fecha), 0);
    return (sumaProgresos / diasConDatos.length) * 100;
  };

  const modificarDato = (id, cambio) => {
    const n = { ...registro };
    if (!n[diaSeleccionado]) n[diaSeleccionado] = { agua: 0, deportes: [] };
    n[diaSeleccionado][id] = Math.max(0, (n[diaSeleccionado][id] || 0) + cambio);
    guardar(n);
  };

  const datosHoy = registro[diaSeleccionado] || { agua: 0, deportes: [] };
  const adherencia = calcularAdherenciaMensual();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.userText}>Nutri Dashboard</Text>
          <TouchableOpacity onPress={() => setModalConfig(true)} style={styles.btnIcon}><Text>⚙️</Text></TouchableOpacity>
        </View>

        {/* TARJETA DE ADHERENCIA MENSUAL */}
        <View style={styles.monthlyCard}>
          <View>
            <Text style={styles.monthlyLabel}>Adherencia Mensual</Text>
            <Text style={styles.monthlyValue}>{adherencia.toFixed(1)}%</Text>
            <Text style={styles.monthlySub}>de tu pauta lograda este mes</Text>
          </View>
          <Progress.Circle 
            size={60} 
            progress={adherencia / 100} 
            color={adherencia > 70 ? "#10ac84" : "#ff9f43"} 
            thickness={6} 
            unfilledColor="rgba(255,255,255,0.1)"
            borderWidth={0}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btnAction, {backgroundColor:'#3b82f6'}]} onPress={() => setVerCalendario(!verCalendario)}>
            <Text style={styles.btnActionText}>📅 Calendario</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAction, {backgroundColor:'#8b5cf6'}]} onPress={() => setModalControl(true)}>
            <Text style={styles.btnActionText}>⚖️ Mi Peso</Text>
          </TouchableOpacity>
        </View>

        {verCalendario && (
          <Calendar 
            style={styles.card}
            onDayPress={day => {setDiaSeleccionado(day.dateString); setVerCalendario(false);}}
            markedDates={{[diaSeleccionado]: {selected: true, selectedColor: '#3b82f6'}}}
          />
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Día: {diaSeleccionado}</Text>
          <View style={styles.infoRow}>
            <Text style={{fontWeight:'bold'}}>💧 {datosHoy.agua * ML_POR_VASO} mL</Text>
            <Text style={{fontWeight:'bold'}}>🔥 { (datosHoy.deportes || []).reduce((a,b)=>a+b.kcal,0) } kcal</Text>
          </View>
          
          <Text style={[styles.sectionTitle, {marginTop:15}]}>Deportes ⌚️</Text>
          {(datosHoy.deportes || []).map((d, i) => (
            <View key={i} style={styles.itemLista}><Text>🏃 {d.nombre}</Text><Text>{d.kcal} kcal</Text></View>
          ))}
          <TouchableOpacity style={styles.btnAdd} onPress={() => setModalDeporte(true)}>
            <Text style={{color:'#3b82f6', fontWeight:'bold', fontSize:12}}>+ AGREGAR ENTRENAMIENTO</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pauta Diaria</Text>
          <View style={styles.comidaFila}>
            <Text>💧 Agua (Vasos)</Text>
            <View style={styles.row}>
              <Text style={styles.countText}>{datosHoy.agua}/{metaVasos}</Text>
              <TouchableOpacity onPress={() => modificarDato('agua', -1)} style={styles.btnMini}><Text>-</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => modificarDato('agua', 1)} style={styles.btnMini}><Text>+</Text></TouchableOpacity>
            </View>
          </View>
          {metas.map(m => (
            <View key={m.id} style={styles.comidaFila}>
              <Text>{m.emoji} {m.nombre}</Text>
              <View style={styles.row}>
                <Text style={styles.countText}>{(datosHoy[m.id] || 0)}/{m.meta}</Text>
                <TouchableOpacity onPress={() => modificarDato(m.id, -1)} style={styles.btnMini}><Text>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => modificarDato(m.id, 1)} style={styles.btnMini}><Text>+</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, {marginBottom: 40}]}>
          <Text style={styles.sectionTitle}>Evolución Nutricionista</Text>
          {controles.map((c, i) => (
            <View key={i} style={styles.itemLista}>
              <View>
                <Text style={{fontWeight:'bold'}}>{c.fecha}</Text>
                <Text style={{fontSize:12, color:'#64748b'}}>Control #{controles.length - i}</Text>
              </View>
              <Text style={{fontWeight:'bold', color:'#3b82f6'}}>{c.peso}kg | {c.grasa}% grasa</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* MODAL DEPORTE */}
      <Modal visible={modalDeporte} animationType="fade" transparent={true}>
        <View style={styles.overlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Añadir Actividad</Text>
          <TextInput placeholder="Deporte (ej: Gym)" style={styles.input} onChangeText={setNombreDep} />
          <TextInput placeholder="Calorías del reloj" style={styles.input} keyboardType="numeric" onChangeText={setKcalDep} />
          <TouchableOpacity style={styles.btnSave} onPress={() => {
            if(!nombreDep || !kcalDep) return;
            const n = { ...registro }; if (!n[diaSeleccionado]) n[diaSeleccionado] = { agua: 0, deportes: [] };
            if (!n[diaSeleccionado].deportes) n[diaSeleccionado].deportes = [];
            n[diaSeleccionado].deportes.push({ nombre: nombreDep, kcal: parseInt(kcalDep) });
            guardar(n); setModalDeporte(false);
          }}><Text style={{color:'#fff', fontWeight:'bold'}}>REGISTRAR</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setModalDeporte(false)}><Text style={{marginTop:15, textAlign:'center', color:'red'}}>Cancelar</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {/* MODAL CONTROL PESO */}
      <Modal visible={modalControl} animationType="fade" transparent={true}>
        <View style={styles.overlay}><View style={styles.modal}>
          <Text style={styles.modalTitle}>Nuevo Pesaje</Text>
          <TextInput placeholder="Peso (kg)" style={styles.input} keyboardType="numeric" onChangeText={setPesoInput} />
          <TextInput placeholder="% Grasa" style={styles.input} keyboardType="numeric" onChangeText={setGrasaInput} />
          <TouchableOpacity style={styles.btnSave} onPress={() => {
            const nCon = [{ fecha: diaSeleccionado, peso: pesoInput, grasa: grasaInput }, ...controles];
            setControles(nCon); guardar(null, null, nCon); setModalControl(false);
          }}><Text style={{color:'#fff', fontWeight:'bold'}}>GUARDAR CONTROL</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setModalControl(false)}><Text style={{marginTop:15, textAlign:'center', color:'red'}}>Cancelar</Text></TouchableOpacity>
        </View></View>
      </Modal>

      {/* MODAL CONFIG */}
      <Modal visible={modalConfig} animationType="slide">
        <SafeAreaView style={{flex:1, padding: 30}}>
          <Text style={styles.modalTitle}>Configurar Pauta</Text>
          <Text style={styles.label}>Meta Agua (Vasos):</Text>
          <TextInput style={styles.input} keyboardType="numeric" defaultValue={metaVasos.toString()} onChangeText={v => setMetaVasos(parseInt(v)||10)} />
          {metas.map(m => (
            <View key={m.id} style={styles.comidaFila}>
              <Text>{m.nombre}</Text>
              <TextInput style={styles.inputMini} keyboardType="numeric" defaultValue={m.meta.toString()} onChangeText={v => {
                const nm = metas.map(x => x.id===m.id ? {...x, meta: parseInt(v)||0} : x); setMetas(nm);
              }} />
            </View>
          ))}
          <TouchableOpacity style={styles.btnSave} onPress={() => {guardar(null, metas); setModalConfig(false);}}><Text style={{color:'#fff', fontWeight:'bold'}}>LISTO</Text></TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 25, paddingTop: 50, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  btnIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  monthlyCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthlyLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold' },
  monthlyValue: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  monthlySub: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  content: { flex: 1, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  btnAction: { flex: 0.48, padding: 16, borderRadius: 20, alignItems: 'center', elevation: 2 },
  btnActionText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 25, marginBottom: 20, elevation: 4 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f1f5f9', padding: 15, borderRadius: 15 },
  itemLista: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  btnAdd: { marginTop: 15, alignItems: 'center', padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 15 },
  comidaFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  countText: { marginRight: 10, fontWeight: 'bold', color: '#3b82f6' },
  btnMini: { backgroundColor: '#f1f5f9', width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: 'white', width: '85%', padding: 30, borderRadius: 30 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 15, marginBottom: 15 },
  inputMini: { backgroundColor: '#f1f5f9', width: 55, textAlign: 'center', borderRadius: 10, fontWeight: 'bold' },
  btnSave: { backgroundColor: '#10ac84', padding: 18, borderRadius: 15, alignItems: 'center' },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#64748b' }
});