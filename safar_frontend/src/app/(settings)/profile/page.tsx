import { ProfilePageContent } from "@/components/section/settings/profile";
import { PlayerCard } from "@/components/section/settings/profile/user-card";



type Props = {
    params: Promise<{ id: string}>
    
  }
  export default async function ProfilePage({  params  }: Props) {
    return (
      <div className=" w-[50vh]] h-[50vh] bg-gradient-to-b  flex flex-col ">
      {/* <ProfilePageContent/> */}
      <PlayerCard/>
      </div>
  );
}
 
