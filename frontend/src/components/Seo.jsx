import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const siteUrl = (import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");
const defaultDescription = "Everest Butchery in Brønshøj, Copenhagen offers fresh halal goat, buffalo and chicken, plus Nepali pantry staples. Order online for pickup or delivery.";
const pages = {
  "/": ["Everest Butchery | Fresh Halal Meat in Copenhagen", defaultDescription],
  "/menu": ["Fresh Meat Menu | Everest Butchery Copenhagen", "Browse fresh halal goat, buffalo, chicken and Nepali pantry products from Everest Butchery in Copenhagen. Order for pickup or delivery."],
  "/about": ["About Everest Butchery | Nepali Butcher in Copenhagen", "Meet Everest Butchery, a family-run shop bringing fresh meat and Nepali flavours to Brønshøj and the Copenhagen community."],
  "/contact": ["Contact & Opening Hours | Everest Butchery Copenhagen", "Visit Everest Butchery at Islevhusvej 9, 2700 København. Open every day 10:00-19:00. Call +45 71 33 83 50."],
  "/dashain-offers": ["Dashain Meat Offers | Everest Butchery Copenhagen", "Explore Dashain offers and reserve fresh meat from Everest Butchery in Copenhagen."],
  "/cart": ["Your Cart | Everest Butchery", "Review your Everest Butchery order."],
  "/checkout": ["Checkout | Everest Butchery", "Complete your Everest Butchery pickup or delivery order."],
  "/order-confirmation": ["Order Confirmation | Everest Butchery", "Your Everest Butchery order details."],
  "/account": ["Customer Account | Everest Butchery", "Sign in to your Everest Butchery customer account or create an account."],
  "/admin": ["Admin | Everest Butchery", ""],
  "/admin-login": ["Admin Login | Everest Butchery", ""],
};
const privatePaths = new Set(["/cart", "/checkout", "/order-confirmation", "/account", "/admin", "/admin-login"]);

function setMeta(selector, attribute, key, content) {
  let element = document.head.querySelector(selector);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const [title, description] = pages[pathname] || ["Everest Butchery | Fresh Halal Meat in Copenhagen", defaultDescription];
    const canonical = siteUrl ? `${siteUrl}${pathname === "/" ? "/" : pathname}` : "";
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[name="robots"]', "name", "robots", privatePaths.has(pathname) ? "noindex, nofollow" : "index, follow");
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:image"]', "property", "og:image", siteUrl ? `${siteUrl}/logo.svg` : "");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="google-site-verification"]', "name", "google-site-verification", import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "");

    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.rel = "canonical";
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    } else {
      canonicalLink?.remove();
    }

    let structuredData = document.getElementById("everest-business-schema");
    if (pathname === "/" && siteUrl) {
      if (!structuredData) {
        structuredData = document.createElement("script");
        structuredData.id = "everest-business-schema";
        structuredData.type = "application/ld+json";
        document.head.appendChild(structuredData);
      }
      structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Store",
        name: "Everest Butchery",
        url: siteUrl,
        image: `${siteUrl}/logo.svg`,
        telephone: "+45 71 33 83 50",
        email: "hello@everestbutchery.dk",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Islevhusvej 9",
          postalCode: "2700",
          addressLocality: "København",
          addressCountry: "DK",
        },
        openingHoursSpecification: [{
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => `https://schema.org/${day}`),
          opens: "10:00",
          closes: "19:00",
        }],
      });
    } else {
      structuredData?.remove();
    }
  }, [pathname]);

  return null;
}
