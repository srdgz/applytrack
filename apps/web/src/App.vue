<script setup lang="ts">
import { watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { RouterView, useRoute } from "vue-router";

const { t, locale } = useI18n();
const route = useRoute();

watchEffect(() => {
  document.documentElement.lang = locale.value;
  const name = t("app.name");
  const titleKey = route.meta.titleKey;
  document.title = titleKey ? `${t(titleKey)} · ${name}` : name;
});
</script>

<template>
  <RouterView />
</template>
