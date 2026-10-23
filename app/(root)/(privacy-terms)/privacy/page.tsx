import type { Metadata } from "next";
import LegalDocument, { type LegalSection } from "@/components/Legal/LegalConfig";
import { LEGAL } from "@/constants/legal-config";

export const metadata: Metadata = {
  title: "Privacy Policy | NekkoDojo",
  description: "What information NekkoDojo collects, why, and the choices you have.",
};

const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {LEGAL.serviceName} (“we”, “us”) is operated by {LEGAL.operator}. This policy explains
          what personal information we collect when you use {LEGAL.serviceName}, how we use it, and
          the choices you have.
        </p>
        <p>
          For privacy questions or requests, contact us at {mail}. {LEGAL.address}
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p>We collect the following kinds of information.</p>
        <ul>
          <li>
            <strong>Account information.</strong> Your email address, username, name, password (held
            by our authentication provider, not by us in readable form) and profile image. If you
            sign in with Google or GitHub, we receive the basic profile details those services share
            with us.
          </li>
          <li>
            <strong>Profile information you add.</strong> For example, links to your social profiles
            or websites.
          </li>
          <li>
            <strong>Learning activity.</strong> Which problems you have attempted or completed, the
            shelves you place problems on, your belt and rank, and your bookmarks.
          </li>
          <li>
            <strong>Content you create.</strong> Discussion posts, comments and messages you send in
            community features and in NekkoChat.
          </li>
          <li>
            <strong>Code you submit.</strong> Code you run or submit while solving problems, and the
            results of running it.
          </li>
          <li>
            <strong>Technical information.</strong> Your IP address, browser and device type, pages
            visited, and error and security logs.
          </li>
        </ul>
        <p>
          You choose what to put in optional fields. We do not need, and ask you not to submit,
          sensitive personal information such as government identifiers or financial details.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How we use information",
    body: (
      <>
        <p>We use personal information to:</p>
        <ul>
          <li>create and secure your account and sign you in;</li>
          <li>run the service: track your progress, run your code, and show your profile;</li>
          <li>provide community features, and keep them safe by enforcing our rules;</li>
          <li>keep the service reliable, investigate abuse, and prevent fraud and attacks;</li>
          <li>communicate with you about your account and important changes;</li>
          <li>improve {LEGAL.serviceName} and fix problems; and</li>
          <li>comply with legal obligations.</li>
        </ul>
      </>
    ),
  },
  {
    id: "legal-bases",
    title: "Legal bases",
    body: (
      <p>
        Where data protection law such as the GDPR applies, we rely on: performing our agreement
        with you (providing the service you signed up for); our legitimate interests (security,
        preventing abuse, and improving the service), balanced against your rights; your consent
        where we ask for it, which you can withdraw at any time; and compliance with legal
        obligations.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "How we share information",
    body: (
      <>
        <p>
          <strong>Public information.</strong> Your username, profile image, the social links you
          add, and your public activity and content may be visible to other members and, depending
          on the page, to anyone who visits.
        </p>
        <p>
          <strong>Service providers.</strong> We use trusted providers to operate the service, for
          example for authentication, hosting, databases and code execution. They may process
          personal information only on our behalf and under agreements that protect it.
        </p>
        <p>
          <strong>Legal and safety.</strong> We may disclose information when required by law, or
          when needed to protect the rights, safety and security of our members, the public or the
          service.
        </p>
        <p>
          <strong>Business changes.</strong> If the service is merged, acquired or sold, personal
          information may be transferred as part of that transaction, and we will tell you if your
          information becomes subject to a different policy.
        </p>
        <p>We do not sell your personal information.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and similar technologies",
    body: (
      <>
        <p>
          We use cookies and similar storage that are necessary to keep you signed in, protect your
          account, and remember your settings. These cannot be switched off without breaking the
          service.
        </p>
        <p>
          [If you use analytics or advertising cookies, describe them here and explain how members
          can opt out. Remove this note if you do not.]
        </p>
        <p>
          You can control cookies in your browser settings, but blocking essential cookies will
          prevent you from signing in.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep information",
    body: (
      <p>
        We keep your information while your account is active. If you delete your account we will
        delete or anonymise your personal information within a reasonable period, except where we
        must keep some of it to meet legal obligations, resolve disputes, or enforce our rules.
        Backups are overwritten on their normal schedule. [Add specific retention periods if you
        have them.]
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use reasonable technical and organisational measures to protect personal information,
        including encrypted connections and access controls. No system is completely secure, so we
        cannot guarantee absolute security. Please use a strong, unique password and tell us
        promptly if you think your account has been compromised.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>access the personal information we hold about you;</li>
          <li>correct information that is inaccurate;</li>
          <li>delete your information or your account;</li>
          <li>receive a copy of your information in a portable format;</li>
          <li>object to or restrict certain processing; and</li>
          <li>withdraw consent where processing is based on consent.</li>
        </ul>
        <p>
          You can update much of your information in your profile settings. For anything else, or to
          make a request, email {mail}. We may need to verify your identity first. You also have the
          right to complain to your local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        {LEGAL.serviceName} is not intended for anyone under {LEGAL.minAge}. We do not knowingly
        collect personal information from children under that age. If you believe a child has given
        us personal information, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        We and our providers may process information in countries other than your own. Where
        required, we use safeguards such as standard contractual clauses to protect information
        transferred across borders.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. If we make significant changes we will tell you
        in the service or by email, and we will update the date at the top of this page. Using the
        service after a change takes effect means you accept the updated policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: <p>Questions about this policy or your information? Email {mail}.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro="What we collect, why we collect it, and the control you have over it."
      summary={[
        "We collect what is needed to run your account, track your progress and keep the community safe.",
        "Your username, profile image and the links you add can be seen by other members.",
        "We use trusted providers to operate the service, and we do not sell your personal information.",
        "You can ask us to access, correct or delete your information at any time.",
      ]}
      sections={SECTIONS}
      related={[
        { label: "Terms of Service", href: "/terms" },
        { label: "Community Guidelines", href: "/community-guidelines" },
      ]}
    />
  );
}
