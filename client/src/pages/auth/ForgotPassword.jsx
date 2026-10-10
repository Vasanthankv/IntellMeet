import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    setIsSubmitted(true);
    toast.success('Reset link sent to your email.');
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Reset Password</h2>
        <p className="mt-2 text-sm text-gray-600">
          {isSubmitted ? "Check your email for the reset link" : "Enter your email to receive a password reset link"}
        </p>
      </div>

      {!isSubmitted ? (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                className="pl-10"
                {...register("email", { required: "Email is required" })}
                error={errors.email?.message}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
            Try another email
          </Button>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/login" className="inline-flex items-center font-medium text-primary-600 hover:text-primary-500">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
