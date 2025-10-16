<template>
  <v-container>
    <v-row align="center" justify="space-between">
      <h1>Users</h1>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate class="mt-4" />

    <v-table v-else class="mt-4">
      <thead>
        <tr>
          <th>Email</th>
          <th>Display Name</th>
          <th>Role</th>
          <th>Change Role</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.email }}</td>
          <td>{{ user.displayName || '—' }}</td>
          <td>
            <v-chip
              :color="user.role === 'admin' ? 'green' : user.role === 'client' ? 'blue' : 'grey'"
              text-color="white"
            >
              {{ user.role }}
            </v-chip>
          </td>
          <td>
            <v-select
              :items="['pending', 'client', 'admin']"
              :model-value="user.role"
              density="compact"
              hide-details
              style="max-width: 150px"
              @update:model-value="(role) => changeRole(user.id, role)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>

<script>
import { storeToRefs } from 'pinia'
import { useAuthState } from '~/composables/useAuthState'
import { useUsers } from '~/stores/usersStore'

export default {
  setup() {
    const { role } = useAuthState()
    const usersStore = useUsers()
    const { users, loading } = storeToRefs(usersStore)
    const router = useRouter()

    onMounted(() => {
      if (role.value !== 'admin') {
        alert('You are not authorized to access this page.')
        router.push('/')
      } else {
        usersStore.initListener()
      }
    })

    onBeforeUnmount(() => {
      usersStore.stopListener()
    })

    const changeRole = async (uid, newRole) => {
      await usersStore.updateRole(uid, newRole)
    }

    return {
      role,
      users,
      loading,
      changeRole,
    }
  },
}
</script>
