import { ChatInbox } from "@/components/section/setting/chat"


export default async function ChatPage(params:type) {
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Messages</h1>
      <ChatInbox />
    </div>
 )
}
