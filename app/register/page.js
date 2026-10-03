'use client';
// app/register/page.js — Re-exports SignupPage for backwards compatibility

import SignupPage from '@/app/signup/page';

export default function RegisterPage() {
  return <SignupPage />;
}
