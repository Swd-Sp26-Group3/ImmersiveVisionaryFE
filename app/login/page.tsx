'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard/customer");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0f1e]">
      <div className="w-full max-w-[440px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-base">Sign in to your Immersive Visionary account</p>
        </div>

        {/* Login Card - Bỏ h-[380px] và m-8 */}
        <div className="bg-[#161b33]/60 border border-purple-500/20 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          
          {/* Sign In Header - Xóa margin m-8 */}
          <div className="mb-8">
            <h2 className="text-white text-2xl font-semibold mb-1">Sign In</h2>
            <p className="text-gray-400 text-sm italic">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-[#0d1225]/80 border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500 rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-[#0d1225]/80 border-purple-500/20 text-white placeholder:text-gray-600 focus:border-purple-500 rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-700 bg-[#0d1225] text-indigo-600 focus:ring-0" 
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-[#5145fa] hover:bg-[#4338ca] text-white h-11 text-base font-semibold rounded-lg mt-2 transition-all active:scale-[0.98]"
            >
              Sign In
            </Button>

            {/* Footer Sign up */}
            <div className="text-center text-sm text-gray-400 mt-4">
              Don't have an account?{" "}
              <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold underline-offset-4 hover:underline">
                Sign up now
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom Terms */}
        <p className="text-center text-[12px] text-gray-500 mt-8 opacity-70">
          By signing in, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}