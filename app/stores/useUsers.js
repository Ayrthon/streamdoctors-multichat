import { collection, doc, getFirestore, onSnapshot, updateDoc } from 'firebase/firestore'

export const useUsers = defineStore('users', {
  state: () => ({
    users: [],
    loading: false,
    unsubscribe: null,
  }),

  actions: {
    async initListener() {
      const { $firebase } = useNuxtApp()
      const db = getFirestore($firebase)
      this.loading = true

      const usersRef = collection(db, 'users')
      if (this.unsubscribe) this.unsubscribe()

      this.unsubscribe = onSnapshot(usersRef, (snapshot) => {
        this.users = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        this.loading = false
      })
    },

    async updateRole(uid, role) {
      const { $firebase } = useNuxtApp()
      const db = getFirestore($firebase)
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, { role })
    },

    stopListener() {
      if (this.unsubscribe) this.unsubscribe()
      this.unsubscribe = null
    },
  },
})
