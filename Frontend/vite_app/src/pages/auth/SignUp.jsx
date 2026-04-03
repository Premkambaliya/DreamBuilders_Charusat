import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleCheckBig } from "lucide-react";

const initialForm = {
  fullName: "",
  email: "",
  companyName: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

const Signup = ({ onSignup, isAuthenticated }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onChange = (field) => (event) => {
    const value = field === "acceptTerms" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.acceptTerms) {
      setError("Please accept Terms and Privacy Policy to continue.");
      return;
    }

    setError("");

    try {
      setIsSubmitting(true);
      if (onSignup) {
        await onSignup({
          name: form.fullName,
          email: form.email,
          companyName: form.companyName,
          password: form.password,
        });
      }

      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Unable to create account right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-5 relative" style={{ backgroundImage: "linear-gradient(rgba(10, 11, 20, 0.8), rgba(10, 11, 20, 0.9)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
      <section className="w-full max-w-[960px] min-h-[620px] grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] rounded-[20px] overflow-hidden border border-gray-800 shadow-2xl bg-[#0a0b14]/90 animate-[fade-in-up_0.5s_ease-out]">
        
        {/* Intro Sidebar */}
        <aside className="relative p-8 lg:border-r border-b lg:border-b-0 border-gray-800" style={{ background: "linear-gradient(145deg, rgba(108, 99, 255, 0.17), rgba(0, 212, 170, 0.08)), radial-gradient(circle at 80% 20%, rgba(255, 179, 71, 0.2), transparent 36%), #0f1221" }}>
          <div className="absolute w-[220px] h-[220px] rounded-full bg-[#4cc9f0]/15 blur-[22px] right-[-35px] bottom-[-45px] pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
            <strong className="tracking-[0.06em] text-[0.85rem] text-gray-400 uppercase">SalesIQ</strong>
          </div>
          
          <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold text-white leading-[1.15] mb-3">Start your AI sales intelligence workspace</h2>
          <p className="text-gray-300 max-w-[40ch] mb-6">Create an account in under a minute and analyze your first call right away.</p>

          <ul className="grid gap-3 mt-5">
            <li className="flex items-start gap-2.5 text-gray-400 text-[0.9rem]"><CircleCheckBig size={15} className="mt-[3px] text-emerald-400" /> Add teammates later without blocking setup</li>
            <li className="flex items-start gap-2.5 text-gray-400 text-[0.9rem]"><CircleCheckBig size={15} className="mt-[3px] text-emerald-400" /> Upload first call immediately after signup</li>
            <li className="flex items-start gap-2.5 text-gray-400 text-[0.9rem]"><CircleCheckBig size={15} className="mt-[3px] text-emerald-400" /> Track deals, risks, and coaching insights</li>
          </ul>
        </aside>

        {/* Form Area */}
        <div className="p-8 flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-white mb-1.5">Create Account</h1>
          <p className="text-gray-400 mb-5">Set up your workspace details to begin.</p>

          <form className="grid gap-3.5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-medium text-gray-300" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-[#161829] border border-gray-700 rounded-lg text-white text-[0.95rem] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Your name"
                  value={form.fullName}
                  onChange={onChange("fullName")}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-medium text-gray-300" htmlFor="email">Work Email</label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3.5 py-2.5 bg-[#161829] border border-gray-700 rounded-lg text-white text-[0.95rem] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={onChange("email")}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-medium text-gray-300" htmlFor="companyName">Company</label>
              <input
                id="companyName"
                type="text"
                className="w-full px-3.5 py-2.5 bg-[#161829] border border-gray-700 rounded-lg text-white text-[0.95rem] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="Company name"
                value={form.companyName}
                onChange={onChange("companyName")}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-medium text-gray-300" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-3.5 py-2.5 bg-[#161829] border border-gray-700 rounded-lg text-white text-[0.95rem] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={onChange("password")}
                  required
                  minLength={8}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-medium text-gray-300" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full px-3.5 py-2.5 bg-[#161829] border border-gray-700 rounded-lg text-white text-[0.95rem] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={onChange("confirmPassword")}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-gray-400 text-[0.85rem] cursor-pointer mt-1" htmlFor="acceptTerms">
              <input
                id="acceptTerms"
                type="checkbox"
                className="accent-indigo-500 w-4 h-4 cursor-pointer"
                checked={form.acceptTerms}
                onChange={onChange("acceptTerms")}
              />
              I agree to Terms of Service and Privacy Policy.
            </label>

            {error ? (
              <p className="text-red-400 text-[0.84rem]">{error}</p>
            ) : null}

            <button className="mt-1.5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-gray-400 text-[0.86rem]">
            Already have an account? <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">Login</Link>
          </p>
          <Link to="/" className="mt-3 inline-block text-gray-400 text-[0.85rem] hover:text-white transition-colors">Back to landing page</Link>
        </div>
      </section>
    </div>
  );
};

export default Signup;