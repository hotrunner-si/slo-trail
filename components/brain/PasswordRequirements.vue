<script setup lang="ts">
import { accountPasswordIssues } from '~/utils/account-password'
const props = defineProps<{ password: string }>()
const issues = computed(() => accountPasswordIssues(props.password))
</script>

<template>
  <div
    class="brain-password-help"
    :class="{ complete: !issues.length }"
    aria-live="polite"
    aria-atomic="true"
  >
    <template v-if="issues.length">
      <span v-for="issue in issues" :key="issue"><i aria-hidden="true">·</i>{{ issue }}</span>
    </template>
    <span v-else><i aria-hidden="true">✓</i>Geslo izpolnjuje vse zahteve.</span>
  </div>
</template>

<style scoped>
.brain-password-help {
  display: grid;
  gap: 0.3rem;
  padding: 0.7rem 0.85rem;
  border-left: 2px solid #c6b583;
  border-radius: 0 0.35rem 0.35rem 0;
  background: #f6f3e9;
  color: #6c5c35;
  font-size: 0.78rem;
  line-height: 1.5;
}
.brain-password-help span {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}
.brain-password-help i {
  flex: 0 0 0.7rem;
  font-style: normal;
  font-weight: 700;
  text-align: center;
}
.brain-password-help.complete {
  background: #edf5ed;
  color: #266358;
  border-color: #70a184;
}
</style>
