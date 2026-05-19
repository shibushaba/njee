/**
 * Shown when the app loads without required Vite env (e.g. Vercel project env not set).
 * Kept separate from `lib/supabase` so this screen can render without importing Supabase.
 */
export function MissingEnvScreen() {
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-[#faf6ef] px-6 py-12 text-[#5a2e1e]">
      <div className="mx-auto w-full max-w-lg border-[3px] border-[#5a2e1e] bg-[#fffdf8] p-8 shadow-[6px_6px_0_0_rgba(90,46,30,0.12)]">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#8a7268]">Configuration</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Environment variables missing</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#5a2e1e]/90">
          This build does not include <code className="rounded bg-[#f0ebe3] px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code>{' '}
          or <code className="rounded bg-[#f0ebe3] px-1 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code>. The app cannot
          start until they are set at <strong>build time</strong> on Vercel.
        </p>
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#5a2e1e]/90">
          <li>
            Vercel → your project → <strong>Settings</strong> → <strong>Environment Variables</strong>
          </li>
          <li>
            Add <code className="text-xs">VITE_SUPABASE_URL</code> and <code className="text-xs">VITE_SUPABASE_ANON_KEY</code>{' '}
            (same values as in <code className="text-xs">.env.local</code>). For Memories / Drive, also add{' '}
            <code className="text-xs">VITE_GOOGLE_CLIENT_ID</code> and{' '}
            <code className="text-xs">VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID</code>.
          </li>
          <li>
            Apply to <strong>Production</strong> (and Preview if you use preview deploys).
          </li>
          <li>
            <strong>Redeploy</strong> (Deployments → ⋮ → Redeploy). Vite bakes <code className="text-xs">VITE_*</code>{' '}
            into the JS at build time; changing env alone does not update an old deployment.
          </li>
        </ol>
        <p className="mt-6 border-t-[3px] border-[#5a2e1e] pt-4 text-xs text-[#8a7268]">
          After deploy: add <code className="text-xs">https://your-domain.vercel.app</code> to Supabase Auth URL config if
          needed, and to Google OAuth <strong>Authorized JavaScript origins</strong> for Google sign-in.
        </p>
      </div>
    </div>
  )
}
