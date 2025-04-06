import ProfilePage from "@/components/section/settings/profile";

type Props = {
	params: Promise<{ id: string}>
	
  }
  export default async function BoxPage({  params  }: Props) {
    const id = (await params).id
    return (
      <div >
      <ProfilePage />
       </div>
  );
}
 
