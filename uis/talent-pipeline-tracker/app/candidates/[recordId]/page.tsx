import { TalentPipelineTracker } from "@/components/talent-pipeline-tracker";
import { AuthGuard } from "@/components/auth-guard";

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;

  return <AuthGuard><TalentPipelineTracker initialRecordId={recordId} /></AuthGuard>;
}