import type { RouterHistory } from "vue-router";
import { createRouter } from "vue-router";

import type { UseCases } from "../di/use-cases";
import AppLayout from "../ui/layouts/AppLayout.vue";
import ApplicationDetailView from "../ui/views/ApplicationDetailView.vue";
import ApplicationEditView from "../ui/views/ApplicationEditView.vue";
import ApplicationNewView from "../ui/views/ApplicationNewView.vue";
import AuthCallbackView from "../ui/views/AuthCallbackView.vue";
import BoardView from "../ui/views/BoardView.vue";
import ListView from "../ui/views/ListView.vue";
import NotFoundView from "../ui/views/NotFoundView.vue";
import SettingsView from "../ui/views/SettingsView.vue";
import SignInView from "../ui/views/SignInView.vue";
import StatsView from "../ui/views/StatsView.vue";
import StartView from "../ui/views/StartView.vue";

declare module "vue-router" {
  interface RouteMeta {
    requiresSession?: boolean;
    guestOnly?: boolean;
    signedOutOnly?: boolean;
    titleKey?: string;
    hideFab?: boolean;
  }
}

export const createAppRouter = (useCases: UseCases, history: RouterHistory) => {
  const router = createRouter({
    history,
    routes: [
      {
        path: "/",
        name: "start",
        component: StartView,
        meta: { guestOnly: true, titleKey: "start.title" },
      },
      {
        path: "/sign-in",
        name: "sign-in",
        component: SignInView,
        meta: { signedOutOnly: true, titleKey: "auth.title" },
      },
      {
        path: "/auth/callback",
        name: "auth-callback",
        component: AuthCallbackView,
        meta: { titleKey: "auth.callbackTitle" },
      },
      {
        path: "/",
        component: AppLayout,
        meta: { requiresSession: true },
        children: [
          {
            path: "board",
            name: "board",
            component: BoardView,
            meta: { titleKey: "board.title" },
          },
          { path: "list", name: "list", component: ListView, meta: { titleKey: "list.title" } },
          {
            path: "stats",
            name: "stats",
            component: StatsView,
            meta: { titleKey: "stats.title" },
          },
          {
            path: "settings",
            name: "settings",
            component: SettingsView,
            meta: { titleKey: "settings.title" },
          },
          {
            path: "applications/new",
            name: "application-new",
            component: ApplicationNewView,
            meta: { titleKey: "application.newTitle", hideFab: true },
          },
          {
            path: "applications/:id",
            name: "application",
            component: ApplicationDetailView,
            props: true,
            meta: { titleKey: "detail.title" },
          },
          {
            path: "applications/:id/edit",
            name: "application-edit",
            component: ApplicationEditView,
            props: true,
            meta: { titleKey: "application.editTitle", hideFab: true },
          },
        ],
      },
      {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: NotFoundView,
        meta: { titleKey: "notFound.title" },
      },
    ],
  });

  router.beforeEach(async (to) => {
    const signedIn = useCases.account !== null;
    if (signedIn && (to.meta.guestOnly || to.meta.signedOutOnly)) return { name: "board" };
    const active = signedIn || (await useCases.isDemoActive.execute());
    if (!active && to.matched.some((record) => record.meta.requiresSession)) {
      return { name: "start" };
    }
    if (active && to.meta.guestOnly) return { name: "board" };
    return true;
  });

  return router;
};
