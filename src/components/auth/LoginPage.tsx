import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import merkleLogo from '@/assets/logo.png';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [emailError, setEmailError] = useState<string>('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Final validation for allowed domains
    const allowed = ['merkle.com', 'dentsu.com'];
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (!allowed.includes(domain)) {
      setEmailError('Only @merkle.com and @dentsu.com emails are allowed');
      toast.error('Only @merkle.com and @dentsu.com emails are allowed');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created! You can now log in.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmailDomain = (value: string) => {
    setEmail(value);
    if (!value.includes('@')) {
      setEmailError('Invalid email');
      return;
    }
    const allowed = ['merkle.com', 'dentsu.com'];
    const domain = value.split('@')[1]?.toLowerCase() || '';
    if (!allowed.includes(domain)) {
      setEmailError('Only @merkle.com and @dentsu.com emails are allowed');
    } else {
      setEmailError('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary merkle-pattern">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <img
            src={merkleLogo}
            alt="Merkle - a dentsu company"
            className="h-16 mx-auto mb-4"
          />
        </CardHeader>
        
        <CardContent className="pt-4">
          <h2 className="text-xl font-bold text-center text-foreground mb-6">
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="border-b border-t-0 border-l-0 border-r-0 rounded-none focus:ring-0 px-0"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email ID</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => validateEmailDomain(e.target.value)}
                placeholder="Enter your email"
                required
                className="border-b border-t-0 border-l-0 border-r-0 rounded-none focus:ring-0 px-0"
              />
              {emailError && (
                <p className="text-sm text-destructive mt-1">{emailError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="border-b border-t-0 border-l-0 border-r-0 rounded-none focus:ring-0 px-0"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 mt-6"
              disabled={isLoading || !!emailError || !email}
            >
              {isLoading ? 'Please wait...' : isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center text-sm text-muted-foreground pt-4">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-accent hover:underline mb-4"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
          
          <p className="text-center">
            For any help or queries, please write to{' '}
            <a href="mailto:kunal.puri@dentsu.com" className="text-accent hover:underline">
              kunal.puri@dentsu.com
            </a>
          </p>
          <a href="#" className="text-accent hover:underline mt-2">
            Responsible disclosure
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
