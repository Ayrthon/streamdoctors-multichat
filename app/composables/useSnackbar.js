import { ref } from 'vue'

const snackbar = ref({ show: false, text: '', color: 'info' })

export function useSnackbar() {
  const showSnackbar = (text, color = 'info') => {
    snackbar.value = { show: true, text, color }
    setTimeout(() => (snackbar.value.show = false), 2500)
  }

  return { snackbar, showSnackbar }
}
