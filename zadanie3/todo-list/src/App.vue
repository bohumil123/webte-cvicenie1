<script setup>
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import TaskList from './components/TaskList.vue'
import TaskCalendar from './components/TaskCalendar.vue'

const currentPage = ref('tasks')
</script>

<template>
  <AppHeader @change-page="currentPage = $event" />
  <main>
    <h1>Môj TODO List</h1>
    <p>Moja prvá Vue aplikácia.</p>
    <TaskList v-if="currentPage === 'tasks'" />
    <TaskCalendar v-else-if="currentPage === 'calendar'" />
  </main>
</template>

<style scoped>
</style>
