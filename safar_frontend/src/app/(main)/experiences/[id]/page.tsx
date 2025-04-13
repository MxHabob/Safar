import { ExperiencePageContent } from "@/components/main/experience";

type Props = {
	params: Promise<{ id: string}>
}

export default async function ExperienceDetailsPage({  params  }: Props) {
    const id = (await params).id
    return (
         <ExperiencePageContent id={id} />
        );
}
 
