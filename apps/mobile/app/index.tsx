/**
 * Lahasa Mobile - Expo app (squelette)
 * Ce fichier est le point d'entrée de l'app terrain offline-first.
 * 
 * Architecture prévue:
 * - expo-camera pour capture CIN
 * - expo-secure-store pour token JWT + clé chiffrement
 * - expo-sqlite pour stockage offline (remplace Dexie web)
 * - Background sync via expo-task-manager + expo-background-fetch
 * 
 * Pour MVP, cette app réutilise la logique web via WebView ou partage de code.
 * Lancer: pnpm start et scanner avec Expo Go
 */

import { View, Text, StyleSheet } from 'react-native'

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lahasa Mobile</Text>
      <Text style={styles.subtitle}>App terrain offline-first</Text>
      <Text style={styles.desc}>
        Module acquisition CIN:{"\n"}
        • Camera (expo-camera){"\n"}
        • Preprocess on-device{"\n"}
        • SQLite queue{"\n"}
        • Sync auto /api/v1/cin/sync/batch{"\n"}
        • QR + LH-ID generation{"\n"}
        • MG/FR i18n
      </Text>
      <Text style={styles.note}>Ce squelette sera étendu avec la même UI que web mais en React Native. Pour démo, utiliser la PWA web qui est déjà mobile-responsive et offline-capable.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fcfdf9' },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
  desc: { marginTop: 24, lineHeight: 22 },
  note: { marginTop: 24, fontSize: 12, color: '#94a3b8' }
})
