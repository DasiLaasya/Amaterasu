import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Server Action: Login
async function login(formData: FormData) {
  'use server'
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  })
  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// Server Action: Signup
async function signup(formData: FormData) {
  'use server'
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  })
  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }
  
  if (data?.session) {
    revalidatePath('/dashboard')
    redirect('/dashboard')
  }
  
  revalidatePath('/')
  redirect('/?message=Registration+successful.+Check+your+email+to+confirm+your+account.')
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  // Authenticated: Route directly to the analysis engine
  if (user) {
    redirect('/dashboard')
  }

  // Unauthenticated: Show Login / Signup Gate
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d1117',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e6edf3',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '40px 30px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: '1.5rem', letterSpacing: '0.25em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              A m a t e r a s u
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
            Bringing absolute diagnostic clarity to complex state spaces
          </p>
        </div>

        {params.error && (
          <div style={{
            padding: '12px',
            background: 'rgba(248, 81, 73, 0.1)',
            border: '1px solid rgba(248, 81, 73, 0.4)',
            borderRadius: '6px',
            color: '#ff7b72',
            fontSize: '0.82rem',
            marginBottom: '16px',
            lineHeight: 1.4
          }}>
            <strong>Error:</strong> {params.error}
          </div>
        )}

        {params.message && (
          <div style={{
            padding: '12px',
            background: 'rgba(56, 139, 253, 0.1)',
            border: '1px solid rgba(56, 139, 253, 0.4)',
            borderRadius: '6px',
            color: '#58a6ff',
            fontSize: '0.82rem',
            marginBottom: '16px',
            lineHeight: 1.4
          }}>
            {params.message}
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Email address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              formAction={login}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--text-primary)',
                color: 'var(--bg-base)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              formAction={signup}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
