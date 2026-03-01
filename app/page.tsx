import issues from "../data/new-mutants-issues.json";
import { Dashboard } from "../components/dashboard";

export default function HomePage() {
  return <Dashboard issues={issues} />;
}
