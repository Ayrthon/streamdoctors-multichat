<template>
  <v-layout class="rounded rounded-md border">
    <v-app-bar elevation="0">
      <img class="pa-5" src="/images/cropped-streamdoctors-logo_wit.png" width="240" />
      <div class="mt-2">MultiChat v1.2</div>
    </v-app-bar>
    <v-navigation-drawer expand-on-hover permanent rail>
      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-if="role === 'admin'"
          prepend-icon="mdi-folder"
          title="Projects"
          value="projects"
          to="/projects"
        />
        <v-list-item
          v-if="role === 'admin'"
          prepend-icon="mdi-account-multiple"
          title="Users"
          value="users"
        />
        <v-list-item
          v-if="role === 'admin'"
          prepend-icon="mdi-cog"
          title="Settings"
          value="settings"
        />
      </v-list>

      <!-- Logout section anchored at bottom -->
      <template v-slot:append>
        <v-divider></v-divider>
        <v-list density="compact" nav>
          <v-list-item
            v-if="user"
            prepend-icon="mdi-account"
            :title="`${user.email || user.displayName}`"
          />
          <v-list-item
            v-if="role === 'admin'"
            prepend-icon="mdi-shield-account"
            title="Admin Panel"
            to="/admin/users"
          />
          <v-list-item v-if="user" prepend-icon="mdi-logout" title="Logout" @click="logout" />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <NuxtPage />
    </v-main>
    <v-main class="d-flex align-center justify-center"></v-main>
  </v-layout>
</template>

<script>
import { signOut } from 'firebase/auth'

export default {
  setup() {
    const { $auth } = useNuxtApp()
    const { user, role } = useAuthState() // 👈 include role here
    const router = useRouter()

    const logout = async () => {
      try {
        await signOut($auth)
        user.value = null
        router.push('/')
      } catch (error) {
        console.error('Logout failed:', error)
        alert('Error logging out.')
      }
    }

    return { user, role, logout } // 👈 return role too
  },
}
</script>

<style></style>
