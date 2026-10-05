import { Link, useLocation } from "react-router-dom";

const legalPages = {
  "/privacy": {
    kicker: "YOUR INFORMATION",
    title: "Privacy Notice",
    intro: "This notice explains how Everest Butchery uses personal information when you browse the site, create an account, contact us, place an order or take part in a campaign.",
    sections: [
      {
        title: "Who is responsible",
        paragraphs: [
          "Everest Butchery is the data controller for the processing described here. Our shop is at Islevhusvej 9, 2700 København, Denmark. Contact us at hello@everestbutchery.dk or +45 71 33 83 50.",
          "Registered legal business name and CVR: [Add the registered business name and CVR number before publishing this notice].",
        ],
      },
      {
        title: "Information we use",
        bullets: [
          "Account details: email address, name, sign-in provider and account/profile identifiers when you create an account or sign in with email or Google.",
          "Order details: name, phone number, optional email, delivery address and postal code when needed, items, quantities, prices, fulfilment choice, requested time and any notes you provide.",
          "Support messages: contact details and the information you choose to share when you contact the shop.",
          "Campaign game details, when that feature is enabled: player name, optional phone number, a generated player key, points and game activity. The public leaderboard may show a player name and score.",
          "Technical information: basic request, device and security logs processed by hosting and service providers to operate and protect the site.",
        ],
      },
      {
        title: "Why we use it and our legal grounds",
        bullets: [
          "To provide accounts, respond to requests and prepare or fulfil orders: necessary to provide the service or take steps you request before a contract.",
          "To keep required sales and bookkeeping records: compliance with legal obligations. Danish bookkeeping records are generally retained for five years from the end of the relevant financial year, subject to applicable exceptions.",
          "To protect the site, prevent misuse and maintain a fair campaign leaderboard: our legitimate interests, balanced against your rights.",
          "Where processing is based on consent, you may withdraw consent at any time. Withdrawal does not affect processing that already took place lawfully.",
        ],
      },
      {
        title: "Service providers and sharing",
        paragraphs: [
          "We use service providers to run the site and its features. These may include Vercel for hosting, Supabase for account authentication and the shop database, Google when you choose Google Sign-In, and an email provider such as Brevo if custom authentication email delivery is enabled. Google Fonts and Bootstrap Icons are loaded from their providers. The Dashain game uses the shop's configured game backend when available.",
          "We do not sell personal information. Providers may process information for us under their own service terms and, where required, a data-processing agreement. Some providers may process data outside the EEA; appropriate safeguards apply where legally required. We may also disclose information where the law requires it or to establish, exercise or defend legal claims.",
        ],
      },
      {
        title: "Browser storage and cookies",
        paragraphs: [
          "The site currently uses browser storage needed for its features: session storage for the cart and campaign booking details, and local storage for authentication session data and the campaign game identity. These are not used by this site for advertising or cross-site analytics. Google Sign-In and other third-party services may use their own technologies when you choose to use them.",
          "If we add non-essential analytics or advertising technologies, we will update this notice and request consent where required before they are used.",
        ],
      },
      {
        title: "How long we keep information",
        paragraphs: [
          "We keep account information while the account is active and for a reasonable period needed to handle security, disputes or legal claims. Order and accounting records are kept for the applicable Danish statutory retention period. Support messages are kept only as long as needed to resolve the request and document the outcome. Campaign game records are intended to be reset when the campaign ends; the current game code schedules a reset on 26 October 2026. Browser cart data is stored for the current browser session.",
          "We delete or anonymise information when it is no longer needed, unless law requires a longer retention period.",
        ],
      },
      {
        title: "Your choices and rights",
        paragraphs: [
          <>Depending on the circumstances, you may ask to access, correct, erase or restrict your personal information, object to certain processing, or receive portable data. Some rights have legal limits, for example where records must be retained by law. Read our <Link to="/gdpr">GDPR rights guide</Link> or contact us using the details above.</>,
          "You may also complain to the Danish Data Protection Agency (Datatilsynet). We encourage you to contact us first so we can try to resolve your concern.",
        ],
      },
      {
        title: "Changes to this notice",
        paragraphs: ["We may update this notice when the site or its data practices change. The date below shows when this version was last updated."],
      },
    ],
  },
  "/terms": {
    kicker: "SHOPPING WITH US",
    title: "Terms and Conditions",
    intro: "These terms explain how online order requests, pickup and local delivery work. Please read them before placing an order.",
    sections: [
      {
        title: "Seller and contact details",
        paragraphs: [
          "Everest Butchery, Islevhusvej 9, 2700 København, Denmark. Phone: +45 71 33 83 50. Email: hello@everestbutchery.dk. Registered legal business name and CVR: [Add the registered business name and CVR number before publishing these terms].",
        ],
      },
      {
        title: "Products, prices and availability",
        paragraphs: [
          "Product descriptions, units and prices are shown on the menu. Prices are displayed in Danish kroner (DKK). The unit shown beside a product determines how quantity is entered. Products are subject to availability; we will contact you if we cannot fulfil an item as requested.",
          "The checkout shows the order subtotal and any delivery fee before you submit. The current checkout delivery fee is 39 DKK. Pickup has no delivery fee. We do not collect card details or take online card payments through this website.",
        ],
      },
      {
        title: "Order requests and confirmation",
        paragraphs: [
          "Submitting checkout sends an order request. We will contact you to confirm availability and the pickup or delivery time. An order is not treated as accepted until Everest Butchery confirms it. Please provide accurate contact details so we can reach you.",
          "Checkout currently offers cash, card on handover and MobilePay as payment choices. Payment is made at pickup or delivery, not through an online payment processor on this site. A requested date or time is a preference until we confirm it.",
        ],
      },
      {
        title: "Pickup and delivery",
        paragraphs: [
          "Pickup and delivery options are shown in checkout. Delivery availability depends on the address and will be confirmed by the shop. We will contact you if we need to clarify an address or arrange a different time.",
        ],
      },
      {
        title: "Changes, cancellations and consumer rights",
        paragraphs: [
          "If you need to change or cancel an order, contact us as soon as possible by phone or email, before preparation begins. Meat and other perishable goods may be subject to exceptions to statutory withdrawal rights. This does not remove any rights you have where goods are faulty, incorrect or otherwise do not comply with the contract. We will explain any applicable withdrawal exception before an order is accepted. Nothing in these terms limits mandatory consumer rights under Danish or EU law.",
        ],
      },
      {
        title: "Complaints and support",
        paragraphs: [
          "For an order question or complaint, contact hello@everestbutchery.dk or call +45 71 33 83 50 and include your order reference if you have one. We will work with you to understand and resolve the issue.",
        ],
      },
      {
        title: "Website use and updates",
        paragraphs: [
          "Please use the website lawfully and provide information that is accurate to the best of your knowledge. We may update product details, prices, availability or these terms. The terms in force when we confirm an order apply to that order, subject to mandatory law.",
          "Danish law applies. Any mandatory consumer protections that apply to you continue to apply.",
        ],
      },
    ],
  },
  "/gdpr": {
    kicker: "YOUR DATA RIGHTS",
    title: "GDPR Rights Guide",
    intro: "You have rights over personal information Everest Butchery processes about you. The exact rights available depend on why and how the information is used.",
    sections: [
      {
        title: "Rights you can ask to use",
        bullets: [
          "Access: ask whether we use your personal information and request a copy, along with related information about the processing.",
          "Rectification: ask us to correct information that is inaccurate or incomplete.",
          "Erasure: ask us to delete information where the legal conditions are met. We may need to retain some order or accounting records where the law requires it.",
          "Restriction: ask us to limit certain uses while a matter is checked or where another legal condition applies.",
          "Objection: object to processing based on legitimate interests in circumstances covered by GDPR.",
          "Portability: in applicable cases, request the information you provided in a structured, commonly used, machine-readable format or ask us to transmit it to another controller where technically feasible.",
          "Consent: where we rely on your consent, withdraw it at any time. This will not make earlier processing unlawful.",
        ],
      },
      {
        title: "How to make a request",
        paragraphs: [
          "Email hello@everestbutchery.dk or write to Everest Butchery, Islevhusvej 9, 2700 København, Denmark. Tell us which right you want to use and enough information to help us locate your account or order. Do not send your password, sign-in code or recovery link. We may ask for reasonable information to verify your identity before disclosing personal data.",
          "We will respond without undue delay and normally within one month. If a request is complex or there are many requests, GDPR allows an extension in certain circumstances; we will tell you if that applies.",
        ],
      },
      {
        title: "If you are not satisfied",
        paragraphs: [
          <>You can complain to the Danish Data Protection Agency (Datatilsynet). See <a href="https://www.datatilsynet.dk/english/file-a-complaint" target="_blank" rel="noreferrer">how to file a complaint</a>. We encourage you to contact us first so we can address your concern.</>,
        ],
      },
      {
        title: "More detail",
        paragraphs: [<>Our <Link to="/privacy">Privacy Notice</Link> explains what information the site uses, why it is used, the providers involved and how long it is kept.</>],
      },
    ],
  },
};

export default function LegalPage() {
  const { pathname: path } = useLocation();
  const page = legalPages[path] || legalPages["/privacy"];

  return (
    <article className="section container page-shell legal-page">
      <header className="page-heading legal-heading">
        <span className="page-kicker">{page.kicker}</span>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        <small>Last updated: 5 October 2026</small>
      </header>
      <div className="legal-content">
        {page.sections.map((section) => (
          <section className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
      <p className="legal-contact">Questions? <Link to="/contact">Contact Everest Butchery</Link>.</p>
    </article>
  );
}
