import { ExperiencePageContent } from "@/components/section/experience";
type Props = {
	params: Promise<{ id: string}>
	
  }
  export default async function ExperiencePage({  params  }: Props) {
    const id = (await params).id
    return (
         <ExperiencePageContent id={id} />
        );
}
 
