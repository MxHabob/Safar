import { ListExperience } from "@/components/global/experience-list";
import { Header } from "@/components/section/header";

export default function Home() {

  return (
    <main className="w-full h-full">
      <Header/>
      <ListExperience overlay={true} loop={true} />
    </main>
  );
}