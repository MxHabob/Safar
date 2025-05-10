import { CityPageContent } from "@/components/main/geographic/city";

type Props = {
	params: Promise<{ id: string}>
}

export default async function CitiesDetailsPage({ params }: Props) {
    const id = (await params).id
    return (
     <CityPageContent id={id}/>
    );
}
 
