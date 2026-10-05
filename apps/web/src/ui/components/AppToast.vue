<script setup lang="ts">
import { useToast } from "../../composables/useToast";

const message = useToast();
</script>

<template>
  <div
    role="status"
    class="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-6"
  >
    <p
      v-if="message"
      class="bg-ink text-canvas pointer-events-auto rounded-md px-4 py-2 text-sm font-medium shadow-lg"
    >
      {{ message }}
    </p>
  </div>
</template>
