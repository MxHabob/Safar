import MessageList from "@/components/global/message-list";

export default function MessageDetailPage({ params }: { params: { userId: string } }) {
   const userId = params.userId
    return(
        <><MessageList userId={userId} /></>
    )
}