import MessageList from "@/components/global/message-list";
type Props = {
	params: Promise<{ userId: string}>
}

export default async function MessageDetailPage({ params }: Props ) {
    const userId = (await params).userId
    return(
        <><MessageList userId={userId} /></>
    )
}