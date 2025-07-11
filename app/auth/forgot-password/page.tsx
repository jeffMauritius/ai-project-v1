"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotFound(false);
    setSubmitted(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.exists) {
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
              Cette adresse email n'est pas dans notre système.<br />
              Vous pouvez créer un compte via le lien ci-dessous.
            </p>
            <Link href="/auth/register" className="text-pink-600 dark:text-pink-400 underline">
              Créer un compte
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                placeholder="Votre adresse email"
              />
            </div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Envoyer le lien de réinitialisation
            </button>
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-2">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
} 