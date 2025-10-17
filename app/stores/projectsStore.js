import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { useAuthState } from '~/composables/useAuthState'

import { generatePublicToken } from '../utils/generatePublicToken'

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
      const { firestore } = await useFirebase()

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
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      const ref = collection(firestore, 'users', user.value.uid, 'projects')
      const token = generatePublicToken()

      const newDoc = await addDoc(ref, {
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        platforms: [],
        publicToken: token,
      })

      // ✅ Mirror it in publicProjects for chatview lookups
      await setDoc(doc(firestore, 'publicProjects', token), {
        uid: user.value.uid,
        projectId: newDoc.id,
        name,
        platforms: [],
        createdAt: serverTimestamp(),
      })

      console.log('[ProjectsStore] Created project', name, 'with token', token)
    },

    async deleteProject(id) {
      const { user } = useAuthState()
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      const projectRef = doc(firestore, 'users', user.value.uid, 'projects', id)
      const snap = await getDoc(projectRef)
      const project = snap.exists() ? snap.data() : null

      await deleteDoc(projectRef)

      // 🗑️ Clean up publicProjects mirror
      if (project?.publicToken) {
        await deleteDoc(doc(firestore, 'publicProjects', project.publicToken))
      }

      this.currentProject = null
      if (this.unsubscribeProject) {
        this.unsubscribeProject()
        this.unsubscribeProject = null
      }

      console.log('[ProjectsStore] Deleted project', id)
    },

    async loadProject(id) {
      const { user } = useAuthState()
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      if (this.unsubscribeProject) {
        this.unsubscribeProject()
        this.unsubscribeProject = null
      }

      try {
        const projectRef = doc(firestore, 'users', user.value.uid, 'projects', id)
        this.loading = true

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

      // ✅ Update public mirror
      if (project.publicToken) {
        await updateDoc(doc(firestore, 'publicProjects', project.publicToken), {
          platforms: updatedPlatforms,
          updatedAt: serverTimestamp(),
        })
      }
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

      // ✅ Sync publicProjects mirror
      if (project.publicToken) {
        await updateDoc(doc(firestore, 'publicProjects', project.publicToken), {
          platforms: updatedPlatforms,
          updatedAt: serverTimestamp(),
        })
      }
    },

    async saveProject(id, data) {
      const { user } = useAuthState()
      const { firestore } = await useFirebase()
      if (!user.value || !firestore) return

      const projectRef = doc(firestore, 'users', user.value.uid, 'projects', id)
      const snap = await getDoc(projectRef)
      if (!snap.exists()) throw new Error('Project not found')

      const safeData = { ...data }
      delete safeData.publicToken // never overwrite token

      await updateDoc(projectRef, {
        ...safeData,
        updatedAt: serverTimestamp(),
      })

      const project = snap.data()
      if (project.publicToken) {
        await updateDoc(doc(firestore, 'publicProjects', project.publicToken), {
          ...safeData,
          updatedAt: serverTimestamp(),
        })
      }
    },
  },
})
