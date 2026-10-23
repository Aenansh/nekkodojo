import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export const metadata = { title: "Signing In" };

const page = () => {
  return (
    <>
      <div id="clerk-captcha" className="self-center" />
      <AuthenticateWithRedirectCallback />
    </>
  );
};

export default page;
