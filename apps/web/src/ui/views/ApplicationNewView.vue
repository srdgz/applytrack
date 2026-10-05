<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { useToast } from "../../composables/useToast";
import { useUseCases } from "../../di/use-cases";
import type { FormValues } from "../../form/form-values";
import { emptyValues, toDraft } from "../../form/form-values";
import type { SaveOutcome } from "../form/ApplicationForm.vue";
import BackButton from "../components/BackButton.vue";
import ApplicationForm from "../form/ApplicationForm.vue";

const { t } = useI18n();
const router = useRouter();
const { createApplication } = useUseCases();
const toast = useToast();

const save = async (values: FormValues): Promise<SaveOutcome> => {
  const result = await createApplication.execute(toDraft(values));
  if (result.ok) {
    toast.success(t("notify.createdTitle"), {
      description: t("notify.createdDescription", {
        company: result.value.company,
        position: result.value.position,
      }),
    });
    return "saved";
  }
  if (result.error.code === "UNAUTHENTICATED") await router.replace({ name: "start" });
  return result.error.code === "VALIDATION_FAILED" ? "invalid" : "error";
};
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 lg:p-6">
    <BackButton :fallback="{ name: 'board' }" />
    <h1 class="text-2xl font-bold tracking-tight">{{ t("application.newTitle") }}</h1>
    <ApplicationForm :initial="emptyValues()" :save="save" :fallback="{ name: 'board' }" />
  </div>
</template>
