import { TalentPipelineTracker } from "@/components/talent-pipeline-tracker";
import { AuthGuard } from "@/components/auth-guard";

export default function HomePage() {
  return <AuthGuard><TalentPipelineTracker /></AuthGuard>;
}
