import { createFileRoute } from "@tanstack/react-router";

// Temporary one-off: creates the two dev accounts. Removed right after use.
export const Route = createFileRoute("/api/public/tmp-seed-devs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { password } = (await request.json()) as { password: string };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const out: unknown[] = [];
        for (const email of ["qaisdev@gmail.org", "chancedev@gmail.com"]) {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
          let id = data.user?.id;
          if (error) {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers();
            id = list.users.find((u) => u.email === email)?.id;
            if (id) await supabaseAdmin.auth.admin.updateUserById(id, { password, email_confirm: true });
          }
          if (id) await supabaseAdmin.from("user_roles").upsert({ user_id: id, role: "admin" }, { onConflict: "user_id,role" });
          out.push({ email, ok: !!id, err: error?.message });
        }
        return Response.json(out);
      },
    },
  },
});
