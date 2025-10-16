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
    unsubscribeProject: null,
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
      if (this.unsubscribeProject) {
        this.unsubscribeProject()
        this.unsubscribeProject = null
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
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      await deleteDoc(doc(firestore, 'users', user.value.uid, 'projects', id))

      // clean up
      this.currentProject = null
      if (this.unsubscribeProject) {
        this.unsubscribeProject()
        this.unsubscribeProject = null
      }
    },
    async loadProject(id) {
      const { user } = useAuthState()
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      // Stop any previous listener to avoid duplicates
      if (this.unsubscribeProject) {
        this.unsubscribeProject()
        this.unsubscribeProject = null
      }

      try {
        const projectRef = doc(firestore, 'users', user.value.uid, 'projects', id)
        this.loading = true

        // 👇 Listen live to changes
        this.unsubscribeProject = onSnapshot(projectRef, (snap) => {
          if (snap.exists()) {
            this.currentProject = { id: snap.id, ...snap.data() }
            this.loading = false
            console.log('[ProjectsStore] Realtime project update:', this.currentProject.name)
          } else {
            this.currentProject = null
            this.loading = false
          }
        })
      } catch (err) {
        console.error('[ProjectsStore] loadProject() failed:', err)
        this.loading = false
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
