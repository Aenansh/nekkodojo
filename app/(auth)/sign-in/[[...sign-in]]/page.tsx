import SignInPage from "../_components/SignInPage";

export const metadata = { title: "Sign In" };

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0f0b0a] font-sans text-[#eaddcf]">
      <SignInPage />
    </div>
  );
}
