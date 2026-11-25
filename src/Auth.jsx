import React, { useState } from 'react';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ id, label, error, type = 'text', value, onChange, autoComplete, inputMode }) {
  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required
      />
      {error && <span className="auth-field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

function PasswordField({ id, label, error, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`auth-field auth-password-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-input">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <span className="auth-field-error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

function AuthLayout({ children, view, onNavigate }) {
  const title = view === 'register' ? 'A more thoughtful ritual.' : 'Care begins with you.';
  return (
    <section className="auth-page" aria-label="DERMIQT account">
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=85"
          alt="A natural beauty portrait in warm, soft studio light"
        />
        <div className="auth-visual-shade" />
        <a className="auth-visual-brand" href="#home" onClick={(event) => {
          event.preventDefault();
          onNavigate('home');
        }}>DERMIQT<span>.</span></a>
        <div className="auth-visual-copy">
          <p className="eyebrow">Skincare, considered</p>
          <h1>{title}</h1>
          <p>Intelligent care, made personal. Welcome to a quieter kind of skincare.</p>
        </div>
        <span className="auth-visual-caption">A little space to come back to yourself.</span>
      </div>
      <div className="auth-form-side">
        <a className="auth-mobile-brand" href="#home" onClick={(event) => {
          event.preventDefault();
          onNavigate('home');
        }}>DERMIQT<span>.</span></a>
        {children}
      </div>
    </section>
  );
}

function AuthNotice({ children, type = 'success' }) {
  if (!children) return null;
  return <p className={`auth-notice auth-notice-${type}`} role={type === 'error' ? 'alert' : 'status'}>{children}</p>;
}

export default function AuthPage({
  view,
  user,
  notice,
  onNavigate,
  onLogin,
  onRegister,
  onForgotPassword,
  onLogout,
}) {
  const [values, setValues] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    remember: true,
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: '' }));
      setFormError('');
    };
  }

  async function submitLogin(event) {
    event.preventDefault();
    const nextErrors = {};
    const email = values.email.trim().toLowerCase();
    if (!email) nextErrors.email = 'Enter your email address.';
    else if (!emailPattern.test(email)) nextErrors.email = 'Enter a valid email address.';
    if (!values.password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    const result = await onLogin({ email, password: values.password, remember: values.remember });
    setSubmitting(false);
    if (!result.success) setFormError(result.message);
  }

  async function submitRegistration(event) {
    event.preventDefault();
    const nextErrors = {};
    const email = values.email.trim().toLowerCase();
    if (!values.name.trim()) nextErrors.name = 'Enter your full name.';
    if (!email) nextErrors.email = 'Enter your email address.';
    else if (!emailPattern.test(email)) nextErrors.email = 'Enter a valid email address.';
    const mobileDigits = values.mobile.replace(/\D/g, '');
    if (!values.mobile.trim()) nextErrors.mobile = 'Enter your mobile number.';
    else if (mobileDigits.length < 10 || mobileDigits.length > 15) nextErrors.mobile = 'Enter a valid phone number (10–15 digits).';
    if (values.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (values.confirmPassword !== values.password) nextErrors.confirmPassword = 'Passwords do not match.';
    if (!values.terms) nextErrors.terms = 'Please accept the terms to continue.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    const result = await onRegister({
      name: values.name.trim(),
      email,
      mobile: values.mobile.trim(),
      password: values.password,
    });
    setSubmitting(false);
    if (!result.success) setFormError(result.message);
  }

  async function submitForgotPassword(event) {
    event.preventDefault();
    const email = values.email.trim().toLowerCase();
    const nextErrors = {};
    if (!email) nextErrors.email = 'Enter your email address.';
    else if (!emailPattern.test(email)) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    setFormError('');
    setFormNotice('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    const result = await onForgotPassword(email);
    setSubmitting(false);
    if (result.success) setFormNotice(result.message);
    else setFormError(result.message);
  }

  if (view === 'account' && user) {
    return (
      <AuthLayout view="account" onNavigate={onNavigate}>
        <div className="auth-form-content auth-account">
          <p className="eyebrow">Your DERMIQT</p>
          <h2>Welcome, {user.name.split(' ')[0]}.</h2>
          <p className="auth-intro">Your account, and your considered skincare essentials, all in one place.</p>
          {notice && <AuthNotice>{notice}</AuthNotice>}
          <div className="auth-account-card">
            <span>Account details</span>
            <strong>{user.name}</strong>
            <p>{user.email}</p>
            {user.mobile && <p>{user.mobile}</p>}
          </div>
          <p className="auth-demo-disclaimer">This is a frontend-only demo account. It is not connected to a secure authentication service.</p>
          <button type="button" className="auth-submit" onClick={onLogout}>Log out</button>
          <button type="button" className="auth-text-button" onClick={() => onNavigate('home')}>Continue shopping</button>
        </div>
      </AuthLayout>
    );
  }

  if (view === 'forgot') {
    return (
      <AuthLayout view="forgot" onNavigate={onNavigate}>
        <div className="auth-form-content">
          <p className="eyebrow">Account assistance</p>
          <h2>Forgot your password?</h2>
          <p className="auth-intro">Enter the email address linked to your account and we’ll show a reset confirmation for this demo.</p>
          {notice && <AuthNotice>{notice}</AuthNotice>}
          <AuthNotice type="error">{formError}</AuthNotice>
          <AuthNotice>{formNotice}</AuthNotice>
          <form className="auth-form" onSubmit={submitForgotPassword} noValidate>
            <Field id="forgot-email" label="Email address" type="email" autoComplete="email" value={values.email} onChange={update('email')} error={errors.email} />
            <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? 'Please wait…' : 'Continue'}</button>
          </form>
          <button type="button" className="auth-text-button" onClick={() => onNavigate('login')}>Back to login</button>
          <p className="auth-demo-disclaimer">Demo only: no email is sent and no password is changed.</p>
        </div>
      </AuthLayout>
    );
  }

  const isRegister = view === 'register';
  return (
    <AuthLayout view={view} onNavigate={onNavigate}>
      <div className="auth-form-content">
        <p className="eyebrow">{isRegister ? 'Join DERMIQT' : 'Your personal ritual'}</p>
        <h2>{isRegister ? 'Create your account.' : 'Welcome back.'}</h2>
        <p className="auth-intro">{isRegister ? 'A considered approach to skincare starts here.' : 'Sign in to pick up where your ritual left off.'}</p>
        {notice && <AuthNotice>{notice}</AuthNotice>}
        <AuthNotice type="error">{formError}</AuthNotice>
        <form className="auth-form" onSubmit={isRegister ? submitRegistration : submitLogin} noValidate>
          {isRegister && (
            <Field id="register-name" label="Full name" autoComplete="name" value={values.name} onChange={update('name')} error={errors.name} />
          )}
          <Field id={`${isRegister ? 'register' : 'login'}-email`} label="Email address" type="email" autoComplete="email" value={values.email} onChange={update('email')} error={errors.email} />
          {isRegister && (
            <Field id="register-mobile" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" value={values.mobile} onChange={update('mobile')} error={errors.mobile} />
          )}
          <PasswordField id={`${isRegister ? 'register' : 'login'}-password`} label="Password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={values.password} onChange={update('password')} error={errors.password} />
          {isRegister && (
            <>
              <PasswordField id="register-confirm-password" label="Confirm password" autoComplete="new-password" value={values.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} />
              <div className="auth-checkbox-row auth-terms-row">
                <label><input type="checkbox" checked={values.terms} onChange={update('terms')} aria-invalid={Boolean(errors.terms)} /> <span>I agree to the <a href="#terms" onClick={(event) => event.preventDefault()}>terms and conditions</a>.</span></label>
                {errors.terms && <span className="auth-field-error">{errors.terms}</span>}
              </div>
            </>
          )}
          {!isRegister && (
            <div className="auth-login-options">
              <label className="auth-checkbox-row"><input type="checkbox" checked={values.remember} onChange={update('remember')} /> <span>Remember me</span></label>
              <button type="button" className="auth-inline-link" onClick={() => onNavigate('forgot')}>Forgot password?</button>
            </div>
          )}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to DERMIQT?'}
          <button type="button" onClick={() => onNavigate(isRegister ? 'login' : 'register')}>{isRegister ? 'Log in' : 'Create an account'}</button>
        </p>
        <p className="auth-demo-disclaimer">Frontend demo authentication only. Account details are stored in this browser and are not secure for real-world use.</p>
      </div>
    </AuthLayout>
  );
}
