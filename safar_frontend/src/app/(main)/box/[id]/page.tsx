
type Props = {
	params: Promise<{ id: string}>
	
  }

export default async function BoxPage({  params  }: Props) {
    const id = (await params).id
    return ( 
        <h1>Box Page Content{id}</h1>
     );
}
