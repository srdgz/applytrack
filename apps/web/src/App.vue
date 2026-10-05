<script setup lang="ts">
import { ok } from "@applytrack/core";

const coreStatus = ok("Núcleo conectado");
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
    <section class="w-full max-w-md text-center">
      <h1 class="text-3xl font-semibold text-slate-900 dark:text-slate-50">ApplyTrack</h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400">Gestor de candidaturas · web</p>
      <p
        class="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      >
        <span aria-hidden="true">●</span>
        {{ coreStatus.value }}
      </p>
    </section>
  </main>
</template>
