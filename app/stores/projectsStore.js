// ~/stores/projects.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useAuthState } from '~/composables/useAuthState'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    unsubscribe: null,
  }),

  actions: {
    async init() {
      const { user } = useAuthState()
      const { firestore } = await useFirebase() // ✅ wait until ready

      if (!firestore) {
        console.error('[ProjectsStore] Firestore failed to initialize.')
        return
      }

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

      if (this.unsubscribe) this.unsubscribe()
      this.loading = true

      try {
        const ref = collection(firestore, 'users', user.value.uid, 'projects')
        this.unsubscribe = onSnapshot(ref, (snap) => {
          this.projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          this.loading = false
        })
        console.log('[ProjectsStore] Listening to projects for', user.value.email)
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
      const { firestore } = await useFirebase() // ✅ waits until ready
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
    async loadProject(id) {
      const { user } = useAuthState()
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      try {
        const projectRef = doc(firestore, 'users', user.value.uid, 'projects', id)
        const snap = await getDoc(projectRef)
        if (snap.exists()) {
          this.currentProject = { id: snap.id, ...snap.data() }
          console.log('[ProjectsStore] Loaded project:', this.currentProject.name)
        } else {
          console.warn('[ProjectsStore] Project not found:', id)
          this.currentProject = null
        }
      } catch (err) {
        console.error('[ProjectsStore] loadProject() failed:', err)
      }
    },

    async addPlatform(projectId, platform) {
      const { user } = useAuthState()
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      const projectRef = doc(firestore, 'users', user.value.uid, 'projects', projectId)
      const snap = await getDoc(projectRef)

      if (!snap.exists()) return console.error('Project not found')
      const project = snap.data()
      const updatedPlatforms = [...(project.platforms || []), platform]

      await updateDoc(projectRef, { platforms: updatedPlatforms })
      console.log('[ProjectsStore] Added platform to', project.name)
    },

    async removePlatform(projectId, index) {
      const { user } = useAuthState()
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      const projectRef = doc(firestore, 'users', user.value.uid, 'projects', projectId)
      const snap = await getDoc(projectRef)

      if (!snap.exists()) return console.error('Project not found')
      const project = snap.data()
      const updatedPlatforms = [...(project.platforms || [])]
      updatedPlatforms.splice(index, 1)

      await updateDoc(projectRef, { platforms: updatedPlatforms })
      console.log('[ProjectsStore] Removed platform from', project.name)
    },
  },
})
