'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loginMode, setLoginMode] = useState<'password' | 'magic-link'>('password');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setMessage(`登录失败: ${decodeURIComponent(error)}`);
    }
  }, [searchParams]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 提供更友好的错误提示
      if (error.message.includes('Invalid login credentials')) {
        setMessage('登录失败: 邮箱或密码错误。如果刚注册，请先检查邮箱并点击确认链接激活账户。');
      } else if (error.message.includes('Email not confirmed')) {
        setMessage('登录失败: 请先检查邮箱并点击确认链接激活账户。');
      } else {
        setMessage(`登录失败: ${error.message}`);
      }
      setLoading(false);
    } else {
      router.push('/items');
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`错误: ${error.message}`);
      setLoading(false);
    } else {
      setMessage('登录链接已发送到您的邮箱，请查收并点击链接完成登录。');
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!password || password.length < 6) {
      setMessage('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      // 如果用户已存在，提示直接登录
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        setMessage('该邮箱已注册，请直接使用密码登录。如果忘记密码，请使用"邮箱链接登录"重置。');
      } else {
        setMessage(`注册失败: ${error.message}`);
      }
      setLoading(false);
    } else {
      // 检查是否有 session（不需要邮箱确认时会直接返回 session）
      if (data.session) {
        // 直接登录成功
        setMessage('注册成功！正在登录...');
        setTimeout(() => {
          router.push('/items');
        }, 500);
      } else if (data.user) {
        // 需要确认邮箱（虽然已关闭，但可能 Supabase 还是发送了确认邮件）
        setMessage('注册成功！由于邮箱确认已关闭，请直接使用密码登录。');
        setLoading(false);
        // 等待一下让用户看到消息，然后尝试自动登录
        setTimeout(async () => {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!loginError) {
            router.push('/items');
          }
        }, 1000);
      } else {
        setMessage('注册成功！请使用密码登录。');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            个人电子衣柜
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登录你的账户
          </p>
        </div>

        {/* 登录方式切换 */}
        <div className="flex gap-2 border-b">
          <button
            type="button"
            onClick={() => {
              setLoginMode('password');
              setMessage('');
            }}
            className={`flex-1 py-2 text-sm font-medium ${
              loginMode === 'password'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            密码登录
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('magic-link');
              setMessage('');
            }}
            className={`flex-1 py-2 text-sm font-medium ${
              loginMode === 'magic-link'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            邮箱链接登录
          </button>
        </div>

        {loginMode === 'password' ? (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="请输入邮箱地址"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="请输入密码"
              />
            </div>

            {message && (
              <div className={`text-sm ${message.includes('错误') || message.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '登录中...' : '登录'}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="w-full py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                首次使用？注册账户
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleMagicLinkLogin}>
            <div>
              <label htmlFor="email-magic" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                id="email-magic"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="请输入邮箱地址"
              />
            </div>

            {message && (
              <div className={`text-sm ${message.includes('错误') || message.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '发送中...' : '发送登录链接'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600 mb-2">加载中...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

