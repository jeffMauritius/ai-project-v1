"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validation-schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError("");
    setNotFound(false);
    setSubmitted(false);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const responseData = await res.json();
      
      if (responseData.exists) {
        setSubmitted(true);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Mot de passe oublié
        </h2>
        {submitted ? (
          <p className="text-green-600 dark:text-green-400 text-center mt-4">
            Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.
          </p>
        ) : notFound ? (
          <div className="text-center mt-4">
            <p className="text-red-600 dark:text-red-400 mb-2">
              Cette adresse email n&apos;est pas dans notre système.<br />
              Vous pouvez créer un compte via le lien ci-dessous.
            </p>
            <Link href="/auth/register" className="text-pink-600 dark:text-pink-400 underline">
              Créer un compte
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Adresse email
              </Label>
              <Input
                id="email"
                type="text"
                autoComplete="email"
                placeholder="Votre adresse email"
                className={`mt-1 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </Button>
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-2">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
} 