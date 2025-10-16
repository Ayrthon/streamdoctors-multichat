import { onAuthStateChanged } from 'firebase/auth'

export const useAuthState = () => {
  const user = useState('user', () => null)
  const { $auth } = useNuxtApp()

  if (import.meta.client && !$auth._listenerSet) {
    onAuthStateChanged($auth, (firebaseUser) => {
      user.value = firebaseUser
    })
    $auth._listenerSet = true
  }

  return { user }
}
