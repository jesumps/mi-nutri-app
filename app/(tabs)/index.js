import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as Progress from 'react-native-progress';

const ML_POR_VASO = 200;

const METAS_INICIALES = [
{ id:'proteinas',nombre:'Proteínas',emoji:'🥩',meta:8 },
{ id:'cereales',nombre:'Cereales',emoji:'🍞',meta:5 },
{ id:'grasas',nombre:'Grasas',emoji:'🥑',meta:3 },
{ id:'frutas',nombre:'Frutas',emoji:'🍎',meta:3 },
{ id:'verduras',nombre:'Verduras',emoji:'🥦',meta:4 },
{ id:'lacteos',nombre:'Lácteos',emoji:'🥛',meta:2 },
];

export default function App(){

const [registro,setRegistro]=useState({});
const [metas,setMetas]=useState(METAS_INICIALES);
const [metaVasos,setMetaVasos]=useState(10);
const [controles,setControles]=useState([]);

const hoy=new Date().toISOString().split('T')[0];
const [diaSeleccionado,setDiaSeleccionado]=useState(hoy);

const [modalConfig,setModalConfig]=useState(false);
const [modalDeporte,setModalDeporte]=useState(false);
const [modalControl,setModalControl]=useState(false);

const [verCalendario,setVerCalendario]=useState(false);

const [nombreDep,setNombreDep]=useState('');
const [kcalDep,setKcalDep]=useState('');
const [pesoInput,setPesoInput]=useState('');
const [grasaInput,setGrasaInput]=useState('');

useEffect(()=>{cargarTodo()},[])

const cargarTodo=async()=>{
try{

const reg=await AsyncStorage.getItem('@nutri_reg');
const met=await AsyncStorage.getItem('@nutri_metas');
const agua=await AsyncStorage.getItem('@nutri_meta_agua');
const con=await AsyncStorage.getItem('@nutri_controles');

if(reg) setRegistro(JSON.parse(reg))
if(met) setMetas(JSON.parse(met))
if(agua) setMetaVasos(JSON.parse(agua))
if(con) setControles(JSON.parse(con))

}catch(e){console.log(e)}
}

const guardar=async(nReg,nMet,nCon,nMetaAgua)=>{

if(nReg){
setRegistro(nReg)
await AsyncStorage.setItem('@nutri_reg',JSON.stringify(nReg))
}

if(nMet){
setMetas(nMet)
await AsyncStorage.setItem('@nutri_metas',JSON.stringify(nMet))
}

if(nCon){
setControles(nCon)
await AsyncStorage.setItem('@nutri_controles',JSON.stringify(nCon))
}

if(nMetaAgua!==undefined){
setMetaVasos(nMetaAgua)
await AsyncStorage.setItem('@nutri_meta_agua',JSON.stringify(nMetaAgua))
}

}

const modificarDato=(id,cambio)=>{
const n={...registro}

if(!n[diaSeleccionado]) n[diaSeleccionado]={agua:0,deportes:[]}

n[diaSeleccionado][id]=Math.max(0,(n[diaSeleccionado][id]||0)+cambio)

guardar(n)
}

const resetearDato=(id)=>{
const n={...registro}

if(n[diaSeleccionado]){
n[diaSeleccionado][id]=0
guardar(n)
}
}

const calcularProgresoDia=(fecha)=>{

const d=registro[fecha]||{agua:0}

const itemsOk=metas.filter(m=>(d[m.id]||0)>=m.meta).length
const aguaOk=(d.agua||0)>=metaVasos?1:0

return (itemsOk+aguaOk)/(metas.length+1)
}

const calcularAdherenciaMensual=()=>{

const mes=diaSeleccionado.substring(0,7)

const dias=Object.keys(registro).filter(f=>f.startsWith(mes))

if(dias.length===0) return 0

const suma=dias.reduce((acc,f)=>acc+calcularProgresoDia(f),0)

return (suma/dias.length)*100
}

const calcularRacha=()=>{

let racha=0
let fecha=new Date()

while(true){

const f=fecha.toISOString().split('T')[0]

if(calcularProgresoDia(f)>=1){
racha++
fecha.setDate(fecha.getDate()-1)
}else{
break
}

}

return racha
}

const generarMarcadoCalendario=()=>{

let marcado={}

Object.keys(registro).forEach(f=>{

const p=calcularProgresoDia(f)

if(p>=1) marcado[f]={marked:true,dotColor:'#10b981'}
else if(p>=0.5) marcado[f]={marked:true,dotColor:'#f59e0b'}
else marcado[f]={marked:true,dotColor:'#ef4444'}

})

marcado[diaSeleccionado]={...(marcado[diaSeleccionado]||{}),selected:true,selectedColor:'#3b82f6'}

return marcado
}

const datosHoy=registro[diaSeleccionado]||{agua:0,deportes:[]}

const adherencia=calcularAdherenciaMensual()

const racha=calcularRacha()

return(

<SafeAreaView style={styles.container}>

<Modal visible={modalConfig} animationType="slide">

<SafeAreaView style={{flex:1}}>

<ScrollView style={{padding:30}}>

<Text style={styles.modalTitle}>⚙️ Ajustes de Pauta</Text>

<Text style={styles.label}>Meta de Agua (vasos)</Text>

<TextInput
style={styles.input}
keyboardType="numeric"
value={metaVasos.toString()}
onChangeText={v=>setMetaVasos(parseInt(v)||0)}
/>

{metas.map(m=>(

<View key={m.id} style={styles.comidaFila}>

<Text>{m.emoji} {m.nombre}</Text>

<TextInput
style={styles.inputMini}
keyboardType="numeric"
value={m.meta.toString()}
onChangeText={v=>{

const nm=metas.map(x=>x.id===m.id?{...x,meta:parseInt(v)||0}:x)

setMetas(nm)

}}
/>

</View>

))}

<TouchableOpacity style={styles.btnSave}

onPress={()=>{

guardar(null,metas,null,metaVasos)

setModalConfig(false)

}}>

<Text style={{color:'#fff',fontWeight:'bold'}}>GUARDAR</Text>

</TouchableOpacity>

</ScrollView>

</SafeAreaView>

</Modal>

<LinearGradient colors={['#0f172a','#1e293b']} style={styles.header}>

<View style={styles.headerTop}>

<Text style={styles.userText}>Nutri Dashboard</Text>

<TouchableOpacity style={styles.btnIcon} onPress={()=>setModalConfig(true)}>

<Text style={{fontSize:22}}>⚙️</Text>

</TouchableOpacity>

</View>

<View style={styles.monthlyCard}>

<View>

<Text style={styles.monthlyLabel}>Adherencia mensual</Text>

<Text style={styles.monthlyValue}>{adherencia.toFixed(1)}%</Text>

<Text style={styles.monthlySub}>🔥 racha {racha} días</Text>

</View>

<Progress.Circle
size={70}
progress={adherencia/100}
color="#10ac84"
thickness={8}
borderWidth={0}
/>

</View>

</LinearGradient>

<ScrollView style={styles.content}>

<View style={styles.row}>

<TouchableOpacity style={[styles.btnAction,{backgroundColor:'#3b82f6'}]}
onPress={()=>setVerCalendario(!verCalendario)}>

<Text style={styles.btnActionText}>📅 Calendario</Text>

</TouchableOpacity>

<TouchableOpacity style={[styles.btnAction,{backgroundColor:'#8b5cf6'}]}
onPress={()=>setModalControl(true)}>

<Text style={styles.btnActionText}>⚖️ Peso</Text>

</TouchableOpacity>

</View>

{verCalendario&&(

<Calendar

style={styles.card}

onDayPress={day=>{

setDiaSeleccionado(day.dateString)

setVerCalendario(false)

}}

markedDates={generarMarcadoCalendario()}

/>

)}

<View style={styles.card}>

<Text style={styles.sectionTitle}>Día {diaSeleccionado}</Text>

<Text>💧 {datosHoy.agua*ML_POR_VASO} ml</Text>

<Progress.Bar
progress={(datosHoy.agua||0)/metaVasos}
width={null}
height={12}
color="#3b82f6"
style={{marginVertical:10}}
/>

{metas.map(m=>(

<View key={m.id} style={styles.comidaFila}>

<View style={{flexDirection:'row'}}>

<Text>{m.emoji} {m.nombre}</Text>

</View>

<View style={styles.rowInputs}>

<Text style={styles.countText}>{(datosHoy[m.id]||0)}/{m.meta}</Text>

<TouchableOpacity style={styles.btnMini} onPress={()=>modificarDato(m.id,-1)}>

<Text>-</Text>

</TouchableOpacity>

<TouchableOpacity style={styles.btnMini} onPress={()=>modificarDato(m.id,1)}>

<Text>+</Text>

</TouchableOpacity>

</View>

</View>

))}

</View>

</ScrollView>

</SafeAreaView>

)
}

const styles=StyleSheet.create({

container:{flex:1,backgroundColor:'#f8fafc'},

header:{padding:25,paddingTop:50,borderBottomLeftRadius:35,borderBottomRightRadius:35},

headerTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},

userText:{color:'white',fontSize:22,fontWeight:'bold'},

btnIcon:{backgroundColor:'rgba(255,255,255,0.2)',width:55,height:55,borderRadius:16,justifyContent:'center',alignItems:'center'},

monthlyCard:{backgroundColor:'rgba(255,255,255,0.1)',padding:20,borderRadius:25,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},

monthlyLabel:{color:'rgba(255,255,255,0.7)',fontSize:12,fontWeight:'bold'},

monthlyValue:{color:'white',fontSize:32,fontWeight:'bold'},

monthlySub:{color:'rgba(255,255,255,0.6)',fontSize:12},

content:{flex:1,padding:20},

row:{flexDirection:'row',justifyContent:'space-between',marginBottom:15},

btnAction:{flex:0.48,padding:18,borderRadius:22,alignItems:'center'},

btnActionText:{color:'white',fontWeight:'bold'},

card:{backgroundColor:'white',padding:20,borderRadius:28,marginBottom:20},

sectionTitle:{fontSize:16,fontWeight:'bold',marginBottom:12},

comidaFila:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#f1f5f9'},

rowInputs:{flexDirection:'row',alignItems:'center'},

countText:{marginRight:10,fontWeight:'bold',color:'#3b82f6'},

btnMini:{backgroundColor:'#f1f5f9',width:40,height:40,borderRadius:14,justifyContent:'center',alignItems:'center',marginLeft:8},

modalTitle:{fontSize:20,fontWeight:'bold',textAlign:'center',marginBottom:25},

input:{backgroundColor:'#f1f5f9',padding:16,borderRadius:18,marginBottom:15},

inputMini:{backgroundColor:'#f1f5f9',width:60,height:40,textAlign:'center',borderRadius:12,fontWeight:'bold'},

btnSave:{backgroundColor:'#10ac84',padding:20,borderRadius:18,alignItems:'center',marginTop:10},

label:{fontWeight:'bold',marginBottom:8,color:'#64748b'}

})