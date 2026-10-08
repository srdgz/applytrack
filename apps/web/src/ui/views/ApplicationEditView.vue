<script setup lang="ts">
import type { ApplicationSnapshot } from "@applytrack/core";
import { computed, ref, shallowRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRouter } from "vue-router";

import { useToast } from "../../composables/useToast";
import { useUseCases } from "../../di/use-cases";
import type { FormValues } from "@applytrack/presentation";
import { toDetailsDraft, valuesFromSnapshot } from "@applytrack/presentation";
import type { SaveOutcome } from "../form/ApplicationForm.vue";
import BackButton from "../components/BackButton.vue";
import ApplicationForm from "../form/ApplicationForm.vue";

const props = defineProps<{ id: string }>();

const { t } = useI18n();
const router = useRouter();
const { getApplication, updateApplicationDetails } = useUseCases();
const toast = useToast();

const detailRoute = computed(() => ({ name: "application", params: { id: props.id } }));

const status = ref<"loading" | "ready" | "not-found" | "error">("loading");
const application = shallowRef<ApplicationSnapshot | null>(null);

const load = async () => {
  status.value = "loading";
  try {
    const result = await getApplication.execute({ id: props.id });
    if (result.ok) {
      application.value = result.value;
      status.value = "ready";
    } else if (result.error.code === "UNAUTHENTICATED") {
      await router.replace({ name: "start" });
    } else {
      status.value = "not-found";
    }
  } catch {
    status.value = "error";
  }
};

watch(() => props.id, load, { immediate: true });

const save = async (values: FormValues): Promise<SaveOutcome> => {
  const result = await updateApplicationDetails.execute({
    id: props.id,
    details: toDetailsDraft(values),
  });
  if (result.ok) {
    toast.success(t("notify.updatedTitle"), {
      description: t("notify.updatedDescription", { company: result.value.company }),
    });
    return "saved";
  }
  if (result.error.code === "UNAUTHENTICATED") await router.replace({ name: "start" });
  return result.error.code === "VALIDATION_FAILED" ? "invalid" : "error";
};
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 lg:p-6">
    <BackButton :fallback="detailRoute" />
    <h1 class="text-2xl font-bold tracking-tight">{{ t("application.editTitle") }}</h1>

    <div v-if="status === 'loading'" aria-busy="true" class="flex flex-col gap-4">
      <span class="sr-only">{{ t("feedback.loading") }}</span>
      <div
        v-for="index in 3"
        :key="index"
        aria-hidden="true"
        class="bg-surface-muted h-40 animate-pulse rounded-lg"
      />
    </div>

    <div
      v-else-if="status === 'not-found'"
      class="border-border bg-surface rounded-lg border p-6 text-center"
      role="alert"
    >
      <p class="font-semibold">{{ t("form.notFound") }}</p>
      <RouterLink
        :to="{ name: 'board' }"
        class="text-accent mt-3 inline-block font-medium underline underline-offset-2"
      >
        {{ t("form.backToBoard") }}
      </RouterLink>
    </div>

    <div
      v-else-if="status === 'error'"
      class="border-border bg-surface rounded-lg border p-6 text-center"
      role="alert"
    >
      <p class="font-semibold">{{ t("feedback.errorTitle") }}</p>
      <button
        type="button"
        class="bg-accent text-accent-ink mt-4 min-h-10 rounded-md px-4 text-sm font-medium"
        @click="load"
      >
        {{ t("feedback.retry") }}
      </button>
    </div>

    <ApplicationForm
      v-else-if="application"
      :key="application.id"
      :initial="valuesFromSnapshot(application)"
      :current-status="application.status"
      :save="save"
      :fallback="detailRoute"
    />
  </div>
</template>
