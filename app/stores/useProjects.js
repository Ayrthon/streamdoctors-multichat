import { addDoc, collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore'
import { useAuthState } from '~/composables/useAuthState'

// We'll use the Firestore instance from your Firebase plugin
export const useProjects = defineStore('projects', {
  state: () => ({
    projects: [],
    loading: false,
    unsubscribe: null, // holds Firestore listener
  }),

  actions: {
    async initListener() {
      const { user } = useAuthState()
      const { $firebase } = useNuxtApp()

      // Guard: no user
      if (!user.value) return

      this.loading = true
      const db = getFirestore($firebase)
      const q = query(collection(db, `users/${user.value.uid}/projects`))

      // Remove previous listener (if any)
      if (this.unsubscribe) this.unsubscribe()

      // Realtime Firestore listener
      this.unsubscribe = onSnapshot(q, (snapshot) => {
        this.projects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        this.loading = false
      })
    },

    async addProject(data) {
      const { user } = useAuthState()
      const { $firebase } = useNuxtApp()
      const db = getFirestore($firebase)
      await addDoc(collection(db, `users/${user.value.uid}/projects`), {
        ...data,
        createdAt: new Date(),
      })
    },

    async deleteProject(id) {
      const { user } = useAuthState()
      const { $firebase } = useNuxtApp()
      const db = getFirestore($firebase)
      await deleteDoc(doc(db, `users/${user.value.uid}/projects`, id))
    },

    stopListener() {
      if (this.unsubscribe) this.unsubscribe()
      this.unsubscribe = null
    },
  },
})
