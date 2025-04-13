type Props = {
	params: Promise<{ id: string}>
}

export default async function FlightsDetailsPage({  params  }: Props) {
    const id = (await params).id
    return (
        <></>
    );
}
 
