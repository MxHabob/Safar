import { CountriesPageContent } from "@/components/main/geographic/country";
type Props = {
	params: Promise<{ id: string}>
}

export default async function CountriesDetailsPage({ params }: Props) {
    const id = (await params).id
    return (
     <CountriesPageContent id={id}/>
    );
}
 
