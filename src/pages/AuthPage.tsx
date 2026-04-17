import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail } from "lucide-react";
import storvoLogo from "@/assets/storvo-logo.png";

const AuthPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const defaultMode = params.get("mode") === "signup" ? false : true;
  const redirectTo = params.get("redirect") || "/dashboard";
  const partnerSlug = params.get("partner");

  // Save partner slug to sessionStorage so StoreSetup can pick it up on store creation
  if (partnerSlug) {
    sessionStorage.setItem("storvo_partner", partnerSlug);
  }

  const [isLogin, setIsLogin] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, user, navigate, redirectTo]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Check your email for the password reset link!");
      setShowForgot(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingConfirmEmail) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingConfirmEmail,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success("Confirmation email resent - check your inbox and spam folder.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setPendingConfirmEmail(email);
            toast.error("Email not yet confirmed. Check your inbox or resend below.");
          } else {
            throw error;
          }
          return;
        }
        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setPendingConfirmEmail(email);
          toast.success(
            "Account created! Check your inbox (and spam) for a confirmation link.",
            { duration: 12000 }
          );
          setIsLogin(true);
        } else {
          toast.success("Account created! Let's set up your store.");
          navigate("/setup");
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4">
      <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] glow-indigo" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[500px] glow-purple" />

      <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-card">
        <div className="mb-8 flex justify-center">
          <button onClick={() => navigate("/")}>
            <img src={storvoLogo} alt="Storvo" className="h-8" />
          </button>
        </div>

        <h1 className="mb-2 text-center font-display text-2xl font-bold text-foreground">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Sign in to manage your store" : "Start selling in minutes"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required={!isLogin}
                data-testid="input-full-name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              data-testid="input-email"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="pr-10"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            disabled={loading}
            data-testid="button-submit-auth"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          {isLogin && (
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="mt-3 w-full text-center text-sm font-medium text-storvo-indigo hover:underline"
              data-testid="button-forgot-password"
            >
              Forgot password?
            </button>
          )}
        </form>

        {/* Email confirmation pending */}
        {pendingConfirmEmail && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Confirm your email to continue
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  We sent a link to <strong>{pendingConfirmEmail}</strong>. Check your inbox and spam folder.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  data-testid="button-resend-confirmation"
                >
                  {resendLoading ? "Sending..." : "Resend confirmation email"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showForgot && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Reset your password</p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <Input
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                required
                data-testid="input-reset-email"
              />
              <div className="flex gap-2">
                <Button variant="hero" size="sm" className="flex-1" disabled={resetLoading} data-testid="button-send-reset">
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowForgot(false)} type="button" data-testid="button-cancel-reset">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-storvo-indigo hover:underline"
            data-testid="button-toggle-auth-mode"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
