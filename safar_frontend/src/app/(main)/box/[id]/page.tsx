
type Props = {
	params: Promise<{ id: string}>
  }

export default async function BoxPage({  params  }: Props) {
    const id = (await params).id
    return ( 
      <div className=" items-center text-center mt-96">
        <h1 className=" font-bold text-lg" >Box Page Content{id}</h1>
      </div>
     );
}
