import StreamView from "@/app/components/StreamView";

export default async function Page({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  return <StreamView creatorId={creatorId} share={true} />;
}
