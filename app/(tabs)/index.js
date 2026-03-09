import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Dimensions, Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export default function App() {
  const hoy = new Date().toISOString().split('T')[0];
  const [pantalla, setPantalla] = useState('registro');
  
  // Estados principales
  const [registro, setRegistro] = useState({});
  const [metas, setMetas] = useState({
    proteinas: 10, cereales: 8, grasas: 4, frutas: 4, verduras: 4, lacteos: 3, agua: 10
  });
  const [historialPeso, setHistorialPeso] = useState([]);
  const [nuevoPeso, setNuevoPeso] = useState('');

  // Cargar datos al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const r = await AsyncStorage.getItem('@nutri_reg_v1');
        const m = await AsyncStorage.getItem('@nutri_metas_v1');
        const p = await AsyncStorage.getItem('@nutri_peso_v1');
        if (r) setRegistro(JSON.parse(r));
        if (m) setMetas(JSON.parse(m));
        if (p) setHistorialPeso(JSON.parse(p));
      } catch (e) { console.log(e); }
    };
    cargarDatos();
  }, []);

  const guardar = async (clave, valor) => {
    await AsyncStorage.setItem(clave, JSON.stringify(valor));
  };

  // Lógica de Registro
  const modRegistro = (id, cambio) => {
    const n = { ...registro };
    if (!n[hoy]) n[hoy] = { proteinas: 0, cereales: 0, grasas: 0, frutas: 0, verduras: 0, lacteos: 0, agua: 0 };
    n[hoy][id] = Math.max(0, (n[hoy][id] || 0) + cambio);
    setRegistro(n);
    guardar('@nutri_reg_v1', n);
  };

  // Lógica de Metas
  const modMeta = (id, cambio) => {
    const n = { ...metas, [id]: Math.max(1, metas[id] + cambio) };
    setMetas(n);
    guardar('@nutri_metas_v1', n);
  };

  // Lógica de Peso
  const agregarPeso = () => {
    if (!nuevoPeso) return;
    const n = [{ fecha: hoy, valor: nuevoPeso }, ...historialPeso].slice(0, 10);
    setHistorialPeso(n);
    setNuevoPeso('');
    guardar('@nutri_peso_v1', n);
  };

  const datosHoy = registro[hoy] || { proteinas: 0, cereales: 0, grasas: 0, frutas: 0, verduras: 0, lacteos: 0, agua: 0 };

  // Renderizado de Pantallas
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4f46e5', '#3730a3']} style={styles.header}>
        <Text style={styles.headerTitle}>NutriApp 2026</Text>
        <Text style={styles.headerDate}>{hoy}</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {pantalla === 'registro' && (
          <View>
            <Text style={styles.sectionTitle}>Mi Consumo de Hoy</Text>
            {Object.keys(metas).map(id => (
              <View key={id} style={styles.card}>
                <Text style={styles.cardLabel}>{id.toUpperCase()}</Text>
                <View style={styles.row}>
                  <TouchableOpacity onPress={() => modRegistro(id, -1)} style={styles.btnMod}><Text style={styles.btnText}>-</Text></TouchableOpacity>
                  <Text style={styles.valText}>{datosHoy[id] || 0} / {metas[id]}</Text>
                  <TouchableOpacity onPress={() => modRegistro(id, 1)} style={styles.btnMod}><Text style={styles.btnText}>+</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {pantalla === 'resumen' && (
          <View>
            <Text style={styles.sectionTitle}>Análisis del Día</Text>
            <PieChart
              data={[
                { name: 'Prot', population: datosHoy.proteinas, color: '#f87171', legendFontColor: '#7f7f7f' },
                { name: 'Cer', population: datosHoy.cereales, color: '#fbbf24', legendFontColor: '#7f7f7f' },
                { name: 'Gra', population: datosHoy.grasas, color: '#34d399', legendFontColor: '#7f7f7f' },
              ]}
              width={screenWidth - 40} height={200}
              chartConfig={{ color: (opacity = 1) => `rgba(0,0,0, ${opacity})` }}
              accessor={"population"} backgroundColor={"transparent"} paddingLeft={"15"}
            />
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Historial de Peso</Text>
              <View style={styles.row}>
                <TextInput placeholder="Ej: 75.5" keyboardType="numeric" style={styles.input} value={nuevoPeso} onChangeText={setNuevoPeso} />
                <TouchableOpacity onPress={agregarPeso} style={styles.btnSave}><Text style={{color:'white'}}>Anotar</Text></TouchableOpacity>
              </View>
              {historialPeso.map((p, i) => (
                <Text key={i} style={styles.pesoItem}>{p.fecha}: {p.valor} kg</Text>
              ))}
            </View>
          </View>
        )}

        {pantalla === 'metas' && (
          <View>
            <Text style={styles.sectionTitle}>Configurar mis Objetivos</Text>
            {Object.keys(metas).map(id => (
              <View key={id} style={styles.card}>
                <Text style={styles.cardLabel}>META {id.toUpperCase()}</Text>
                <View style={styles.row}>
                  <TouchableOpacity onPress={() => modMeta(id, -1)} style={[styles.btnMod, {backgroundColor:'#64748b'}]}><Text style={styles.btnText}>-</Text></TouchableOpacity>
                  <Text style={styles.valText}>{metas[id]}</Text>
                  <TouchableOpacity onPress={() => modMeta(id, 1)} style={[styles.btnMod, {backgroundColor:'#64748b'}]}><Text style={styles.btnText}>+</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Menú Inferior */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setPantalla('registro')} style={styles.navItem}><Text style={{color: pantalla === 'registro' ? '#4f46e5' : '#94a3b8'}}>📋 Registro</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPantalla('resumen')} style={styles.navItem}><Text style={{color: pantalla === 'resumen' ? '#4f46e5' : '#94a3b8'}}>📊 Resumen</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPantalla('metas')} style={styles.navItem}><Text style={{color: pantalla === 'metas' ? '#4f46e5' : '#94a3b8'}}>🎯 Metas</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 25, paddingTop: Platform.OS === 'ios' ? 20 : 50, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerDate: { color: 'white', opacity: 0.8 },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1e293b' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  cardLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnMod: { backgroundColor: '#4f46e5', width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  valText: { fontSize: 18, fontWeight: 'bold' },
  navbar: { flexDirection: 'row', height: 70, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e2e8f0', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center' },
  input: { borderBottomWidth: 1, borderBottomColor: '#cbd5e1', width: '60%', padding: 5 },
  btnSave: { backgroundColor: '#10b981', padding: 10, borderRadius: 10 },
  pesoItem: { marginTop: 5, color: '#475569' }
});