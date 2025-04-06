import BoxPageContant from "@/components/section/box";
import BookingsPage from "@/components/section/settings/bookings";

type Props = {
	params: Promise<{ id: string}>
	
  }
  export default async function BoxPage({  params  }: Props) {
    const id = (await params).id
    return (
      <div >
      <BookingsPage />
       </div>
  );
}
 
