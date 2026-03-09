import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

const width = Dimensions.get("window").width;

export default function App() {
  const hoy = new Date().toISOString().split("T")[0];
  const [pantalla, setPantalla] = useState("registro");
  const [registro, setRegistro] = useState({});
  const [metas, setMetas] = useState({
    proteina: 120,
    carbs: 200,
    grasas: 60
  });

  const [metaAgua, setMetaAgua] = useState(8);

  const dia = registro[hoy] || {
    proteina: 0,
    carbs: 0,
    grasas: 0,
    agua: 0
  };

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const r = await AsyncStorage.getItem("registro");
      const m = await AsyncStorage.getItem("metas");
      const a = await AsyncStorage.getItem("metaAgua");
      if (r) setRegistro(JSON.parse(r));
      if (m) setMetas(JSON.parse(m));
      if (a) setMetaAgua(JSON.parse(a));
    } catch (e) { }
  };

  const guardarRegistro = async (nuevo) => {
    setRegistro(nuevo);
    await AsyncStorage.setItem("registro", JSON.stringify(nuevo));
  };

  const guardarMetas = async (nuevo) => {
    setMetas(nuevo);
    await AsyncStorage.setItem("metas", JSON.stringify(nuevo));
  };

  const guardarAgua = async (n) => {
    setMetaAgua(n);
    await AsyncStorage.setItem("metaAgua", JSON.stringify(n));
  };

  const modificar = (campo, cambio) => {
    const nuevo = { ...registro };
    if (!nuevo[hoy]) nuevo[hoy] = { proteina: 0, carbs: 0, grasas: 0, agua: 0 };
    nuevo[hoy][campo] = Math.max(0, (nuevo[hoy][campo] || 0) + cambio);
    guardarRegistro(nuevo);
  };

  const porcentaje = (valor, meta) => {
    if (!meta) return 0;
    return Math.min(100, Math.round((valor / meta) * 100));
  };

  const datosGrafico = [
    dia.proteina || 0,
    dia.carbs || 0,
    dia.grasas || 0
  ];

  return (
    <View style={styles.container}>
      {pantalla === "registro" && (
        <ScrollView>
          <Text style={styles.titulo}>Registro Diario</Text>
          {["proteina", "carbs", "grasas", "agua"].map((campo) => {
            const valor = dia[campo] || 0;
            return (
              <View key={campo} style={styles.card}>
                <Text style={styles.label}>{campo}</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.boton} onPress={() => modificar(campo, -10)}>
                    <Text style={styles.textBoton}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.valor}>{valor}</Text>
                  <TouchableOpacity style={styles.boton} onPress={() => modificar(campo, 10)}>
                    <Text style={styles.textBoton}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {pantalla === "resumen" && (
        <ScrollView>
          <Text style={styles.titulo}>Resumen</Text>
          <LineChart
            data={{
              labels: ["Prot", "Carbs", "Grasas"],
              datasets: [{ data: datosGrafico }]
            }}
            width={width - 20}
            height={220}
            chartConfig={{
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            }}
            style={{ marginVertical: 20, borderRadius: 16 }}
          />
          <View style={{padding: 20}}>
            <Text style={styles.resumen}>Proteina {porcentaje(dia.proteina, metas.proteina)}%</Text>
            <Text style={styles.resumen}>Carbs {porcentaje(dia.carbs, metas.carbs)}%</Text>
            <Text style={styles.resumen}>Grasas {porcentaje(dia.grasas, metas.grasas)}%</Text>
            <Text style={styles.resumen}>Agua {porcentaje(dia.agua, metaAgua)}%</Text>
          </View>
        </ScrollView>
      )}

      {pantalla === "metas" && (
        <ScrollView>
          <Text style={styles.titulo}>Metas</Text>
          {Object.keys(metas).map((m) => (
            <View key={m} style={styles.card}>
              <Text style={styles.label}>{m}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.boton} onPress={() => guardarMetas({ ...metas, [m]: Math.max(0, metas[m] - 10) })}>
                  <Text style={styles.textBoton}>-</Text>
                </TouchableOpacity>
                <Text style={styles.valor}>{metas[m]}</Text>
                <TouchableOpacity style={styles.boton} onPress={() => guardarMetas({ ...metas, [m]: metas[m] + 10 })}>
                  <Text style={styles.textBoton}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.menu}>
        <TouchableOpacity onPress={() => setPantalla("registro")}><Text style={styles.menuText}>Registro</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPantalla("resumen")}><Text style={styles.menuText}>Resumen</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPantalla("metas")}><Text style={styles.menuText}>Metas</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: "#f5f5f5" },
  titulo: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  card: { backgroundColor: "#fff", padding: 20, margin: 10, borderRadius: 12 },
  label: { fontSize: 18, marginBottom: 10, textTransform: 'capitalize' },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  boton: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10, minWidth: 50, alignItems: 'center' },
  textBoton: { color: "#fff", fontSize: 20 },
  valor: { fontSize: 22 },
  menu: { flexDirection: "row", justifyContent: "space-around", padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: '#eee' },
  menuText: { fontSize: 16, fontWeight: "bold" },
  resumen: { fontSize: 18, marginBottom: 10 }
});