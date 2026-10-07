<script setup lang="ts">
import type { AuthUseCaseError, FieldIssue } from "@applytrack/core";
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink, useRoute } from "vue-router";

import { useHardNavigation } from "../../composables/useHardNavigation";
import { rememberNotice } from "../../composables/useNotice";
import { useToast } from "../../composables/useToast";
import { useUseCases } from "../../di/use-cases";
import AppIcon from "../components/AppIcon.vue";
import TextField from "../form/TextField.vue";

const RESEND_SECONDS = 60;

const { t } = useI18n();
const route = useRoute();
const toast = useToast();
const navigate = useHardNavigation();
const { accountsEnabled, requestSignIn, verifySignInCode } = useUseCases();

const step = ref<"email" | "code">("email");
const email = ref(typeof route.query.email === "string" ? route.query.email : "");
const code = ref("");
const issues = ref<readonly FieldIssue[]>([]);
const failure = ref<string | null>(null);
const busy = ref(false);
const remaining = ref(0);
const resendAnnouncement = ref("");
let timer: ReturnType<typeof setInterval> | undefined;

const issuesFor = (field: string) => issues.value.filter((issue) => issue.field === field);

const stopTimer = () => {
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
};

const startTimer = () => {
  stopTimer();
  remaining.value = RESEND_SECONDS;
  resendAnnouncement.value = "";
  timer = setInterval(() => {
    remaining.value -= 1;
    if (remaining.value <= 0) {
      stopTimer();
      resendAnnouncement.value = t("auth.resendReady");
    }
  }, 1000);
};

onBeforeUnmount(stopTimer);

const showError = (error: AuthUseCaseError) => {
  if (error.code === "VALIDATION_FAILED") {
    issues.value = error.issues;
    return;
  }
  failure.value = t(`errors.${error.code}`);
  toast.error(t("notify.failedTitle"), { description: failure.value });
};

const reset = () => {
  issues.value = [];
  failure.value = null;
};

const focus = async (id: string) => {
  await nextTick();
  document.getElementById(id)?.focus();
};

const sendLink = async (): Promise<boolean> => {
  reset();
  busy.value = true;
  try {
    const result = await requestSignIn.execute({
      email: email.value,
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (!result.ok) {
      showError(result.error);
      return false;
    }
    startTimer();
    return true;
  } finally {
    busy.value = false;
  }
};

const submitEmail = async () => {
  if (await sendLink()) {
    step.value = "code";
    await focus("field-code");
  } else if (issues.value.length > 0) {
    await focus("field-email");
  }
};

const resend = async () => {
  if (await sendLink()) toast.success(t("auth.resentTitle"));
};

const submitCode = async () => {
  reset();
  busy.value = true;
  try {
    const result = await verifySignInCode.execute({ email: email.value, code: code.value });
    if (!result.ok) {
      showError(result.error);
      await focus("field-code");
      return;
    }
    rememberNotice({ kind: "signedIn", email: result.value.email });
    navigate("/board");
  } finally {
    busy.value = false;
  }
};

const useOtherEmail = async () => {
  stopTimer();
  reset();
  code.value = "";
  step.value = "email";
  await focus("field-email");
};

const normalizedEmail = computed(() => email.value.trim().toLowerCase());
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center p-4">
    <section class="w-full max-w-md" aria-labelledby="sign-in-title">
      <RouterLink
        :to="{ name: 'start' }"
        class="text-ink-muted hover:text-ink mb-6 inline-flex min-h-11 items-center gap-2 text-sm"
      >
        <AppIcon name="chevronLeft" />
        {{ t("nav.back") }}
      </RouterLink>

      <div class="border-border bg-surface rounded-lg border p-6">
        <p class="text-accent text-sm font-semibold tracking-wide uppercase">
          {{ t("app.name") }}
        </p>

        <template v-if="step === 'email'">
          <h1 id="sign-in-title" class="mt-2 text-2xl font-bold tracking-tight">
            {{ t("auth.title") }}
          </h1>
          <p class="text-ink-muted mt-2 text-pretty">{{ t("auth.description") }}</p>

          <p
            v-if="!accountsEnabled"
            class="bg-warning-soft text-warning mt-4 rounded-md p-3 text-sm"
          >
            {{ t("start.signInUnavailable") }}
          </p>

          <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submitEmail">
            <TextField
              v-model="email"
              name="email"
              type="email"
              inputmode="email"
              autocomplete="email"
              :label="t('auth.emailLabel')"
              :issues="issuesFor('email')"
              required
            />
            <button
              type="submit"
              class="bg-accent text-accent-ink min-h-12 rounded-md px-6 font-semibold disabled:opacity-70"
              :disabled="busy || !accountsEnabled"
              :aria-busy="busy"
            >
              {{ busy ? t("auth.sending") : t("auth.sendLink") }}
            </button>
          </form>
        </template>

        <template v-else>
          <h1 id="sign-in-title" class="mt-2 text-2xl font-bold tracking-tight">
            {{ t("auth.checkTitle") }}
          </h1>
          <p class="text-ink-muted mt-2 text-pretty break-words">
            {{ t("auth.checkDescription", { email: normalizedEmail }) }}
          </p>

          <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submitCode">
            <TextField
              v-model="code"
              name="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              :maxlength="7"
              :label="t('auth.codeLabel')"
              :issues="issuesFor('code')"
              required
            />
            <button
              type="submit"
              class="bg-accent text-accent-ink min-h-12 rounded-md px-6 font-semibold disabled:opacity-70"
              :disabled="busy"
              :aria-busy="busy"
            >
              {{ busy ? t("auth.verifying") : t("auth.verify") }}
            </button>
          </form>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              class="text-accent min-h-11 font-medium underline-offset-2 hover:underline disabled:text-ink-muted disabled:no-underline"
              :disabled="remaining > 0 || busy"
              @click="resend"
            >
              <span v-if="remaining > 0">{{ t("auth.resendIn", { seconds: remaining }) }}</span>
              <span v-else>{{ t("auth.resend") }}</span>
            </button>
            <button
              type="button"
              class="text-ink-muted hover:text-ink min-h-11 font-medium underline-offset-2 hover:underline"
              @click="useOtherEmail"
            >
              {{ t("auth.otherEmail") }}
            </button>
          </div>
          <p class="sr-only" aria-live="polite">{{ resendAnnouncement }}</p>
        </template>

        <p v-if="failure" role="alert" class="text-danger mt-4 text-sm">{{ failure }}</p>
      </div>
    </section>
  </main>
</template>
