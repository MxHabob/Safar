import { ChatInbox } from "@/components/section/settings/chat"


export default async function ChatPage() {
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Messages</h1>
      <ChatInbox />
    </div>
 )
}
