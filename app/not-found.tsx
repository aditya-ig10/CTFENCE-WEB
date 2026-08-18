import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Not found",
  description: "cf: route not found [404]",
  path: "/404",
});

export default function NotFound() {
  return (
    <main className="notfound-page">
      <h1 className="sr-only">Page not found — 404</h1>
      <img
        className="notfound-kitty"
        src="/404/404kitty.png"
        alt="404 kitty — the page you wanted is not here"
      />
    </main>
  );
}