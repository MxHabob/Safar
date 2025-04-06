import NotificationsPage from "@/components/section/settings/notifications";

type Props = {
	params: Promise<{ id: string}>
	
  }
  export default async function BoxPage({  params  }: Props) {
    const id = (await params).id
    return (
      <div >
      <NotificationsPage />
       </div>
  );
}
 
