import { RegionsPageContent } from "@/components/main/geographic/region";

type Props = {
	params: Promise<{ id: string}>
}

export default async function RegionsDetailsPage({ params }: Props) {
    const id = (await params).id
    return (
      <RegionsPageContent id={id}/>
    );
}
 
