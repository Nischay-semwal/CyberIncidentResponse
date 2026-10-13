import { FormEvent, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type LoginPageProps = {
  onLogin: () => void;
};

export default function LoginPage({
  onLogin,
}: LoginPageProps) {
  const [email, setEmail] = useState("student@test.com");
  const [password, setPassword] = useState("TestPassword123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "Login failed"
        );
      }

      onLogin();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold">
          Cyber Incident Response Simulator
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Student Login
        </p>

        <div className="mt-6">
          <label className="text-sm text-slate-300">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500"
            required
          />
        </div>

        <div className="mt-4">
          <label className="text-sm text-slate-300">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-slate-500"
            required
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}