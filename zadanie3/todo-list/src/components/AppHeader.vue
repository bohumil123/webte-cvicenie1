<script setup>
const emit = defineEmits(['change-page'])
</script>

<template>
<header class="appHeader">
  <h1>TODO list</h1>
  <nav>
    <button type="button" @click="emit('change-page', 'tasks')">Zoznam uloh</button>
    <button type="button" @click="emit('change-page', 'calendar')">Kalendar</button>
  </nav>
  <button type="button">Pridat Ulohu</button>
</header>
</template>

<style scoped>
.appHeader {
  background-color: var(--bs-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--app-space);
  padding: 20px max(24px, calc((100% - 1000px) / 2));
  box-shadow: 0 4px 16px color-mix(in srgb, var(--bs-primary) 15%, transparent);
}
.appHeader h1 {
  color: var(--app-card-bg);
  margin: 0;
  font-size: 1.4rem;
  white-space: nowrap;
}
.appHeader button {
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 10px 16px;
  transition: background-color 150ms, box-shadow 150ms;
}
.appHeader nav button { background: transparent; color: var(--app-card-bg); }
.appHeader nav button:hover { background-color: color-mix(in srgb, var(--app-card-bg) 15%, transparent); }
.appHeader > button { background-color: var(--app-card-bg); color: var(--bs-primary); }
.appHeader > button:hover {
  background-color: var(--bs-body-bg);
  box-shadow: 0 3px 10px color-mix(in srgb, var(--bs-body-color) 15%, transparent);
}
.appHeader button:focus-visible { outline: 2px solid var(--app-card-bg); outline-offset: 3px; }
.appHeader nav { display: flex; gap: 4px; flex-wrap: wrap; }
@media (max-width: 700px) {
  .appHeader { flex-wrap: wrap; }
  .appHeader nav { order: 1; width: 100%; }
}
</style>
