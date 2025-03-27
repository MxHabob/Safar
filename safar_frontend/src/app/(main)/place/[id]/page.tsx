
type Props = {
	params: Promise<{ id: string}>
	
  }
  export default async function PlacePage({  params  }: Props) {
    const id = (await params).id
    return (
         <h1>Place Page{id}</h1> 
        );
}
 
