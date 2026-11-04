<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const now = ref(Date.now())
const deadlineWarningMs = 24 * 60 * 60 * 1000
let clockInterval

onMounted(() => {
  clockInterval = setInterval(() => {
    now.value = Date.now()
  }, 60 * 1000)
})
onUnmounted(() => clearInterval(clockInterval))

function taskBorderClass(task) {
  if (task.is_finished) return 'taskCard--finished'
  const timeRemaining = new Date(task.date_to).getTime() - now.value
  if (timeRemaining <= 0) return 'taskCard--overdue'
  if (timeRemaining <= deadlineWarningMs) return 'taskCard--dueSoon'
  return ''
}

const tasks = ref([
  {
    id: 1,
    title: 'Dokončiť WEBTE zadanie',
    description: 'Vytvoriť TODO aplikáciu',
    date_from: '2026-11-10T10:00:00',
    date_to: '2026-11-10T12:00:00',
    is_finished: false
  },
  {
    id: 2,
    title: 'Naučiť sa Vue',
    description: 'Precvičiť komponenty',
    date_from: '2026-11-12T14:00:00',
    date_to: '2026-11-12T16:00:00',
    is_finished: true
  }
])
function toggleTask(task) {
  task.is_finished = !task.is_finished
}
</script>

<template>
  <section class="taskList">
    <h2>Moje úlohy</h2>
    <div v-for="task in tasks" :key="task.id" class="taskCard" :class="taskBorderClass(task)">
      <h3>{{ task.title }}</h3>
      <p>{{ task.description }}</p>
      <p>Začiatok: {{ task.date_from }}</p>
      <p>Koniec: {{ task.date_to }}</p>
      <button @click="toggleTask(task)">
        {{ task.is_finished ? 'Otvoriť úlohu' : 'Dokončiť úlohu' }}
      </button>
      <span v-if="task.is_finished">Dokončené</span>
      <span v-else>Nedokončené</span>
    </div>
  </section>
</template>

<style scoped>
.taskList { padding: 0; }
.taskCard {
  padding: 24px;
  margin-bottom: 20px;
  background: var(--app-card-bg);
  border: 2px solid color-mix(in srgb, var(--bs-body-color) 15%, var(--app-card-bg));
  border-radius: 14px;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--bs-body-color) 4%, transparent);
}
.taskCard h3 { margin: 0 0 8px; font-size: 1.15rem; }
.taskCard p { margin: 6px 0; overflow-wrap: anywhere; }
.taskCard p:nth-of-type(n + 2) {
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--bs-body-color) 70%, var(--app-card-bg));
}
.taskCard button {
  margin-top: 18px;
  padding: 9px 16px;
  border: 1px solid var(--bs-primary);
  border-radius: 8px;
  background: var(--bs-primary);
  color: var(--app-card-bg);
  transition: background-color 150ms;
}
.taskCard button:hover { background: color-mix(in srgb, var(--bs-primary) 85%, var(--bs-body-color)); }
.taskCard span {
  display: inline-block;
  margin: 12px 0 0 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--bs-body-bg);
  font-size: 0.8rem;
  font-weight: 600;
}
.taskCard--finished span {
  color: var(--bs-success);
  background: color-mix(in srgb, var(--bs-success) 10%, var(--app-card-bg));
}
.taskCard--dueSoon { border-color: var(--bs-warning); }
.taskCard--overdue { border-color: var(--bs-danger); }
.taskCard--finished { border-color: var(--bs-success); }
</style>
