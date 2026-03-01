import { catalog } from "../lib/catalog";
import { Dashboard } from "../components/dashboard";

export default function HomePage() {
  return <Dashboard series={catalog} />;
}
