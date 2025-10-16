import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

export const useAuthState = () => {
  const user = useState('user', () => null)
  const role = useState('role', () => null)
  const { $auth, $firebase } = useNuxtApp()

  // ✅ Only create Firestore client in the browser
  const db = process.client ? getFirestore($firebase) : null

  if (process.client && !$auth._listenerSet) {
    onAuthStateChanged($auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = firebaseUser

        if (!db) return // safeguard for SSR

        const userRef = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(userRef)

        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || '',
            role: 'pending',
            createdAt: serverTimestamp(),
          })
          role.value = 'pending'
          // console.log('[Auth] Created new Firestore user:', firebaseUser.email)
        } else {
          role.value = snap.data().role
        }
      } else {
        user.value = null
        role.value = null
      }
    })
    $auth._listenerSet = true
  }

  return { user, role }
}
