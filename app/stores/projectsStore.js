// ~/stores/projects.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useAuthState } from '~/composables/useAuthState'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    loading: false,
    unsubscribe: null,
  }),

  actions: {
    async init() {
      const { user } = useAuthState()
      const { firestore } = useNuxtApp()

      // 🧠 Wait until user and firestore are ready
      if (!firestore) {
        console.error('[ProjectsStore] Firestore not initialized.')
        return
      }

      // Wait for user.uid
      if (!user.value) {
        console.warn('[ProjectsStore] No user yet, waiting...')
        await new Promise((resolve) => {
          const unwatch = watch(user, (val) => {
            if (val) {
              unwatch()
              resolve()
            }
          })
        })
      }

      // Now safe to listen
      if (this.unsubscribe) this.unsubscribe()
      this.loading = true

      try {
        const ref = collection(firestore, 'users', user.value.uid, 'projects')
        this.unsubscribe = onSnapshot(ref, (snap) => {
          this.projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          this.loading = false
        })
      } catch (err) {
        console.error('[ProjectsStore] Firestore listener failed:', err)
        this.loading = false
      }
    },

    stop() {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
    },

    async addProject(name) {
      const { user } = useAuthState()
      const { firestore } = useNuxtApp()
      if (!user.value || !firestore) return

      const ref = collection(firestore, 'users', user.value.uid, 'projects')
      await addDoc(ref, {
        name,
        createdAt: serverTimestamp(),
        platforms: [],
      })
    },

    async deleteProject(id) {
      const { user } = useAuthState()
      const { firestore } = useNuxtApp()
      if (!user.value || !firestore) return

      await deleteDoc(doc(firestore, 'users', user.value.uid, 'projects', id))
    },
  },
})
