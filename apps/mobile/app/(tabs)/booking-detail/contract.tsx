import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, I18nManager, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { colors, spacing, fontSize, borderRadius, fontWeight } from "../../../src/theme";
import { useOtp } from "../../../src/hooks/useOtp";
const CT="Lorem ipsum.";
export default function ContractScreen(){
ABC
const {id}=useLocalSearchParams();
const {t}=useTranslation();
const router=useRouter();
const insets=useSafeAreaInsets();
const isRTL=I18nManager.isRTL;
const {signContract,isLoading}=useOtp();
const [agreed,setAgreed]=useState(false);
const [signed,setSigned]=useState(false);
const [signedAt,setSignedAt]=useState(null);
const handleBack=()=>router.back();

const handleSign=async()=>{
  if(!id||!agreed) return;
  try{
    const result=await signContract(id);
    if(result.success){
      setSigned(true);
      setSignedAt(result.signedAt||new Date().toISOString());
      Alert.alert(t("common.success"),t("contract.contractSigned"),[
        {text:t("common.done"),onPress:()=>router.push({pathname:"/(tabs)/booking-detail/otp-display",params:{id}})},
      ]);
    }
  }catch(err){
    Alert.alert(t("common.error"),err instanceof Error?err.message:t("common.unknownError"));
  }
};

if(signed&&signedAt){
  return(
    <View style={[styles.container,{paddingTop:insets.top}]}>
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>{"✓"}</Text>
        <Text style={styles.successText}>{t("contract.contractSigned")}</Text>
        <Text style={styles.signedTime}>{t("contract.signedAt",{date:new Date(signedAt).toLocaleString()})}</Text>
      </View>
    </View>
  );
}

return(
  <View style={styles.container}>
    <View style={[styles.header,{paddingTop:insets.top+spacing.sm}]}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Text style={styles.backText}>{isRTL?"→":"←"}</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle,{textAlign:isRTL?"right":"left"}]}>{t("contract.title")}</Text>
      <View style={styles.headerSpacer}/>
    </View>
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.contractTextStyle}>{CONTRACT_TEXT}</Text>
      </View>
      <TouchableOpacity style={styles.checkboxRow} onPress={()=>setAgreed(!agreed)}>
        <View style={[styles.checkbox,agreed&&styles.checkboxChecked]}>
          {agreed&&<Text style={styles.checkmark}>{"✓"}</Text>}
        </View>
        <Text style={styles.checkboxLabel}>{t("contract.agreementText")}</Text>
      </TouchableOpacity>
      <View style={{height:100}}/>
    </ScrollView>
    <View style={[styles.bottomBar,{paddingBottom:insets.bottom+spacing.sm}]}>
      <TouchableOpacity style={[styles.signButton,!agreed&&styles.signButtonDisabled]} onPress={handleSign} disabled={!agreed||isLoading}>
        <Text style={styles.signButtonText}>{isLoading?t("common.loading"):t("contract.signContract")}</Text>
      </TouchableOpacity>
    </View>
  </View>
);
}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:colors.gray[50]},
  header:{flexDirection:"row",alignItems:"center",paddingHorizontal:spacing.lg,paddingBottom:spacing.md,backgroundColor:colors.white,borderBottomWidth:1,borderBottomColor:colors.gray[100]},
  backButton:{width:40,height:40,alignItems:"center",justifyContent:"center"},
  backText:{fontSize:22,color:colors.gray[800],fontWeight:fontWeight.bold},
  headerTitle:{flex:1,fontSize:fontSize.lg,fontWeight:fontWeight.bold,color:colors.gray[900],marginHorizontal:spacing.sm},
  headerSpacer:{width:40},
  scrollView:{flex:1},
  scrollContent:{paddingHorizontal:spacing.lg,paddingTop:spacing.lg},
  card:{backgroundColor:colors.white,borderRadius:borderRadius.lg,padding:spacing.md,marginBottom:spacing.md,borderWidth:1,borderColor:colors.gray[100]},
  contractTextStyle:{fontSize:fontSize.sm,color:colors.gray[700],lineHeight:22},
  checkboxRow:{flexDirection:"row",alignItems:"center",paddingHorizontal:spacing.sm,marginTop:spacing.md},
  checkbox:{width:24,height:24,borderWidth:2,borderColor:colors.gray[300],borderRadius:borderRadius.sm,alignItems:"center",justifyContent:"center",marginRight:spacing.sm},
  checkboxChecked:{backgroundColor:colors.primary[600],borderColor:colors.primary[600]},
  checkmark:{color:colors.white,fontSize:14,fontWeight:fontWeight.bold},
  checkboxLabel:{flex:1,fontSize:fontSize.sm,color:colors.gray[700]},
  bottomBar:{position:"absolute",bottom:0,left:0,right:0,backgroundColor:colors.white,paddingHorizontal:spacing.lg,paddingTop:spacing.md,borderTopWidth:1,borderTopColor:colors.gray[100]},
  signButton:{backgroundColor:colors.primary[600],paddingVertical:spacing.md,borderRadius:borderRadius.lg,alignItems:"center"},
  signButtonDisabled:{backgroundColor:colors.gray[300]},
  signButtonText:{color:colors.white,fontSize:fontSize.md,fontWeight:fontWeight.bold},
  successContainer:{flex:1,alignItems:"center",justifyContent:"center",padding:spacing.xl},
  successIcon:{fontSize:48,color:colors.green[500],marginBottom:spacing.md},
  successText:{fontSize:fontSize.lg,fontWeight:fontWeight.bold,color:colors.gray[900],marginBottom:spacing.sm},
  signedTime:{fontSize:fontSize.sm,color:colors.gray[500]},
});
