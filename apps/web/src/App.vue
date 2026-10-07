<script setup lang="ts">
import { onMounted, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { RouterView, useRoute } from "vue-router";

import { useNotice } from "./composables/useNotice";
import ToastRegion from "./ui/toasts/ToastRegion.vue";

const { t, locale } = useI18n();
const route = useRoute();
const { showPending } = useNotice();

onMounted(showPending);

watchEffect(() => {
  document.documentElement.lang = locale.value;
  const name = t("app.name");
  const titleKey = route.meta.titleKey;
  document.title = titleKey ? `${t(titleKey)} · ${name}` : name;
});
</script>

<template>
  <RouterView />
  <ToastRegion />
</template>
