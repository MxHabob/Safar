import ProfilePageContent from "@/components/section/settings/profile";


type Props = {
    params: Promise<{ id: string}>
    
  }
  export default async function ProfilePage({  params  }: Props) {
    return (
      <div >
      <ProfilePageContent />
       </div>
  );
}
 
