<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Saanify - Modern Login</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- React & ReactDOM -->
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    
    <!-- Babel for JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <!-- Google Fonts: Plus Jakarta Sans for a modern look -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f8fafc;
        }
        
        /* Modern Background Animation */
        @keyframes float {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }

        .animate-blob {
            animation: blob 7s infinite;
        }

        .animation-delay-2000 {
            animation-delay: 2s;
        }

        .animation-delay-4000 {
            animation-delay: 4s;
        }

        /* Glassmorphism utility */
        .glass {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .glass-dark {
            background: rgba(11, 19, 43, 0.6);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        // ==========================================
        // MOCKING DEPENDENCIES (To make this single file work)
        // In your real Next.js code, use your original imports.
        // ==========================================
        const { useState, useEffect } = React;
        
        // Mock Router
        const useRouter = () => ({
            push: (path) => { console.log(`Navigating to: ${path}`); window.location.hash = path; }
        });

        // Mock Toast
        const toast = {
            success: (title, opts) => alert(`✅ ${title}: ${opts?.description}`),
            error: (title, opts) => alert(`❌ ${title}: ${opts?.description}`)
        };

        // Mock Supabase
        const supabase = {
            auth: {
                signInWithPassword: async ({ email, password }) => {
                    // Simulate network delay
                    await new Promise(r => setTimeout(r, 1000));
                    // Simulate error for specific email to test fallback, otherwise success
                    if (email === 'error@test.com') return { error: { message: 'Invalid credentials' } };
                    return { data: { user: { id: 'user_123' } }, error: null };
                },
                resetPasswordForEmail: async () => {
                    await new Promise(r => setTimeout(r, 1000));
                    return { error: null };
                },
                signUp: async ({ email, password }) => {
                    return { data: { user: { id: 'admin_123' } } };
                }
            },
            from: (table) => ({
                select: () => ({
                    eq: () => ({
                        single: async () => {
                            await new Promise(r => setTimeout(r, 500));
                            // Mock data based on table name for demo
                            if (table === 'admins') return { data: { id: 'admin_123' }, error: null };
                            if (table === 'clients') return { data: { id: 'client_123' }, error: null };
                            if (table === 'members') return { data: { id: 'member_123', role: 'member' }, error: null };
                            return { data: null, error: new Error('Not found') };
                        }
                    })
                }),
                upsert: async () => ({ error: null })
            })
        };

        // Mock Lucide Icons as simple functional components
        const Icon = ({ path, className }) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
                {path}
            </svg>
        );
        
        const Loader2 = ({ className }) => <Icon className={className} path={<><path d="M21 12a9 9 0 1 1-6.219-8.56"/></>} />;
        const Lock = ({ className }) => <Icon className={className} path={<><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />;
        const Mail = ({ className }) => <Icon className={className} path={<><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>} />;
        const Eye = ({ className }) => <Icon className={className} path={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>} />;
        const EyeOff = ({ className }) => <Icon className={className} path={<><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.986 0 1.925-.135 2.803-.386"/><line x1="2" x2="22" y1="2" y2="22"/></>} />;
        const ShieldCheck = ({ className }) => <Icon className={className} path={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></>} />;
        const CheckCircle2 = ({ className }) => <Icon className={className} path={<><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></>} />;
        const Building2 = ({ className }) => <Icon className={className} path={<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></>} />;

        // ==========================================
        // YOUR ORIGINAL LOGIC (START)
        // ==========================================
        export default function LoginPage() {
          const router = useRouter();
          const [loading, setLoading] = useState(false);
          const [resetLoading, setResetLoading] = useState(false);
          const [showPassword, setShowPassword] = useState(false);
          const [formData, setFormData] = useState({ email: '', password: '' });

          /* ================= AUTH LOGIC ================= */

          const handleAuth = async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
              });

              if (error) {
                if (
                  formData.email === 'admin@saanify.com' &&
                  error.message.includes('Invalid')
                ) {
                  await createSuperAdmin();
                  return;
                }
                throw error;
              }

              if (data.user) {
                await checkRoleAndRedirect(data.user.id);
              }
            } catch {
              toast.error('Access Denied', {
                description: 'Invalid credentials or account inactive.',
              });
              setLoading(false);
            }
          };

          const checkRoleAndRedirect = async (userId) => {
            try {
              const { data: admin } = await supabase
                .from('admins')
                .select('*')
                .eq('id', userId)
                .single();
              if (admin) {
                localStorage.setItem('admin_session', 'true');
                router.push('/admin');
                return;
              }

              const { data: client } = await supabase
                .from('clients')
                .select('*')
                .eq('id', userId)
                .single();
              if (client) {
                localStorage.setItem('current_user', JSON.stringify(client));
                router.push('/dashboard');
                return;
              }

              const { data: member } = await supabase
                .from('members')
                .select('*')
                .eq('auth_user_id', userId)
                .single();

              if (member) {
                localStorage.setItem('current_member', JSON.stringify(member));
                router.push(member.role === 'treasurer' ? '/treasurer' : '/member');
                return;
              }

              throw new Error();
            } catch {
              toast.error('Login Failed', {
                description: 'Profile not linked.',
              });
              setLoading(false);
            }
          };

          const handleForgotPassword = async () => {
            if (!formData.email) {
              toast.error('Email Required', { description: 'Please enter your email.' });
              return;
            }
            setResetLoading(true);
            
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/update-password`,
              });

              if (error) throw error;
              toast.success('Password reset link sent', { description: 'Check your email inbox.' });
            } catch (error) {
              toast.error('Error', { description: error.message });
            } finally {
              setResetLoading(false);
            }
          };

          const createSuperAdmin = async () => {
            const { data } = await supabase.auth.signUp({
              email: formData.email,
              password: formData.password,
            });
            if (data.user) {
              await supabase
                .from('admins')
                .upsert([{ id: data.user.id, email: formData.email }]);
              router.push('/admin');
            }
          };

          /* ================= UI START (MODERNIZED) ================= */

          return (
            <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 overflow-hidden relative">

              {/* BACKGROUND DECORATIONS (Modern Touch) */}
              <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72
