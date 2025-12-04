"use client";


import { DashboardPostViewHeader } from "@/pages/posts/components/dashboard-post-view-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";

export const DashboardPostView = ({ slug }: { slug: string }) => {
  const router = useRouter();

  const [ConfirmationDialog, confirm] = useConfirm(
    "Delete post",
    "Are you sure you want to delete this post?"
  );

  // const deleteFileMutation = useMutation(
  //   trpc.cloudflare.deleteFile.mutationOptions({
  //     onError: () => {
  //       toast.error("Failed to delete file");
  //     },
  //   })
  // );

  const handleRemove = async () => {
    const ok = await confirm();
    if (!ok) return;
    
  };

  return (
    <>
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <DashboardPostViewHeader
          title="Post Title"
          onRemove={handleRemove}
          onSave={() => {}}
        />
        {JSON.stringify("Post Content", null, 2)}
      </div>
      <ConfirmationDialog />
    </>
  );
};
