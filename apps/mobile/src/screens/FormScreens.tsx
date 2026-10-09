import type { ApplicationSnapshot } from "@applytrack/core";
import { COLORS } from "@applytrack/design-tokens";
import type { FormValues } from "@applytrack/presentation";
import { emptyValues, toDetailsDraft, toDraft, valuesFromSnapshot } from "@applytrack/presentation";
import { usePreventRemove } from "expo-router/react-navigation";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, View } from "react-native";

import { useToast } from "../notifications/ToastProvider";
import { describeApplicationError } from "../shell/application-errors";
import { useUseCases } from "../shell/session";
import { useIsDark } from "../theme/theme";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { CardSkeleton } from "../ui/ResultState";
import { Screen } from "../ui/Screen";
import type { ApplicationFormHandle } from "./ApplicationForm";
import { ApplicationForm } from "./ApplicationForm";
import { useApplication } from "./useApplication";
import { useApplicationForm } from "./useApplicationForm";
import { Text } from "../ui/Text";

const Header = ({ title, onBack }: { readonly title: string; readonly onBack: () => void }) => {
  const { t } = useTranslation();
  const dark = useIsDark();
  return (
    <View className="gap-2">
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        className="min-h-11 flex-row items-center gap-2 self-start"
      >
        <Icon name="chevronLeft" size={18} color={COLORS[dark ? "dark" : "light"]["ink-muted"]} />
        <Text className="text-sm text-ink-muted">{t("nav.back")}</Text>
      </Pressable>
      <Text accessibilityRole="header" className="text-2xl font-bold text-ink">
        {title}
      </Text>
    </View>
  );
};

const useLeave = (dirty: boolean, fallback: string) => {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const [leaving, setLeaving] = useState(false);

  usePreventRemove(dirty && !leaving, ({ data }) => {
    Alert.alert(t("mobile.unsavedTitle"), t("form.unsavedConfirm"), [
      { text: t("mobile.keepEditing"), style: "cancel" },
      {
        text: t("mobile.discard"),
        style: "destructive",
        onPress: () => {
          navigation.dispatch(data.action);
        },
      },
    ]);
  });

  useEffect(() => {
    if (!leaving) return;
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  }, [leaving, router, fallback]);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };

  return {
    back,
    finish: () => {
      setLeaving(true);
    },
  };
};

const FormScreen = ({
  title,
  initial,
  current,
  fallback,
  save,
  successTitle,
  successDescription,
}: {
  readonly title: string;
  readonly initial: FormValues;
  readonly current?: ApplicationSnapshot;
  readonly fallback: string;
  readonly save: (
    values: FormValues,
  ) => Promise<
    | { ok: true; value: ApplicationSnapshot }
    | { ok: false; error: Parameters<typeof describeApplicationError>[1] }
  >;
  readonly successTitle: string;
  readonly successDescription: (application: ApplicationSnapshot) => string;
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const form = useApplicationForm({ initial, currentStatus: current?.status });
  const formRef = useRef<ApplicationFormHandle>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const { back, finish } = useLeave(form.isDirty, fallback);

  const submit = async () => {
    form.submit();
    setFailure(null);
    if (form.issues.length > 0) {
      formRef.current?.revealFirstError();
      return;
    }
    if (current && !form.isDirty) {
      finish();
      return;
    }
    setSaving(true);
    try {
      const result = await save(form.values);
      if (!result.ok) {
        setFailure(describeApplicationError(t, result.error));
        return;
      }
      form.markSaved();
      toast.success(successTitle, { description: successDescription(result.value) });
      finish();
    } catch {
      setFailure(t("form.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ApplicationForm
      ref={formRef}
      form={form}
      currentStatus={current?.status}
      saving={saving}
      failure={failure}
      onSave={() => void submit()}
      onCancel={back}
      header={<Header title={title} onBack={back} />}
    />
  );
};

export const NewApplicationScreen = () => {
  const { t } = useTranslation();
  const { createApplication } = useUseCases();
  const [initial] = useState(emptyValues);

  return (
    <FormScreen
      title={t("application.newTitle")}
      initial={initial}
      fallback="/board"
      save={(values) => createApplication.execute(toDraft(values))}
      successTitle={t("notify.createdTitle")}
      successDescription={(application) =>
        t("notify.createdDescription", {
          company: application.company,
          position: application.position,
        })
      }
    />
  );
};

export const EditApplicationScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateApplicationDetails } = useUseCases();
  const { state } = useApplication(id);
  const [loaded, setLoaded] = useState<ApplicationSnapshot | null>(null);

  useEffect(() => {
    if (state.kind === "ready" && loaded === null) setLoaded(state.application);
  }, [state, loaded]);

  if (!loaded) {
    return (
      <Screen>
        {state.kind === "notFound" ? (
          <View className="gap-4 rounded-lg border border-border bg-surface p-5">
            <Text accessibilityRole="header" className="text-xl font-bold text-ink">
              {t("form.notFound")}
            </Text>
            <Button
              label={t("form.backToBoard")}
              onPress={() => {
                router.replace("/board");
              }}
            />
          </View>
        ) : (
          <CardSkeleton />
        )}
      </Screen>
    );
  }

  return (
    <FormScreen
      title={t("application.editTitle")}
      initial={valuesFromSnapshot(loaded)}
      current={loaded}
      fallback={`/applications/${loaded.id}`}
      save={(values) =>
        updateApplicationDetails.execute({ id: loaded.id, details: toDetailsDraft(values) })
      }
      successTitle={t("notify.updatedTitle")}
      successDescription={(application) =>
        t("notify.updatedDescription", { company: application.company })
      }
    />
  );
};
