type Props = {
	params: Promise<{ id: string}>
}


export default async function BookingDetailsPage({ params }: Props) {
    const id = (await params).id
    return(
        <h1>{id}</h1>
    )
}