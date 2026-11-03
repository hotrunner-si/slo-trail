<script setup lang="ts">
const props = defineProps<{
  title: string
  note: string
  rows: { label: string; count: number; total?: number }[]
}>()
const maximum = computed(() => Math.max(1, ...props.rows.map((row) => row.count)))
</script>
<template>
  <section class="brain-panel bars-panel">
    <header class="panel-head">
      <h2>{{ title }}</h2>
    </header>
    <div v-if="rows.length" class="bars-list">
      <div v-for="row in rows" :key="row.label" class="bar-row">
        <div>
          <span>{{ row.label }}</span
          ><strong
            >{{ row.count
            }}<template v-if="row.total !== undefined"> / {{ row.total }}</template></strong
          >
        </div>
        <div class="bar-track" aria-hidden="true">
          <span :style="{ width: `${(row.count / Math.max(1, row.total ?? maximum)) * 100}%` }" />
        </div>
      </div>
    </div>
    <p v-else class="empty-panel">Za ta prikaz še ni dovolj podatkov.</p>
    <p class="chart-note">{{ note }}</p>
  </section>
</template>
